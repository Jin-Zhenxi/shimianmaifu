import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';
import {Store, fields, promptPath, atomic, textValue} from './store.mjs';
import {Vault} from './vault.mjs';
import {runAgent} from './agent.mjs';
import {LocalTools} from './tools.mjs';
import {discoverSkills} from './skills.mjs';
import {importSong} from './import-song.mjs';

const webRoot = fileURLToPath(new URL('./public/', import.meta.url));
const MIME = {'.mp3':'audio/mpeg','.wav':'audio/wav','.flac':'audio/flac','.m4a':'audio/mp4','.aac':'audio/aac','.ogg':'audio/ogg','.opus':'audio/ogg','.aiff':'audio/aiff','.aif':'audio/aiff','.txt':'text/plain; charset=utf-8','.lrc':'text/plain; charset=utf-8','.srt':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'};
const isRunning = j => j.status === 'running';
function equal(a,b) { if (typeof a !== 'string' || a.length !== b.length) return false; return timingSafeEqual(Buffer.from(a),Buffer.from(b)); }
export async function createWorkbench({root = fileURLToPath(new URL('../',import.meta.url)), vault = new Vault(), agent = runAgent} = {}) {
  root = path.resolve(root);
  const store = new Store(root); await store.init(); await vault.init();
  let skills = await discoverSkills(root);
  for (const song of store.state.songs) await store.export(song);
  const csrf = randomBytes(32).toString('hex'); const controllers = new Map();
  const running = () => store.state.songs.some(s=>s.jobs.some(isRunning));
  let serial = Promise.resolve();
  const transact = fn => { const pending = serial.then(fn); serial = pending.catch(()=>{}); return pending; };
  const snapshot = () => ({songs:store.state.songs.map(s=>({...s,promptPath:promptPath(s)})),skills,credential:vault.status(),csrf});
  const json = (res,data,status=200) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(data)); };
  async function body(req) {
    let bytes = 0, chunks = [];
    for await (const chunk of req) { bytes += chunk.length; if (bytes > 500000) throw Error('请求内容过大'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Error('请求格式错误'); }
  }
  async function advance(song, card) {
    card.status = 'completed';
    song.active = song.cards.find(c=>c.status !== 'completed')?.id || null;
    song.revision++;
    // Persist the workflow result before clearing the in-memory credential.
    await store.export(song); await store.save();
    await atomic(path.join(root,'workflow/state.json'),JSON.stringify({completed:song.cards.filter(c=>c.status==='completed').map(c=>c.id),active:song.active},null,2)+'\n');
    if (!song.active) vault.complete();
  }
  async function execute(song,card,job,message,controller) {
    try {
      const log = (text,details={}) => {
        if (job.status !== 'running') return;
        job.progress = vault.redact(text); job.events.push({at:new Date().toISOString(),text:job.progress});
        job.events = job.events.slice(-120);
        if (details.skillId && !(job.skills ||= []).includes(details.skillId)) job.skills.push(details.skillId);
      };
      const result = await agent({root,manifest:store.manifest,song:structuredClone(song),card:structuredClone(card),kind:job.kind,message,vault,signal:controller.signal,log});
      await transact(async()=>{
        if (job.status !== 'running' || controller.signal.aborted) return;
        job.finishedAt = new Date().toISOString(); job.status = 'succeeded'; job.totalTokens = result.totalTokens || 0;
        if (job.kind === 'revise') {
          const before = Object.fromEntries(fields.map(f=>[f,card[f]]));
          for (const f of fields) card[f] = result.updated[f];
          card.chat.push({role:'assistant',text:result.reply,at:job.finishedAt,changes:result.edits});
          card.status = 'pending'; song.revision++;
          await atomic(path.join(root,`workflow/stages/${song.id}/${Date.now()}-${card.id}-revision.json`), JSON.stringify({before,after:result.updated,edits:result.edits},null,2));
        } else {
          card.result = result; card.status = result.status === 'blocked' ? 'blocked' : 'review';
          card.reviewText = null;
          if (card.id === 'analysis' && card.status === 'review') {
            const file = result.artifacts.find(a=>/\.srt$/i.test(a)) || result.artifacts.find(a=>/\.(lrc|txt)$/i.test(a));
            if (file) {
              const full = await new LocalTools(root).resolve(file);
              const stat = await fs.stat(full);
              if (stat.size <= 1_000_000) card.reviewText = {path:file,text:vault.redact(await fs.readFile(full,'utf8'))};
            }
          }
          await atomic(path.join(root,`workflow/stages/${song.id}/${job.id}-${card.id}.md`),
            `# ${card.title}\n\n状态：${result.status}\n\n${result.summary}\n\n## 产物\n\n${result.artifacts.map(a=>`- ${a}`).join('\n')}\n\n## 检查\n\n${result.checks.map(c=>`- ${c}`).join('\n')}\n`);
          song.revision++;
        }
        await store.export(song); await store.save();
      });
    } catch (e) {
      await transact(async()=>{
        if (job.status !== 'running') return;
        job.status = controller.signal.aborted ? 'cancelled' : 'failed'; job.error = vault.redact(e.message); job.finishedAt = new Date().toISOString(); card.status = 'pending'; await store.save();
      });
    } finally { controllers.delete(job.id); }
  }
  const server = http.createServer(async(req,res)=>{
    try {
      // No cross-origin API or wildcard binding; mitigate browser requests to localhost services.
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || '')) return json(res,{error:'无效主机'},403);
      const origin = req.headers.origin;
      if (origin && origin !== `http://${req.headers.host}`) return json(res,{error:'不允许跨域访问'},403);
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === '/api/state' && req.method === 'GET') { await serial; return json(res,snapshot()); }
      if (url.pathname === '/api/songs/import' && req.method === 'POST') {
        if (!equal(req.headers['x-workbench-token'],csrf) || !req.headers['content-type']?.startsWith('multipart/form-data;')) return json(res,{error:'页面会话已过期，请刷新'},403);
        let createdSongId;
        await transact(async()=>{
          if (running()) throw Error('后台正在处理任务，请等完成后再添加歌曲');
          createdSongId = await importSong(req,store,s=>vault.redact(s));
        });
        return json(res,{...snapshot(),createdSongId});
      }
      if (url.pathname.startsWith('/api/') && req.method === 'POST') {
        if (!equal(req.headers['x-workbench-token'],csrf) || !req.headers['content-type']?.startsWith('application/json')) return json(res,{error:'页面会话已过期，请刷新'},403);
        const data = await body(req);
        let launch;
        await transact(async()=>{
          if (url.pathname === '/api/credentials') {
            if (running()) throw Error('任务运行中，请先停止再更换凭证');
            await vault.set(data.key,data.mode,data.model); return;
          }
          if (url.pathname === '/api/credentials/clear') {
            if (running()) throw Error('任务运行中，请先停止再清除凭证');
            await vault.clear(); return;
          }
          if (url.pathname === '/api/skills/rescan') {
            if (running()) throw Error('任务运行中，请稍后再刷新能力库');
            skills = await discoverSkills(root); return;
          }
          const song = store.song(data.songId);
          if (url.pathname === '/api/cancel') {
            const job = song.jobs.find(isRunning); if (!job) throw Error('没有正在运行的任务');
            job.status = 'cancelled'; job.error = '任务已停止，已生成文件保留。'; job.finishedAt = new Date().toISOString(); controllers.get(job.id)?.abort();
            store.card(song,job.cardId).status = 'pending'; await store.save(); return;
          }
          if (running()) throw Error('后台正在处理任务，请等完成后再修改');
          if (url.pathname === '/api/save') {
            // Validate on a copy so rejected requests never partly mutate live state.
            const draft = structuredClone(song);
            if (data.enabledSkills !== undefined) {
              if (!Array.isArray(data.enabledSkills) || data.enabledSkills.some(id=>!skills.some(s=>s.id===id))) throw Error('选择的 Skill 不在能力库中');
              draft.enabledSkills = [...new Set(data.enabledSkills)];
            }
            await store.update(draft,{...data,
              number:data.number === undefined ? undefined : vault.redact(data.number),title:data.title === undefined ? undefined : vault.redact(data.title),
              outline:data.outline === undefined ? undefined : vault.redact(data.outline),
              card:data.card && Object.fromEntries(Object.entries(data.card).map(([k,v])=>[k,typeof v === 'string' ? vault.redact(v) : v]))});
            Object.assign(song,draft); await store.save(); return;
          }
          const card = store.card(song,data.cardId);
          if (url.pathname === '/api/select') { song.active = card.id; await store.save(); return; }
          if (url.pathname === '/api/reopen') {
            // Reopening an earlier production stage invalidates downstream completion.
            for (const c of song.cards.slice(song.cards.indexOf(card))) { c.status = 'pending'; c.result = null; }
            song.active = card.id; song.revision++; await store.save();
            await atomic(path.join(root,'workflow/state.json'),JSON.stringify({completed:song.cards.filter(c=>c.status==='completed').map(c=>c.id),active:song.active},null,2)+'\n');return;
          }
          if (['/api/approve','/api/review/save'].includes(url.pathname)) {
            if (card.status !== 'review') throw Error('当前卡没有待确认的制作结果');
            if (song.cards.slice(0,song.cards.indexOf(card)).some(c=>c.status!=='completed')) throw Error('请先确认前面的步骤');
            if (card.reviewText) {
              if (data.revision !== song.revision) throw Error('结果已更新，请刷新后再确认');
              const text = vault.redact(textValue(data.reviewText,300000));
              if (!text.trim()) throw Error('歌词不能为空');
              const file = await new LocalTools(root).resolve(card.reviewText.path,{write:true});
              await atomic(path.join(root,`workflow/history/${randomUUID()}/lyrics-before-review.txt`),card.reviewText.text);
              await atomic(file,text);card.reviewText.text=text;
            }
            if (url.pathname === '/api/review/save') { song.revision++;await store.export(song);await store.save();return; }
            card.reviewedAt = new Date().toISOString(); await advance(song,card); return;
          }
          if (!['/api/revise','/api/run','/api/feedback'].includes(url.pathname)) throw Error('未知操作');
          if (!vault.key) throw Error('请先填写 DeepSeek API Key');
          if (card.status === 'completed') throw Error('当前卡已完成，请先重新制作');
          const index = song.cards.indexOf(card);
          if (url.pathname !== '/api/revise' && song.cards.slice(0,index).some(c=>c.status !== 'completed')) throw Error('请先查看并确认前面的步骤');
          if (url.pathname === '/api/run' && card.id !== 'inventory' && !song.outline.trim()) throw Error('本次大纲尚未填写，请先填写并保存');
          if (url.pathname === '/api/feedback' && (card.status!=='review' || !['story','scenes'].includes(card.id))) throw Error('当前没有可修改的分镜或样片结果');
          const message = ['/api/revise','/api/feedback'].includes(url.pathname) ? vault.redact(textValue(data.message,8000)).trim() : '';
          if (url.pathname === '/api/feedback' && !message) throw Error('请填写修改意见');
          if (url.pathname === '/api/revise' && !message) throw Error('请填写修改要求');
          if (message) card.chat.push({role:'user',text:message,at:new Date().toISOString()});
          const job = {id:randomUUID(),cardId:card.id,kind:url.pathname==='/api/revise' ? 'revise':'produce',status:'running',startedAt:new Date().toISOString(),progress:'正在连接 DeepSeek…',events:[],skills:[]};
          song.jobs = [...song.jobs.slice(-19),job]; card.status = 'running'; song.active = card.id;
          await store.export(song); await store.save();
          const controller = new AbortController(); controllers.set(job.id,controller);
          launch = ()=>execute(song,card,job,message,controller);
        });
        json(res,snapshot()); if (launch) setImmediate(launch); return;
      }
      if (url.pathname === '/api/artifact' && req.method === 'GET') {
        const song = store.song(url.searchParams.get('songId'));
        const rel = url.searchParams.get('file');
        const artifacts = song.cards.flatMap(c=>c.result?.artifacts || []);
        const inputs = [song.source?.audio.path,song.source?.lyrics?.path].filter(Boolean);
        if (rel !== promptPath(song) && !artifacts.includes(rel) && !inputs.includes(rel)) throw Error('该文件未列为工作流产物');
        const tools = new LocalTools(root); const file = await tools.resolve(rel);
        return await serveFile(req,res,file,Boolean(url.searchParams.get('download')));
      }
      const staticFiles = {'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
      if (req.method !== 'GET' || !staticFiles[url.pathname]) return json(res,{error:'页面不存在'},404);
      return await serveFile(req,res,path.join(webRoot,staticFiles[url.pathname]));
    } catch (e) { if (!res.headersSent) json(res,{error:vault.redact(e.message)},400); else res.destroy(); }
  });
  server.requestTimeout = 30000;
  const checkpoint = setInterval(()=>{ if (running()) transact(()=>store.save()).catch(()=>{}); },2000); checkpoint.unref();
  async function close() {
    clearInterval(checkpoint); for (const controller of controllers.values()) controller.abort();
    await transact(async()=>{
      for (const song of store.state.songs) for (const job of song.jobs.filter(isRunning)) { job.status = 'interrupted'; job.error = '后台服务已退出，请重新启动后重试'; store.card(song,job.cardId).status = 'pending'; }
      await store.save(); vault.dispose();
    });
    server.closeAllConnections(); await new Promise(resolve=>server.close(resolve));
  }
  return {server,store,vault,close};
}
async function serveFile(req,res,file,download=false) {
  const stat = await fs.stat(file); const size = stat.size; const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
  if (download) headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(file))}`;
  let start = 0, end = size - 1;
  if (req.headers.range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if (!match || Number(match[1]) >= size) { res.writeHead(416,{'Content-Range':`bytes */${size}`}); res.end(); return; }
    start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]),size - 1) : end;
    if (end < start) { res.writeHead(416); res.end(); return; }
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Accept-Ranges'] = 'bytes'; headers['Content-Length'] = Math.max(0,end-start+1);
  res.writeHead(req.headers.range ? 206 : 200,headers);
  const {createReadStream} = await import('node:fs');
  const stream = createReadStream(file,{start,end:Math.max(start,end)}); stream.on('error',()=>res.destroy()); res.on('close',()=>stream.destroy()); stream.pipe(res);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await createWorkbench(); const port = Number(process.env.MV_WORKBENCH_PORT || 3210);
  app.server.on('error',err=>{ console.error(err.code === 'EADDRINUSE' ? `端口 ${port} 已占用。请打开现有工作台，或设置 MV_WORKBENCH_PORT。` : err.message); process.exit(1); });
  app.server.listen(port,'127.0.0.1',()=>{
    console.log(`MV 工作台：http://127.0.0.1:${port}\nDeepSeek 直连 · 在页面填写 API Key · Ctrl+C 退出`);
    if (process.env.MV_WORKBENCH_OPEN === '1' && process.platform === 'win32') {
      import('node:child_process').then(({spawn})=>{const opener=spawn('explorer.exe',[`http://127.0.0.1:${port}`],{windowsHide:true,stdio:'ignore'});opener.on('error',()=>{});opener.unref();});
    }
  });
  let closing = false;
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{ if (closing) return; closing=true; await app.close(); process.exit(0); });
}
