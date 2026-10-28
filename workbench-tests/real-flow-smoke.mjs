// Real API + local tools in a disposable project. No full MV or transcription.
// Default: enter a temporary Key in the isolated web UI; --stdin also supported.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createWorkbench} from '../workbench/server.mjs';
import {Vault} from '../workbench/vault.mjs';
import {runAgent,deepseekRequest} from '../workbench/agent.mjs';

const project=path.resolve(import.meta.dirname,'..');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'mv-real-flow-smoke-'));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(project,'workflow/stages',`workbench-real-flow-smoke-${stamp}`);
const report={at:new Date().toISOString(),result:'running',scope:'two short stages with real DeepSeek; synthetic audio + supplied test SRT; no real ASR, web research or MV render',checks:[],apiRequests:0,totalTokens:0,toolCalls:[]};
const watched=['workflow/workbench/state.json','mv-workflow/outline.md','mv/index.html','mv/full-engine.js','character.js'];
const hash=async p=>fs.readFile(path.join(project,p)).then(b=>createHash('sha256').update(b).digest('hex'),e=>e.code==='ENOENT'?null:Promise.reject(e));
const before=await Promise.all(watched.map(hash));
const vault=new Vault({file:path.join(root,'unused-credential.dpapi')});
let app,base,csrf,songId,timer,providedKey='';
const check=s=>{report.checks.push(s);console.log(`PASS ${s}`);};
const get=()=>fetch(base+'/api/state').then(r=>r.json());
async function post(route,data={}){
  const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Token':csrf},body:JSON.stringify(data)});
  return {status:r.status,body:await r.json()};
}
async function waitJob(){
  for(;;){const state=await get(),job=state.songs[0].jobs.at(-1);if(job.status!=='running'){assert.equal(job.status,'succeeded',job.error);return state.songs[0];}await new Promise(r=>setTimeout(r,400));}
}
async function scan(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await scan(p);else if(providedKey)assert(!(await fs.readFile(p)).includes(Buffer.from(providedKey)),'Key leaked to disk');}}
try {
  for(const f of ['AGENTS.md','mv-workflow/workflow.json','workflow_runner.py']){await fs.mkdir(path.dirname(path.join(root,f)),{recursive:true});await fs.copyFile(path.join(project,f),path.join(root,f));}
  await fs.writeFile(path.join(root,'mv-workflow/outline.md'),'');await fs.writeFile(path.join(root,'song.md'),'# Isolated smoke fixture');
  await fs.cp(path.join(project,'.agents/skills'),path.join(root,'.agents/skills'),{recursive:true});
  const agent=opts=>runAgent({...opts,request:async(key,body,signal)=>{
    assert(report.apiRequests<24,'Smoke API call cap reached');
    report.apiRequests++;
    console.log(`DeepSeek real request ${report.apiRequests} (${opts.card.id})`);
    const result=await deepseekRequest(key,{...body,max_tokens:2200},signal);
    report.totalTokens+=result.usage?.total_tokens||0;
    for(const call of result.choices[0].message.tool_calls||[])report.toolCalls.push(call.function.name);
    console.log(`DeepSeek response: ${(result.choices[0].message.tool_calls||[]).map(c=>c.function.name).join(', ')||'text'}`);
    return result;
  }});
  app=await createWorkbench({root,vault,agent});
  await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(process.argv.includes('--stdin')?0:3213,'127.0.0.1',resolve);});
  base=`http://127.0.0.1:${app.server.address().port}`;let state=await get();csrf=state.csrf;
  console.log(`ISOLATED SMOKE UI: ${base}`);
  if(process.argv.includes('--stdin')){
    if(process.stdin.isTTY)process.stdin.setRawMode(true);
    process.stdin.resume();console.log('Waiting for temporary credential on stdin (not echoed).');
    const key=await new Promise((resolve,reject)=>{
      let line='';
      const read=chunk=>{line+=chunk;if(/[\r\n]/.test(line)){process.stdin.off('data',read);process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);resolve(line.trim());}};
      process.stdin.on('data',read);process.stdin.once('end',()=>reject(Error('No key supplied')));
    });
    await vault.set(key.trim(),'temporary','deepseek-flash');
  }else{
    console.log('WAITING_FOR_TEMPORARY_KEY: close the upload dialog, open API settings, save a temporary Key. Do not start tasks manually.');
    const until=Date.now()+10*60*1000;
    while(!vault.key){if(Date.now()>until)throw Error('No API Key supplied within 10 minutes');await new Promise(r=>setTimeout(r,500));}
    assert.equal(vault.mode,'temporary','Use temporary credentials for smoke');
  }
  providedKey=vault.key;report.model=vault.model;check('Temporary credential received in backend memory');
  timer=setTimeout(()=>{post('cancel',{songId}).catch(()=>{});},360000);
  // One second of silence and a clearly labelled subtitle fixture, not ASR evidence.
  const wave=Buffer.alloc(16044);wave.write('RIFF');wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);wave.writeUInt32LE(8000,24);wave.writeUInt32LE(16000,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(16000,40);
  const fixture='1\n00:00:00,000 --> 00:00:01,000\n测试字幕（人工提供，不是识别结果）\n';
  const form=new FormData();form.set('title','隔离流程短测');form.set('audio',new Blob([wave]),'smoke.wav');form.set('lyrics',new Blob([fixture]),'fixture.srt');
  const uploaded=await fetch(base+'/api/songs/import',{method:'POST',headers:{'X-Workbench-Token':csrf},body:form});assert.equal(uploaded.status,200);state=await uploaded.json();songId=state.createdSongId;
  check('Audio + supplied SRT imported through actual HTTP route');
  let song=state.songs[0];
  const inventory=`这是用户授权的最简工具链 smoke，不是开始制作歌曲。Skill已由后台加载；本任务无需额外资料、枚举目录或运行 workflow_runner。音频路径是 ${song.source.audio.path}，人工字幕路径是 ${song.source.lyrics.path}。只执行：1. 用 write_file 创建 smoke_probe.py，用 Python 标准库 pathlib 检查这两个明确路径存在，并写 workflow/stages/smoke-inventory.md，简述检查结果并注明静音与人工字幕测试、未做ASR。2. 用 run_script 运行它。3. 用 read_file 核对报告。4. finish_stage completed，artifacts 只列该报告。不联网、不渲染、不做创意分析。报告三行即可。`;
  assert.equal((await post('save',{songId,revision:song.revision,outline:'仅做隔离流程测试，不制作 MV',card:{id:'inventory',content:inventory}})).status,200);
  assert.equal((await post('run',{songId,cardId:'inventory'})).status,200);song=await waitJob();
  report.inventoryResult=song.cards[0].result;
  assert.equal(song.cards[0].status,'review');assert.equal(song.active,'inventory');assert.equal((await post('run',{songId,cardId:'analysis'})).status,400);
  check('Real DeepSeek tools produced inventory; next step remains locked');
  assert.equal((await post('approve',{songId,cardId:'inventory'})).status,200);
  song=(await get()).songs[0];assert.equal(song.active,'analysis');
  const analysis=`这是最简工具链 smoke，不是开始制作歌曲。Skill已由后台加载；不必额外枚举目录或阅读参考文件。输入音频为1秒静音，字幕为人工测试样本，不能声称已识别、听校或测过节拍。不运行 Whisper、librosa、搜索或渲染。提供的 SRT 在 ${song.source.lyrics.path}。请用 write_file 创建 smoke_subtitles.py，用 Python 标准库 shutil.copyfile 将该文件按字节复制到 workflow/stages/smoke-lyrics.srt，再用 pathlib.Path.write_text 写 workflow/stages/smoke-song.md（三行简述只验证字幕输入/输出，未做ASR）。用 run_script 运行，用 read_file 核对输出，然后 finish_stage completed，artifacts 列出上述 SRT 和 Markdown。只做这一步，不添加实际歌曲分析。`;
  assert.equal((await post('save',{songId,revision:song.revision,card:{id:'analysis',content:analysis}})).status,200);
  assert.equal((await post('run',{songId,cardId:'analysis'})).status,200);song=await waitJob();
  report.analysisResult=song.cards[1].result;
  assert.equal(song.cards[1].status,'review');assert.equal(song.cards[1].reviewText.text.replaceAll('\r\n','\n'),fixture);
  assert.equal((await post('run',{songId,cardId:'story'})).status,400);check('Real model emitted SRT + report; editable review text populated; story locked');
  const edited=fixture.replace('测试字幕','已人工确认的测试字幕');
  let r=await post('review/save',{songId,cardId:'analysis',revision:song.revision,reviewText:edited});assert.equal(r.status,200);song=r.body.songs[0];
  assert.equal(song.cards[1].status,'review');assert.equal(await fs.readFile(path.join(root,song.cards[1].reviewText.path),'utf8'),edited);
  assert.equal((await post('run',{songId,cardId:'story'})).status,400);check('Human edit saved to real SRT without unlocking next stage');
  r=await post('approve',{songId,cardId:'analysis',revision:song.revision,reviewText:edited});assert.equal(r.status,200);song=r.body.songs[0];
  assert.equal(song.active,'story');assert(song.cards.slice(2).every(c=>c.status==='pending'));check('Confirmation unlocks story; no subsequent stage or MV started');
  await fs.mkdir(output,{recursive:true});
  assert.notEqual(song.cards[1].reviewText.path,song.source.lyrics.path,'Model must produce an output SRT, not just return input');
  assert(song.cards[1].result.artifacts.some(f=>/\.md$/i.test(f)),'Analysis needs a report as well as subtitles');
  const artifacts=[...new Set(song.cards.slice(0,2).flatMap(c=>c.result.artifacts))];
  for(const file of artifacts){
    const response=await fetch(base+'/api/artifact?'+new URLSearchParams({songId,file}));assert.equal(response.status,200,`Declared artifact unavailable: ${file}`);
    const content=await response.text();assert.equal(content,await fs.readFile(path.join(root,file),'utf8'));await fs.writeFile(path.join(output,path.basename(file)),content);
  }
  assert(report.toolCalls.includes('run_script'));assert(report.toolCalls.includes('write_file'));check('Real model outputs downloadable and match local files');
  await scan(root);check('No supplied credential in disposable project files');
  await app.close();app=null;assert.equal(vault.key,'');check('Shutdown clears temporary Key');
  const restoredVault=new Vault({file:path.join(root,'unused-credential.dpapi')});app=await createWorkbench({root,vault:restoredVault});
  assert.equal(restoredVault.key,'');assert.equal(app.store.state.songs[0].active,'story');assert.equal(app.store.state.songs[0].cards[1].reviewText.text,edited);check('Restart restores confirmed results, without restoring temporary Key');
  report.result='passed';
}catch(e){report.result='failed';report.error=vault.redact(e.message);console.log(`FAIL ${report.error}`);process.exitCode=1;}
finally{
  clearTimeout(timer);await app?.close();vault.dispose();
  report.credentialCleared=!vault.key;
  report.originalProjectUnchanged=JSON.stringify(await Promise.all(watched.map(hash)))===JSON.stringify(before);
  if(!report.originalProjectUnchanged){report.result='failed';report.error='Original project changed during test';process.exitCode=1;}
  providedKey='';
  assert(root.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(root).startsWith('mv-real-flow-smoke-'));
  await fs.rm(root,{recursive:true,force:true});report.disposableProjectRemoved=true;
  await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));console.log(`Report: ${output}`);
}
