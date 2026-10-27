// Read-only checks against a running workbench. Never sets credentials or starts production.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {discoverSkills} from '../workbench/skills.mjs';
import {LocalTools} from '../workbench/tools.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const base=process.argv[2] || 'http://127.0.0.1:3210';
const target=new URL(base);
assert(target.protocol==='http:' && target.hostname==='127.0.0.1','只允许检查本地工作台');
const checks=[];
for(const route of ['/','/app.js','/style.css']) {
  const r=await fetch(new URL(route,base));assert.equal(r.status,200,route);
  assert(Number(r.headers.get('content-length'))>0);checks.push(`${route} HTTP 200`);await r.body.cancel();
}
const state=await fetch(new URL('/api/state',base)).then(r=>r.json());
assert(!state.error);assert.equal(state.songs[0].cards.length,6);assert.equal(state.skills.length,4);
checks.push('实际工程：6 张卡片，4 个 Skill');
const song=state.songs[0];
const download=new URL('/api/artifact',base);download.search=new URLSearchParams({songId:song.id,file:song.promptPath,download:'1'});
const r=await fetch(download);assert.equal(r.status,200);assert(r.headers.get('content-disposition').includes('attachment'));
const md=await r.text();assert(md.includes(song.title));for(const c of song.cards)assert(md.includes(c.instructions));
checks.push('歌曲 prompt 下载与 6 张卡内容一致');
const badWrite=await fetch(new URL('/api/select',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({songId:song.id,cardId:'inventory'})});
assert.equal(badWrite.status,403);await badWrite.body.cancel();checks.push('缺少页面 token 的写入被拒绝');
// Exercise the actual missing-key path only when the application has no credential.
if(!state.credential.configured){
  const run=await fetch(new URL('/api/run',base),{method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Token':state.csrf},body:JSON.stringify({songId:song.id,cardId:song.active||'inventory'})});
  assert.equal(run.status,400);assert.match((await run.json()).error,/API Key/);checks.push('未填写 Key 时正确提示，不启动制作');
}
const skills=await discoverSkills(root), tools=new LocalTools(root,{skills});
for(const skill of skills){const loaded=await tools.call('read_skill',{id:skill.id});assert(loaded.content.length>100);assert(loaded.resources.length>1);}
assert.equal(tools.loadedSkills.size,4);checks.push('本地工具完整读取四类真实 Skill 入口及资源目录');
const python=await tools.call('run_script',{runtime:'python',file:'workflow_runner.py',args:['status']});
assert.equal(python.exitCode,0);JSON.parse(python.output);checks.push('本地 Python 脚本工具正常，中文输出与环境可用');
const after=await fetch(new URL('/api/state',base)).then(r=>r.json());
assert.deepEqual(after.songs,state.songs);checks.push('短测前后卡片、聊天和任务状态未变');
const report={at:new Date().toISOString(),result:'passed',checks,credentialConfigured:state.credential.configured,
  realAPI:'not tested: no real credential used',browserVisual:'not tested: browser control unavailable'};
await fs.mkdir(path.join(root,'workflow/stages'),{recursive:true});
await fs.writeFile(path.join(root,'workflow/stages/workbench-short-smoke.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
