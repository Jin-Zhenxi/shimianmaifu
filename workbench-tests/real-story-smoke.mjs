// Real storyboard generation + visual inspection + feedback; no MV render.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import puppeteer from 'puppeteer-core';
import {createWorkbench} from '../workbench/server.mjs';
import {Vault} from '../workbench/vault.mjs';
import {runAgent,deepseekRequest} from '../workbench/agent.mjs';

const project=path.resolve(import.meta.dirname,'..');
const resumeStamp=process.argv[2];
if(resumeStamp)assert(/^\d{4}-\d\d-\d\dT[\dTZ-]+$/.test(resumeStamp),'Invalid resume stamp');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'mv-real-story-smoke-'));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(project,'workflow/stages',`workbench-real-story-smoke-${stamp}`);
const previews=path.join(project,'workflow/previews',`story-smoke-${stamp}`);
const report={at:new Date().toISOString(),result:'running',scope:'two existing approved shots; real generation, image API and feedback; prior stages seeded as confirmed test fixtures; no audio analysis or video render',apiRequests:0,totalTokens:0,toolCalls:[],toolResults:[],checks:[]};
const watched=['workflow/workbench/state.json','mv-workflow/outline.md','storyboard.md','mv/index.html','mv/full-engine.js','character.js'];
const digest=b=>createHash('sha256').update(b).digest('hex');
const hash=async p=>fs.readFile(path.join(project,p)).then(digest,e=>e.code==='ENOENT'?null:Promise.reject(e));
const before=await Promise.all(watched.map(hash));
const vault=new Vault({file:path.join(root,'unused-credential.dpapi')});
let app,browser,base,csrf,songId,timer,providedKey='';
const check=s=>{report.checks.push(s);console.log(`PASS ${s}`);};
const get=()=>fetch(base+'/api/state').then(r=>r.json());
async function post(route,data={}){const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Token':csrf},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};}
async function waitJob(){for(;;){const s=(await get()).songs[0],j=s.jobs.at(-1);if(j.status!=='running'){assert.equal(j.status,'succeeded',j.error);assert.equal(s.cards[2].status,'review',s.cards[2].result?.summary);return s;}await new Promise(r=>setTimeout(r,400));}}
async function scan(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await scan(p);else assert(!(await fs.readFile(p)).includes(Buffer.from(providedKey)),'Credential on disk');}}
async function collect(song,label){
  const card=song.cards[2];report[label]=card.result;
  const images=card.result.artifacts.filter(f=>/\.png$/i.test(f));assert(images.length,'No storyboard PNG');
  const file=(label==='revised'?images.find(f=>/r2/i.test(f)):null)||images.filter(f=>/storyboard/i.test(f)).at(-1)||images.at(-1);
  report[`${label}Image`]=file;
  const r=await fetch(base+'/api/artifact?'+new URLSearchParams({songId,file}));assert.equal(r.status,200);
  const bytes=Buffer.from(await r.arrayBuffer());assert(bytes.subarray(1,4).equals(Buffer.from('PNG')));assert(bytes.length>2000,'Image unexpectedly empty');
  assert.equal(digest(bytes),digest(await fs.readFile(path.join(root,file))));
  await fs.writeFile(path.join(previews,`${label}.png`),bytes);
  for(const artifact of card.result.artifacts.filter(f=>/\.(md|json|py)$/i.test(f))){const src=path.join(root,artifact);await fs.copyFile(src,path.join(output,`${label}-${path.basename(artifact)}`));}
  return digest(bytes);
}
try{
  await fs.mkdir(output,{recursive:true});await fs.mkdir(previews,{recursive:true});
  await fs.mkdir(path.join(root,'mv-workflow'));await fs.mkdir(path.join(root,'assets'));
  for(const f of ['AGENTS.md','mv-workflow/workflow.json'])await fs.copyFile(path.join(project,f),path.join(root,f));
  await fs.cp(path.join(project,'.agents/skills'),path.join(root,'.agents/skills'),{recursive:true});
  await fs.copyFile('C:/Windows/Fonts/msyh.ttc',path.join(root,'assets/font.ttc'));
  process.env.PATH=path.join(project,'.conda/mv')+path.delimiter+process.env.PATH;
  const original=await fs.readFile(path.join(project,'storyboard.md'),'utf8');
  const shots=original.split(/\r?\n/).filter(l=>/^\| L0[12] \|/.test(l)).join('\n');assert(shots.includes('L02'));
  const outline='仅复用原工程已确认的 L01/L02 镜头进行分镜功能 smoke。纸艺草图，橘色男蟹、金色粉蝴蝶结女蟹；不新增创作主题，不做视频。';
  await fs.writeFile(path.join(root,'mv-workflow/outline.md'),outline);
  await fs.writeFile(path.join(root,'song.md'),'# 分镜功能测试\n沿用已确认剧情，仅检查两张分镜，不做音乐识别或节拍分析。\n'+shots);
  await fs.writeFile(path.join(root,'approved-shots.md'),'# 已确认镜头摘录\n'+shots);
  const agent=opts=>runAgent({...opts,request:async(key,body,signal)=>{
    for(const m of body.messages.filter(m=>m.role==='tool'))if(!report.toolResults.some(t=>t.id===m.tool_call_id))report.toolResults.push({id:m.tool_call_id,output:typeof m.content==='string'?vault.redact(m.content).slice(0,1600):'[image payload omitted]'});
    assert(report.apiRequests<24,'Storyboard smoke API call cap reached');report.apiRequests++;
    console.log(`DeepSeek request ${report.apiRequests} (${opts.message?'feedback':'initial'})`);
    const r=await deepseekRequest(key,{...body,max_tokens:8192},signal);report.totalTokens+=r.usage?.total_tokens||0;
    const calls=r.choices[0].message.tool_calls||[];report.toolCalls.push(...calls.map(c=>c.function.name));
    console.log('Tools: '+calls.map(c=>c.function.name).join(', '));return r;
  }});
  app=await createWorkbench({root,vault,agent});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${app.server.address().port}`;
  csrf=(await get()).csrf;
  if(process.stdin.isTTY)process.stdin.setRawMode(true);process.stdin.resume();console.log('Waiting for temporary credential on stdin (not echoed).');
  providedKey=await new Promise((resolve,reject)=>{let line='';const read=b=>{line+=b;if(/[\r\n]/.test(line)){process.stdin.off('data',read);process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);resolve(line.trim());}};process.stdin.on('data',read);process.stdin.once('end',()=>reject(Error('No key supplied')));});
  await vault.set(providedKey,'temporary','deepseek-flash');
  const fixture=app.store.state.songs[0];songId=fixture.id;fixture.outline=outline;fixture.title='分镜生成短测';
  for(const c of fixture.cards.slice(0,2)){c.status='completed';c.result={status:'completed',summary:'预置已确认的前置测试资料，聚焦分镜功能',artifacts:['approved-shots.md'],checks:[]};}
  fixture.active='story';await app.store.save();
  const content=`这是最简分镜功能 smoke，Skill已经加载；不要启动完整教程、搜索、分析音频或渲染视频，不额外列目录。已确认的两镜在 approved-shots.md。只基于 L01/L02 写 workflow/stages/storyboard.md，保留原剧情和原起止时间，注明场景、动作、远景固定、承接关系。用 write_file 写 storyboard_smoke.py（控制在100行以内），然后 run_script python 执行，用 Pillow 绘制一个 1200x520 双格草图 PNG 到 workflow/previews/storyboard-r1.png；用基本几何轮廓表示街角、红邮筒、橘色男蟹、金色粉蝴蝶结女蟹，按各镜需求安排出场与遮挡，不添加字幕或新剧情。每格最多20个基本形状，不加纹理或复杂排版。Pillow已安装，字体可用 assets/font.ttc。每格人物初始保持远景，预留外边距。生成器确定性；第二格稍后需要改近景。调用 inspect_image 亲自检查一次后就 finish_stage needs_review，artifacts 包含 storyboard.md、PNG 和生成器。非致命的造型问题如实列入 checks，等待人工决定，不反复重绘，不生成额外QA文档。不要复制已有图片。`;
  assert.equal((await post('save',{songId,revision:fixture.revision,card:{id:'story',content}})).status,200);
  timer=setTimeout(()=>{post('cancel',{songId}).catch(()=>{});},360000);
  let song;
  if(resumeStamp){
    const prior=path.join(project,'workflow/stages',`workbench-real-story-smoke-${resumeStamp}`);
    const evidence=JSON.parse(await fs.readFile(path.join(prior,'report.json'),'utf8'));assert(evidence.initial);assert(evidence.toolCalls.includes('inspect_image'));
    for(const file of evidence.initial.artifacts){await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.copyFile(/\.png$/i.test(file)?path.join(project,'workflow/previews',`story-smoke-${resumeStamp}`,'initial.png'):path.join(prior,`initial-${path.basename(file)}`),path.join(root,file));}
    fixture.cards[2].result=evidence.initial;fixture.cards[2].status='review';await app.store.save();song=(await get()).songs[0];report.initialFrom=path.relative(project,prior);check('Restored previous real generated/inspected initial storyboard to test feedback without regenerating');
  }else{assert.equal((await post('run',{songId,cardId:'story'})).status,200);song=await waitJob();assert(report.toolCalls.includes('inspect_image'));check('Real DeepSeek generated storyboard Markdown + PNG and consumed visual inspection');}
  const initialHash=await collect(song,'initial');
  assert.equal((await post('run',{songId,cardId:'scenes'})).status,400);check('Unconfirmed storyboard blocks next stage');
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage();await page.setViewport({width:1440,height:1050});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#song-dialog[open]');await page.click('#song-dialog-close');
  await page.waitForFunction(()=>document.querySelector('#artifacts img')?.naturalWidth>0);await page.$eval('#result-panel',e=>e.scrollIntoView());
  await page.screenshot({path:path.join(previews,'initial-workbench.png'),fullPage:true});check('Actual model-generated PNG displays in real workbench result panel');
  const feedback='只把第二格 L02 从远景改为近景，第一格必须逐像素不变。此次是精确的摄影机裁切测试，不重画角色、不重新计算场景坐标：用 Pillow 读取 workflow/previews/storyboard-r1.png 并 copy，取原图右格的 crop((810,180,1040,400))，resize 为 (570,500)，paste 到副本的 (630,10)，保存 workflow/previews/storyboard-r2.png。上述坐标已由测试导演确定，直接执行即可。独立写一个简短的 zoom_storyboard.py 并实际运行，更新分镜说明中L02为近景；inspect_image 检查新图后就 finish_stage needs_review，提交新图、脚本与说明。不修改左格，不继续修图或补QA文档，不做下一步。';
  await page.type('#feedback-text',feedback);await page.click('#feedback-send');
  await page.waitForFunction(()=>document.querySelector('#job-title').textContent.includes('后台制作'),{timeout:15000});
  song=await waitJob();const changedHash=await collect(song,'revised');assert.notEqual(initialHash,changedHash,'Feedback did not change PNG');
  const compare=await promisify(execFile)(path.join(project,'.conda/mv/python.exe'),['-c',"from PIL import Image,ImageChops,ImageStat; import sys,json; a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open(sys.argv[2]).convert('RGB'); ar=a.crop((630,0,1200,520)); br=b.crop((630,0,1200,520)); gold=lambda im:sum(1 for r,g,b in im.getdata() if r>180 and 130<g<190 and b<100); print(json.dumps({'leftUnchanged':ImageChops.difference(a.crop((0,0,600,520)),b.crop((0,0,600,520))).getbbox() is None,'rightChanged':ImageChops.difference(ar,br).getbbox() is not None,'rightHasContent':max(ImageStat.Stat(br).stddev)>5,'goldPixelsBefore':gold(ar),'goldPixelsAfter':gold(br)}))",path.join(previews,'initial.png'),path.join(previews,'revised.png')]);
  report.pixelComparison=JSON.parse(compare.stdout);assert(report.pixelComparison.leftUnchanged,'Unrequested first panel changed');assert(report.pixelComparison.rightChanged,'Requested second panel unchanged');assert(report.pixelComparison.rightHasContent,'Revised panel is blank');assert(report.pixelComparison.goldPixelsAfter>report.pixelComparison.goldPixelsBefore*1.5,'Subject did not get visibly larger');check('Pixel comparison: first panel unchanged; second panel nonblank and subject visibly larger');
  assert.equal(song.cards[2].content,content);assert.equal(song.cards[3].status,'pending');assert.equal(song.active,'story');
  await page.waitForFunction(expected=>[...document.querySelectorAll('#artifacts img')].some(e=>e.naturalWidth>0&&new URL(e.src).searchParams.get('file')===expected),{timeout:15000},report.revisedImage);
  await page.$eval('#result-panel',e=>e.scrollIntoView());await page.screenshot({path:path.join(previews,'revised-workbench.png'),fullPage:true});
  assert.deepEqual(errors,[]);check('Feedback submitted via UI caused real model regeneration; new PNG displayed; task text preserved and stage still awaiting confirmation');
  assert.equal((await post('run',{songId,cardId:'scenes'})).status,400);check('Revised storyboard still blocks next stage until confirmation');
  await scan(root);await scan(output);check('No provided credential on disk');report.result='passed';
}catch(e){report.result='failed';report.error=vault.redact(e.message);console.log('FAIL '+report.error);process.exitCode=1;}
finally{
  clearTimeout(timer);await browser?.close();await app?.close();vault.dispose();report.credentialCleared=!vault.key;
  // Preserve real intermediate evidence even when a model/tool round fails.
  const partial=path.join(root,'workflow/previews');
  if(await fs.stat(partial).then(()=>true,()=>false))await fs.cp(partial,path.join(previews,'generated-files'),{recursive:true});
  for(const e of await fs.readdir(root,{withFileTypes:true}))if(e.isFile()&&/\.py$/i.test(e.name))await fs.copyFile(path.join(root,e.name),path.join(output,e.name));
  report.originalProjectUnchanged=JSON.stringify(await Promise.all(watched.map(hash)))===JSON.stringify(before);
  if(!report.originalProjectUnchanged){report.result='failed';report.error='Original project changed';process.exitCode=1;}
  providedKey='';assert(root.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(root).startsWith('mv-real-story-smoke-'));await fs.rm(root,{recursive:true,force:true});report.disposableProjectRemoved=true;
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,error:report.error,apiRequests:report.apiRequests,totalTokens:report.totalTokens,checks:report.checks,report:output,previews}));
}
