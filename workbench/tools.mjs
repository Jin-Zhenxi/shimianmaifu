import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {atomic} from './store.mjs';

const str = {type: 'string'};
const define = (name, description, properties, required = Object.keys(properties)) => ({type: 'function', function: {
  name, description, parameters: {type: 'object', properties, required, additionalProperties: false}}});
export const fileTools = [
  define('list_skills', '列出已启用的全部 Skill。根据当前任务选择互补技能，不要因为默认主流程就忽略导演、动画或工程规范。', {}),
  define('read_skill', '完整读取一个已启用 Skill 的入口，并列出其参考文件与脚本目录。后续通过 read_file 分页读取所需参考。', {id:str}),
  define('list_files', '列出工作区目录（不递归），自动隐藏凭证、环境和缓存目录。', {directory: str}),
  define('read_file', '读取工作区文本。分页读取长文件；Skill 入口必须读完整。', {file: str, offset: {type:'integer'}, length: {type:'integer'}}),
];
export const productionTools = [...fileTools,
  define('write_file', '写工作区文本，旧文件自动留历史副本。不能修改环境、凭证、工具后台或已交付视频。', {file: str, content: str}),
  define('run_script', '运行项目里的 Python、Node 或 PowerShell 脚本。参数使用数组，不经过 shell。可先 write_file 创建脚本。无操作系统沙箱，仅对受信任项目使用。',
    {runtime: {type:'string', enum:['python','node','powershell']}, file: str, args: {type:'array', items:str}}),
  define('media_probe', '用 FFprobe 检查工作区音视频文件的流信息与时长。', {file: str}),
  define('inspect_image', '读取工作区 PNG/JPEG/WebP，将图片交给视觉模型检查；不支持视觉的模型不能伪称看过。', {file: str}),
  define('fetch_page', '获取公开 HTTPS 页面文本供资料查证，不携带 API 凭证。', {url: str}),
  define('finish_stage', '实际完成或需要用户查看时结束当前卡。completed 必须提供真实文件；needs_review 提供样片等用户确认；blocked 说明缺失条件。', {
    status: {type:'string', enum:['completed','needs_review','blocked']}, summary: str,
    artifacts: {type:'array', items:str}, checks: {type:'array', items:str}}),
];

const hidden = new Set(['.git','.codex','.aws','.conda','.cache','node_modules','workbench','workbench-tests']);
export function allowedRelative(rel) {
  return typeof rel === 'string' && !path.isAbsolute(rel) && !rel.includes(':') && !rel.includes('\0') &&
    !rel.split(/[\\/]/).some(p => p === '..' || hidden.has(p.toLowerCase()) || /^(\.env|auth\.|credentials?|.*\.(pem|key|dpapi)$)/i.test(p));
}
export class LocalTools {
  constructor(root, {signal, log = () => {}, redact = s => s, model = 'deepseek-flash', skills = null} = {}) {
    this.root = path.resolve(root); this.signal = signal; this.log = log; this.redact = redact; this.model = model;
    this.inspected = new Set(); this.written = new Set(); this.executed = 0;
    this.skills = skills; this.loadedSkills = new Set();
  }
  async resolve(rel, {write = false} = {}) {
    if (!allowedRelative(rel)) throw Error('路径必须位于项目内，且不能访问凭证、环境或后台程序');
    const full = path.resolve(this.root, rel);
    if (full !== this.root && !full.startsWith(this.root + path.sep)) throw Error('路径超出工作区');
    const normalized = rel.replaceAll('\\','/');
    if (this.skills && normalized.startsWith('.agents/skills/') && !this.skills.some(s=>normalized === s.entry.slice(0,-'/SKILL.md'.length) || normalized.startsWith(s.entry.slice(0,-'SKILL.md'.length)))) throw Error('这个 Skill 尚未启用，请在能力库启用后使用');
    if (write && (rel.split(/[\\/]/).includes('.agents') || /(^|[\\/])mv-r\d+\.mp4$/i.test(rel) || /^workflow[\\/]workbench([\\/]|$)/i.test(rel))) throw Error('该文件由系统管理或属于已有交付');
    let current = full;
    while (true) {
      try {
        const real = await fs.realpath(current);
        if (real !== this.root && !real.startsWith(this.root + path.sep)) throw Error('不允许通过链接访问工作区外的文件');
        break;
      } catch (e) { if (e.code !== 'ENOENT') throw e; const parent = path.dirname(current); if (parent === current) throw e; current = parent; }
    }
    return full;
  }
  async call(name, args) {
    this.signal?.throwIfAborted();
    if (name === 'list_skills') return this.skills || [];
    if (name === 'read_skill') {
      const skill = this.skills?.find(s=>s.id === args.id); if (!skill) throw Error('Skill 未找到或尚未启用');
      const file = await this.resolve(skill.entry);
      const content = await fs.readFile(file,'utf8');
      if (content.length > 150000) throw Error('Skill 入口过长，请通过 read_file 分页读取完整内容');
      this.loadedSkills.add(skill.id); this.log(`加载 Skill · ${skill.label}`,{skillId:skill.id});
      const resources = await fs.readdir(path.dirname(file),{withFileTypes:true});
      return {entry:skill.entry,content:this.redact(content),resources:resources.map(e=>({path:skill.entry.replace(/SKILL\.md$/,e.name),directory:e.isDirectory()}))};
    }
    this.log(`${({list_files:'查看目录', read_file:'读取', write_file:'保存', run_script:'运行脚本',media_probe:'检查媒体',inspect_image:'检查画面',fetch_page:'查阅资料'})[name] || name} ${args.file || args.directory || ''}`);
    if (name === 'list_files') {
      const dir = await this.resolve(args.directory || '.');
      const entries = await fs.readdir(dir, {withFileTypes:true});
      return entries.filter(e => allowedRelative(path.relative(this.root, path.join(dir, e.name)))).slice(0,400).map(e => ({name:e.name,directory:e.isDirectory()}));
    }
    if (name === 'read_file') {
      const file = await this.resolve(args.file); const stat = await fs.stat(file);
      if (stat.size > 3_000_000 || !/\.(md|txt|json|js|mjs|cjs|ts|tsx|jsx|html|css|py|ps1|srt|csv|toml|xml)$/i.test(file)) throw Error('请选择小于 3MB 的文本文件');
      const text = await fs.readFile(file, 'utf8'); const offset = Math.max(0, Number(args.offset) || 0), length = Math.min(30000, Math.max(1, Number(args.length) || 12000));
      return {text:this.redact(text.slice(offset, offset + length)), total:text.length, next:offset + length < text.length ? offset + length : null};
    }
    if (name === 'write_file') {
      if (typeof args.content !== 'string' || args.content.length > 300000) throw Error('文本写入超过限制');
      if (!/\.(md|txt|json|js|mjs|cjs|ts|tsx|jsx|html|css|py|ps1|srt|csv)$/i.test(args.file)) throw Error('只能写入项目文本或脚本');
      const file = await this.resolve(args.file, {write:true});
      const old = await fs.readFile(file).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
      if (old) {
        const backup = path.join(this.root, 'workflow/history', `${Date.now()}-${Math.random().toString(16).slice(2)}`, args.file);
        await fs.mkdir(path.dirname(backup), {recursive:true}); await fs.writeFile(backup, old);
      }
      await atomic(file, this.redact(args.content)); this.written.add(args.file.replaceAll('\\','/'));
      return {saved:args.file};
    }
    if (name === 'run_script') {
      const file = await this.resolve(args.file);
      if (!Array.isArray(args.args) || args.args.length > 80 || args.args.some(a => typeof a !== 'string' || a.length > 4000)) throw Error('脚本参数必须是字符串数组');
      let exe, argv;
      if (args.runtime === 'python' && /\.py$/i.test(file)) { exe = path.join(this.root,'.conda/mv/python.exe'); try { await fs.access(exe); } catch { exe = process.platform === 'win32' ? 'python' : 'python3'; } argv = [file,...args.args]; }
      else if (args.runtime === 'node' && /\.[mc]?js$/i.test(file)) { exe = process.execPath; argv = [file,...args.args]; }
      else if (args.runtime === 'powershell' && /\.ps1$/i.test(file)) { exe = 'powershell.exe'; argv = ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',file,...args.args]; }
      else throw Error('脚本类型与运行环境不匹配');
      this.executed++; return this.run(exe, argv);
    }
    if (name === 'media_probe') {
      const file = await this.resolve(args.file); const bundled = path.join(this.root,'.conda/mv/Library/bin/ffprobe.exe');
      const exe = await fs.access(bundled).then(() => bundled, () => 'ffprobe');
      return this.run(exe, ['-v','error','-show_format','-show_streams','-of','json',file], 60000);
    }
    if (name === 'inspect_image') {
      if (this.model !== 'deepseek-flash') throw Error('当前模型未启用图片输入；请选择 DeepSeek Flash 检查画面');
      const file = await this.resolve(args.file); const ext = path.extname(file).toLowerCase();
      if (!['.png','.jpg','.jpeg','.webp'].includes(ext) || (await fs.stat(file)).size > 8_000_000) throw Error('图片格式不支持或大于 8MB');
      this.inspected.add(args.file.replaceAll('\\','/'));
      return {image: `data:image/${ext === '.jpg' ? 'jpeg' : ext.slice(1)};base64,${(await fs.readFile(file)).toString('base64')}`};
    }
    if (name === 'fetch_page') {
      // Restrict fetch to public HTTPS names; reject redirects to prevent private-network redirects.
      const u = new URL(args.url);
      if (u.protocol !== 'https:' || u.port || u.username || u.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) || /(^|\.)(localhost|local|internal|test|invalid)$/i.test(u.hostname)) throw Error('只支持公开 HTTPS 网页');
      const {lookup} = await import('node:dns/promises');
      const addresses = await lookup(u.hostname, {all:true});
      if (addresses.some(a => a.family !== 4 || /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|22[4-9]\.|2[3-5]\d\.)/.test(a.address))) throw Error('不允许访问本机或内网地址');
      const response = await fetch(u, {redirect:'error', signal:AbortSignal.any([this.signal || new AbortController().signal, AbortSignal.timeout(30000)])});
      if (!response.ok) throw Error(`网页 HTTP ${response.status}`);
      const body = await limitedText(response, 1_000_000);
      return {url:u.href, text:body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,20000)};
    }
    throw Error('未知工具');
  }
  async run(exe, args, timeout = 30 * 60 * 1000) {
    return new Promise((resolve, reject) => {
      const env = {...process.env};
      for (const name of Object.keys(env)) if (/API.?KEY|TOKEN|SECRET|PASSWORD/i.test(name)) delete env[name];
      env.PYTHONIOENCODING = 'utf-8'; env.PYTHONUTF8 = '1';
      const pathKey = Object.keys(env).find(k=>k.toLowerCase()==='path') || 'PATH';
      env[pathKey] = [path.join(this.root,'.conda/mv'),path.join(this.root,'.conda/mv/Scripts'),path.join(this.root,'.conda/mv/Library/bin'),path.join(this.root,'node_modules/.bin'),env[pathKey] || ''].join(path.delimiter);
      const child = spawn(exe, args, {cwd:this.root, windowsHide:true, shell:false, env, stdio:['ignore','pipe','pipe']});
      let output = '', settled = false;
      const stop = () => {
        if (process.platform === 'win32' && child.pid) {
          const killer = spawn('taskkill.exe', ['/pid',String(child.pid),'/T','/F'], {windowsHide:true,stdio:'ignore'}); killer.on('error',()=>{});
        } else child.kill('SIGTERM');
      };
      const abort = () => { stop(); done(Error('任务已停止')); };
      const timer = setTimeout(() => { stop(); done(Error('脚本运行超时，留在当前卡片')); }, timeout);
      const done = (err, result) => { if (settled) return; settled = true; clearTimeout(timer); this.signal?.removeEventListener('abort', abort); err ? reject(err) : resolve(result); };
      this.signal?.addEventListener('abort', abort, {once:true});
      const append = b => { output = (output + this.redact(b.toString())).slice(-24000); };
      child.stdout.on('data', append); child.stderr.on('data', append);
      child.on('error', e => done(Error(`无法启动 ${path.basename(exe)}：${e.code || '运行错误'}`)));
      child.on('close', code => done(null, {exitCode:code, output}));
      if (this.signal?.aborted) abort();
    });
  }
}
export async function limitedText(response, max) {
  const reader = response.body.getReader(); let size = 0, chunks = [];
  try { while (true) { const {value,done} = await reader.read(); if (done) break; size += value.length; if (size > max) throw Error('响应内容超过大小限制'); chunks.push(Buffer.from(value)); } }
  finally { await reader.cancel().catch(()=>{}); }
  return Buffer.concat(chunks).toString('utf8');
}
