// Opt-in real API smoke: key arrives on stdin, never in files or argv.
// Uses a disposable project and stops after inventory; never renders a video.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createWorkbench} from '../workbench/server.mjs';
import {Vault} from '../workbench/vault.mjs';
import {runAgent,deepseekRequest} from '../workbench/agent.mjs';

const project=fileURLToPath(new URL('../',import.meta.url));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(project,'workflow/stages',`workbench-real-smoke-${stamp}`);
const report={at:new Date().toISOString(),result:'running',model:'deepseek-flash',checks:[],apiRequests:0,totalTokens:0,toolCalls:[],scope:'isolated inventory only; no audio/video rendering',browserVisual:'not tested'};
const fingerprint=async file=>fs.readFile(file).then(b=>createHash('sha256').update(b).digest('hex'),e=>e.code==='ENOENT'?null:Promise.reject(e));
const watched=['workflow/workbench/state.json','mv-workflow/outline.md','mv/index.html','mv/full-engine.js','character.js'];
const before=await Promise.all(watched.map(f=>fingerprint(path.join(project,f))));
const root=await fs.mkdtemp(path.join(os.tmpdir(),'mv-workbench-real-smoke-'));
const vaultFile=path.join(root,'credential.dpapi');
let key='',app,base,csrf,songId,deadline;
const vault=new Vault({file:vaultFile});
const print=s=>console.log(vault.redact(s));
const check=s=>{report.checks.push(s);print(`PASS ${s}`);};
const snapshot=()=>fetch(`${base}/api/state`).then(r=>r.json());
async function post(route,data={}) {
  const response=await fetch(`${base}/api/${route}`,{method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Token':csrf},body:JSON.stringify(data)});
  return {status:response.status,body:await response.json()};
}
async function waitJob() {
  while(true) {
    const s=await snapshot(),j=s.songs[0].jobs.at(-1);
    if(j.status!=='running') {assert.equal(j.status,'succeeded',j.error);report.totalTokens+=j.totalTokens;return s;}
    await new Promise(r=>setTimeout(r,250));
  }
}
async function scan(dir) {
  for(const e of await fs.readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,e.name);
    if(e.isDirectory())await scan(file);
    else assert(!(await fs.readFile(file)).includes(Buffer.from(key)),'credential found on disk');
  }
}
try {
  print('Waiting for temporary API key on stdin (input is not echoed).');
  const input=readline.createInterface({input:process.stdin,terminal:false});
  key=await new Promise((resolve,reject)=>{input.once('line',resolve);input.once('close',()=>reject(Error('No key supplied')));});
  input.close();key=key.trim();
  assert(/^sk-[A-Za-z0-9_-]{8,300}$/.test(key),'Invalid key format');
  for(const f of ['AGENTS.md','README.md','mv/README.md','song.md','mv-workflow/outline.md','mv-workflow/workflow.json','workflow_runner.py']) {
    await fs.mkdir(path.dirname(path.join(root,f)),{recursive:true});await fs.copyFile(path.join(project,f),path.join(root,f));
  }
  await fs.cp(path.join(project,'.agents/skills'),path.join(root,'.agents/skills'),{recursive:true});
  const agent=options=>runAgent({...options,request:async(secret,body,signal)=>{
    assert(++report.apiRequests<=8,'Smoke API request limit reached');
    print(`DeepSeek real request ${report.apiRequests}`);
    const result=await deepseekRequest(secret,{...body,max_tokens:1600},signal);
    for(const call of result.choices[0].message.tool_calls||[]) {
      report.toolCalls.push(call.function.name);print(`Tool: ${call.function.name}`);
    }
    return result;
  }});
  app=await createWorkbench({root,vault,agent});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${app.server.address().port}`;
  let state=await snapshot();csrf=state.csrf;songId=state.songs[0].id;
  for(const route of ['/','/app.js','/style.css']) {const r=await fetch(base+route);assert.equal(r.status,200);await r.body.cancel();}
  assert.equal(state.songs[0].cards.length,6);assert.equal(state.skills.length,4);
  check('Real server assets, six cards and four project Skills');
  assert.equal((await post('credentials',{key,mode:'temporary',model:report.model})).status,200);
  await assert.rejects(fs.stat(vaultFile),{code:'ENOENT'});
  check('Temporary credential configured in backend memory only');
  const instructions='仅做隔离 smoke 项目盘点，不制作 MV，不分析歌曲，不运行渲染。smoke 待检。必须用 read_skill 额外完整读取 song-video-director，再用 run_script 运行 workflow_runner.py status（python），最后用 write_file 写 workflow/stages/smoke-inventory.md，简述当前文件、缺失大纲和脚本结果。报告不要超过 300 字。只把这份报告列为产物，finish_stage completed 后停止。无需生成图片或音视频。';
  assert.equal((await post('save',{songId,revision:0,card:{id:'inventory',instructions}})).status,200);
  const unchanged=(await snapshot()).songs[0].cards[0];
  deadline=setTimeout(()=>{post('cancel',{songId}).catch(()=>{});},180000);
  assert.equal((await post('revise',{songId,cardId:'inventory',message:'这是短 smoke：只把 instructions 中唯一原文“smoke 待检”替换为“smoke 已检”，其余任何文字和字段逐字保留。直接 finish_revision。'})).status,200);
  state=await waitJob();
  const revised=state.songs[0].cards[0];
  assert.equal(revised.instructions,instructions.replace('smoke 待检','smoke 已检'));
  assert.equal(revised.goal,unchanged.goal);assert.equal(revised.checks,unchanged.checks);
  assert.equal(state.songs[0].active,'inventory');
  check('Real DeepSeek chat tool call, precise local edit and prompt persistence');
  const prompt=await fs.readFile(path.join(root,state.songs[0].promptPath),'utf8');assert(prompt.includes('smoke 已检'));
  assert.equal((await post('run',{songId,cardId:'inventory'})).status,200);
  state=await waitJob();
  const song=state.songs[0],card=song.cards[0];
  assert.equal(card.status,'completed');assert.equal(song.active,'analysis');
  assert(song.cards.slice(1).every(c=>c.status==='pending'));
  assert(report.toolCalls.includes('read_skill'));assert(report.toolCalls.includes('run_script'));assert(report.toolCalls.includes('write_file'));
  assert(card.result.usedSkills.some(id=>id.includes('song-video-director')));
  assert(card.result.usedSkills.some(id=>id.includes('music-mv')));
  const record=await fs.readFile(path.join(root,'workflow/stages/smoke-inventory.md'),'utf8');
  assert(record.trim().length>20);assert(card.result.artifacts.includes('workflow/stages/smoke-inventory.md'));
  report.usedSkills=card.result.usedSkills;report.inventorySummary=card.result.summary;
  check('Real model loads multiple Skills, runs local Python and writes a verified artifact');
  check('Inventory automatically advances to analysis; all later stages remain pending');
  const blocked=await post('run',{songId,cardId:'analysis'});
  assert.equal(blocked.status,400);assert.match(blocked.body.error,/大纲/);
  check('Missing outline prevents subsequent production');
  await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'inventory.md'),record);
  const downloaded=await fetch(`${base}/api/artifact?${new URLSearchParams({songId,file:'workflow/stages/smoke-inventory.md',download:'1'})}`);
  assert.equal(downloaded.status,200);assert.equal(await downloaded.text(),record);
  check('Produced report is downloadable through the real artifact route');
  await app.close();app=null;assert.equal(vault.key,'');
  check('Backend shutdown clears temporary credential');
  const nextVault=new Vault({file:vaultFile});app=await createWorkbench({root,vault:nextVault});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${app.server.address().port}`;
  const restored=await snapshot();assert.equal(restored.credential.configured,false);assert.equal(restored.songs[0].active,'analysis');assert.equal(restored.songs[0].cards[0].instructions,revised.instructions);
  check('Restart restores card state but does not restore a temporary credential');
  await scan(root);check('Disposable project files contain no supplied credential');
  report.result='passed';
} catch(e) {
  report.result='failed';report.error=vault.redact(e.message);print(`FAIL ${report.error}`);process.exitCode=1;
} finally {
  clearTimeout(deadline);
  if(app)await app.close();
  vault.dispose();report.credentialCleared=!vault.key;
  assert.deepEqual(await Promise.all(watched.map(f=>fingerprint(path.join(project,f)))),before,'Original project changed');
  report.originalProjectUnchanged=true;
  key='';
  const resolved=path.resolve(root),prefix=path.resolve(os.tmpdir())+path.sep;
  assert(resolved.startsWith(prefix)&&path.basename(resolved).startsWith('mv-workbench-real-smoke-'));
  await fs.rm(resolved,{recursive:true,force:true});report.disposableProjectRemoved=true;
  await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  print(JSON.stringify(report,null,2));print(`Report: ${path.relative(project,output)}`);
}
