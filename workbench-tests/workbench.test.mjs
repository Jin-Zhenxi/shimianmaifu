import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWorkbench} from '../workbench/server.mjs';
import {Vault,dpapi} from '../workbench/vault.mjs';
import {applyEdits,runAgent,deepseekRequest} from '../workbench/agent.mjs';
import {discoverSkills,recommendedSkills} from '../workbench/skills.mjs';
import {LocalTools} from '../workbench/tools.mjs';
import {Store} from '../workbench/store.mjs';

const project=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const fixtureBase=path.join(project,'workflow','.workbench-tests');
const secret='sk-test-only-not-a-real-credential';
const crypt=async(action,input)=>action==='encrypt'?Buffer.from(input).toString('base64'):Buffer.from(input,'base64').toString('utf8');
async function fixture(t,{agent,stages=['inventory','analysis','story','scenes','render','qa']}={}) {
  await fs.mkdir(fixtureBase,{recursive:true});const root=await fs.mkdtemp(path.join(fixtureBase,'case-'));
  await fs.mkdir(path.join(root,'mv-workflow'));await fs.mkdir(path.join(root,'.agents/skills/music-mv'),{recursive:true});
  await fs.writeFile(path.join(root,'mv-workflow/workflow.json'),JSON.stringify({stages:stages.map(id=>({id,reads:[],writes:[]}))}));
  await fs.writeFile(path.join(root,'mv-workflow/outline.md'),'（等待用户提供）');await fs.writeFile(path.join(root,'song.md'),'# 《测试歌曲》');
  await fs.writeFile(path.join(root,'.agents/skills/music-mv/SKILL.md'),'---\nname: music-mv\ndescription: 测试技能\n---\n这是完整的测试技能入口。');
  const vault=new Vault({file:path.join(root,'test-credential.dpapi'),crypt});
  const app=await createWorkbench({root,vault,...(agent?{agent}:{})});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  let snapshot=await fetch(`${base}/api/state`).then(r=>r.json());
  const post=async(endpoint,data={})=>{
    const r=await fetch(`${base}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Token':snapshot.csrf},body:JSON.stringify(data)});
    const body=await r.json();if(r.ok)snapshot=body;return {status:r.status,body};
  };
  const get=async()=>{snapshot=await fetch(`${base}/api/state`).then(r=>r.json());return snapshot;};
  const wait=async()=>{
    for(let i=0;i<100;i++){const s=await get();if(!s.songs[0].jobs.some(j=>j.status==='running'))return s;await new Promise(r=>setTimeout(r,10));}
    throw Error('测试任务未结束');
  };
  t.after(async()=>{await app.close();const target=path.resolve(root);assert(target.startsWith(path.resolve(fixtureBase)+path.sep));await fs.rm(target,{recursive:true,force:true});});
  return {root,app,base,post,get,wait,songId:snapshot.songs[0].id};
}
test('局部修改只替换唯一原文，未提到的字段保持逐字不变',()=>{
  const c={goal:'统一画风',instructions:'夜景。角色保留，节奏保留。',checks:'抽帧检查'};
  assert.deepEqual(applyEdits(c,[{field:'instructions',find:'夜景',replace:'雨天'}]),{...c,instructions:'雨天。角色保留，节奏保留。'});
  assert.throws(()=>applyEdits(c,[{field:'goal',find:'不存在',replace:'x'}]),/未匹配/);
  assert.throws(()=>applyEdits({...c,goal:'a a'},[{field:'goal',find:'a',replace:'b'}]),/不唯一/);
  assert.equal(c.instructions,'夜景。角色保留，节奏保留。');
});
test('临时凭证不落盘，完成时清除；永久凭证可重载、完成后保留、主动清除',async t=>{
  const {root}=await fixture(t);const file=path.join(root,'vault.dpapi');const v=new Vault({file,crypt});
  await v.set(secret,'temporary','deepseek-flash');assert.equal(v.status().configured,true);await assert.rejects(fs.stat(file),{code:'ENOENT'});v.complete();assert.equal(v.status().configured,false);
  await v.set(secret,'permanent','deepseek-flash');assert(!String(await fs.readFile(file)).includes(secret));
  const loaded=new Vault({file,crypt});await loaded.init();assert.equal(loaded.key,secret);loaded.complete();assert.equal(loaded.key,secret);
  await loaded.set(secret,'temporary','deepseek-flash');await assert.rejects(fs.stat(file),{code:'ENOENT'});
  await loaded.set(secret,'permanent','deepseek-flash');await loaded.clear();assert.equal(loaded.key,'');await assert.rejects(fs.stat(file),{code:'ENOENT'});
});
test('Windows DPAPI 可在内存中加解密，原文不出现在加密结果中',{skip:process.platform!=='win32'},async()=>{
  const cipher=await dpapi('encrypt',secret);assert(!cipher.includes(secret));assert.equal(await dpapi('decrypt',cipher),secret);
});
test('按歌曲名保存可编辑任务，拒绝过期版本且不产生部分状态变化',async t=>{
  const f=await fixture(t);let s=(await f.get()).songs[0];const original=s.cards[0];
  const r=await f.post('save',{songId:f.songId,revision:0,title:'雨中的歌',outline:'只调整夜景',card:{id:'inventory',content:'只改这里'}});
  assert.equal(r.status,200);let md=await fs.readFile(path.join(f.root,'workflow/prompts/雨中的歌.md'),'utf8');assert(md.includes('只改这里'));assert(!md.includes('### 制作要求'));
  assert.equal(r.body.songs[0].cards[0].content,'只改这里');assert.equal(r.body.songs[0].cards[0].instructions,original.instructions);
  const {stageContext}=await import('../workbench/agent.mjs');assert((await stageContext(f.root,f.app.store.manifest,r.body.songs[0],r.body.songs[0].cards[0])).includes('只改这里'));
  const stale=await f.post('save',{songId:f.songId,revision:0,title:'不能保存'});assert.equal(stale.status,400);
  const malformed=await f.post('save',{songId:f.songId,revision:1,title:'不应部分写入',card:{id:'inventory',goal:42}});assert.equal(malformed.status,400);
  s=(await f.get()).songs[0];assert.equal(s.title,'雨中的歌');assert.equal(s.cards[0].goal,original.goal);
});
test('后台聊天、加载状态、并发拦截、自动保存；不经过 Codex',async t=>{
  let finish;const f=await fixture(t,{agent:async opts=>{await new Promise(r=>finish=r);return {reply:'已修改要求',updated:{goal:opts.card.goal,instructions:'雨天',checks:opts.card.checks},edits:[{field:'instructions',find:opts.card.instructions,replace:'雨天'}]};}});
  await f.post('credentials',{key:secret,mode:'temporary',model:'deepseek-flash'});
  const started=await f.post('revise',{songId:f.songId,cardId:'inventory',message:'只改成雨天'});assert.equal(started.status,200);assert.equal(started.body.songs[0].jobs[0].status,'running');
  assert.equal((await f.post('run',{songId:f.songId,cardId:'inventory'})).status,400);
  assert.equal((await f.post('credentials/clear',{})).status,400);
  while(!finish)await new Promise(r=>setTimeout(r,5));finish();const result=await f.wait();
  assert.equal(result.songs[0].cards[0].instructions,'雨天');assert.equal(result.songs[0].active,'inventory');assert.equal(result.credential.configured,true);
  assert(!JSON.stringify(result).includes(secret));assert((await fs.readFile(path.join(f.root,result.songs[0].promptPath),'utf8')).includes(result.songs[0].cards[0].content));
});
test('结果先等待确认，确认后才开启下一卡；最终确认后清除临时凭证',async t=>{
  const f=await fixture(t,{stages:['inventory','analysis'],agent:async()=>({status:'completed',summary:'已完成',artifacts:['song.md'],checks:['已核对']})});
  await f.post('credentials',{key:secret,mode:'temporary',model:'deepseek-flash'});
  await f.post('run',{songId:f.songId,cardId:'inventory'});let result=await f.wait();assert.equal(result.songs[0].active,'inventory');assert.equal(result.songs[0].cards[0].status,'review');assert.equal(result.credential.configured,true);
  assert.equal((await f.post('run',{songId:f.songId,cardId:'analysis'})).status,400);
  await f.post('approve',{songId:f.songId,cardId:'inventory'});result=await f.get();assert.equal(result.songs[0].active,'analysis');
  assert.equal(result.songs[0].jobs.length,1);assert.equal(result.songs[0].cards[1].status,'pending');
  const before=(await f.post('run',{songId:f.songId,cardId:'analysis'}));assert.equal(before.status,400);assert.match(before.body.error,/大纲/);
  const s=result.songs[0];await f.post('save',{songId:f.songId,revision:s.revision,outline:'现有项目继续制作'});
  await f.post('run',{songId:f.songId,cardId:'analysis'});result=await f.wait();assert.equal(result.songs[0].active,'analysis');assert.equal(result.credential.configured,true);
  const done=await f.post('approve',{songId:f.songId,cardId:'analysis'});assert.equal(done.body.songs[0].active,null);assert.equal(done.body.credential.configured,false);
});
test('需要查看的样片等待确认，确认后自动下一卡；永久凭证保留',async t=>{
  const f=await fixture(t,{stages:['inventory'],agent:async()=>({status:'needs_review',summary:'请查看',artifacts:['song.md'],checks:[]})});
  await f.post('credentials',{key:secret,mode:'permanent',model:'deepseek-flash'});await f.post('run',{songId:f.songId,cardId:'inventory'});
  const result=await f.wait();assert.equal(result.songs[0].cards[0].status,'review');assert.equal(result.songs[0].active,'inventory');
  const approved=await f.post('approve',{songId:f.songId,cardId:'inventory'});assert.equal(approved.body.songs[0].active,null);assert.equal(approved.body.credential.configured,true);
});
test('API 失败保留当前卡、可重试；取消任务不会被迟到的成功结果推进',async t=>{
  let fail=true,release;const f=await fixture(t,{agent:async()=>{if(fail)throw Error('DeepSeek 余额不足');await new Promise(r=>release=r);return {status:'completed',summary:'迟到结果',artifacts:['song.md'],checks:[]};}});
  await f.post('credentials',{key:secret,mode:'temporary',model:'deepseek-flash'});await f.post('run',{songId:f.songId,cardId:'inventory'});
  let result=await f.wait();assert.equal(result.songs[0].jobs.at(-1).status,'failed');assert.equal(result.songs[0].active,'inventory');
  fail=false;await f.post('run',{songId:f.songId,cardId:'inventory'});while(!release)await new Promise(r=>setTimeout(r,5));
  await f.post('cancel',{songId:f.songId});release();await new Promise(r=>setTimeout(r,30));result=await f.get();assert.equal(result.songs[0].jobs.at(-1).status,'cancelled');assert.equal(result.songs[0].cards[0].status,'pending');
});
test('凭证不出现在状态、Markdown、浏览器代码；拒绝跨域和无 token 写入',async t=>{
  const f=await fixture(t);await f.post('credentials',{key:secret,mode:'temporary',model:'deepseek-flash'});
  const s=(await f.get()).songs[0];await f.post('save',{songId:f.songId,revision:s.revision,outline:`误粘贴 ${secret}`});
  assert(!JSON.stringify(await f.get()).includes(secret));assert(!(await fs.readFile(path.join(f.root,s.promptPath),'utf8')).includes(secret));
  const wrong=await fetch(`${f.base}/api/credentials/clear`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(wrong.status,403);
  const origin=await fetch(`${f.base}/api/state`,{headers:{Origin:'https://untrusted.example'}});assert.equal(origin.status,403);
  const noFile=await fetch(`${f.base}/api/artifact?${new URLSearchParams({songId:s.id,file:'.agents/skills/music-mv/SKILL.md'})}`);assert.equal(noFile.status,400);
});
test('Skill 自动发现、跨技能加载、手动启用；新增 Skill 无需改代码',async t=>{
  const f=await fixture(t);await fs.mkdir(path.join(f.root,'.agents/skills/extra'),{recursive:true});await fs.writeFile(path.join(f.root,'.agents/skills/extra/SKILL.md'),'---\nname: extra\ndescription: 额外技能\n---\n新能力');
  const refreshed=await f.post('skills/rescan');assert.equal(refreshed.body.skills.length,2);
  const tools=new LocalTools(f.root,{skills:await discoverSkills(f.root)});const loaded=await tools.call('read_skill',{id:'extra'});assert(loaded.content.endsWith('新能力'));assert(tools.loadedSkills.has('extra'));
  const s=refreshed.body.songs[0];await f.post('save',{songId:f.songId,revision:s.revision,enabledSkills:['extra']});assert.deepEqual((await f.get()).songs[0].enabledSkills,['extra']);
  const restricted=new LocalTools(f.root,{skills:(await discoverSkills(f.root)).filter(s=>s.id==='extra')});await assert.rejects(restricted.call('read_file',{file:'.agents/skills/music-mv/SKILL.md',offset:0,length:100}),/未启用/);
});
test('真实项目四类 Skill 都可发现，场景阶段自动选择互补技能而保留 HyperFrames',async()=>{
  const skills=await discoverSkills(project);assert.deepEqual(skills.map(s=>s.name).sort(),['music-mv','remotion-best-practices','song-video-director','video-motion-craft'].sort());
  const automatic=recommendedSkills(skills,{outline:'继续 HyperFrames 工程'},{id:'scenes',goal:'修订场景',instructions:''});assert.equal(automatic.length,3);
  assert(recommendedSkills(skills,{outline:'创建 Remotion 动画'},{id:'scenes',goal:'',instructions:''}).some(s=>s.name==='remotion-best-practices'));
});
test('工具路径限制、脚本运行、工具输出进入 API 的完整往返',async t=>{
  const f=await fixture(t);const local=new LocalTools(f.root);
  await assert.rejects(local.resolve('../secret'),/路径/);await assert.rejects(local.resolve('C:/secret'),/路径/);await assert.rejects(local.resolve('.env'),/路径/);await assert.rejects(local.resolve('.agents/skills/music-mv/x.py',{write:true}),/系统管理/);
  await local.call('write_file',{file:'workflow/check.mjs',content:'process.stdout.write("script result")'});
  const executed=await local.call('run_script',{runtime:'node',file:'workflow/check.mjs',args:[]});assert.equal(executed.exitCode,0);assert.equal(executed.output,'script result');
  const v=new Vault({file:path.join(f.root,'not-saved'),crypt});await v.set(secret,'temporary','deepseek-flash');const s=(await f.get()).songs[0];let rounds=0;
  const result=await runAgent({root:f.root,manifest:f.app.store.manifest,song:s,card:s.cards[0],kind:'revise',message:'解释一下',vault:v,signal:new AbortController().signal,log:()=>{},request:async(key,body)=>{
    assert.equal(key,secret);assert.equal(body.model,'deepseek-flash');assert(!JSON.stringify(body).includes(secret));rounds++;
    if(rounds===1)return {choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'call-read',type:'function',function:{name:'read_file',arguments:JSON.stringify({file:'song.md',offset:0,length:1000})}}]}}]};
    assert(body.messages.some(m=>m.role==='tool'&&m.tool_call_id==='call-read'&&m.content.includes('测试歌曲')));
    return {choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'call-finish',type:'function',function:{name:'finish_revision',arguments:JSON.stringify({reply:'这是测试歌曲',edits:[]})}}]}}]};
  }});assert.equal(rounds,2);assert.equal(result.reply,'这是测试歌曲');assert.deepEqual(result.usedSkills,['music-mv']);
});
test('API 请求固定发往 DeepSeek，错误内容不会反射密钥',async()=>{
  const signal=new AbortController().signal;
  await assert.rejects(deepseekRequest(secret,{model:'deepseek-flash',messages:[]},signal,async(url,opts)=>{
    assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(opts.headers.Authorization,`Bearer ${secret}`);assert.equal(JSON.parse(opts.body).thinking.type,'disabled');return new Response(secret,{status:401});
  }),e=>e.message.includes('Key 无效')&&!e.message.includes(secret));
});
test('页面与静态资源可访问，脚本引用 ID 齐全，视频支持范围请求',async t=>{
  const f=await fixture(t);let html='';
  for(const route of ['/','/app.js','/style.css']){const r=await fetch(f.base+route);assert.equal(r.status,200);assert(r.headers.get('content-security-policy'));if(route==='/')html=await r.text();}
  const appSource=await fs.readFile(path.join(project,'workbench/public/app.js'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  for(const match of appSource.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(match[1]),`缺少页面元素 ${match[1]}`);
  const s=(await f.get()).songs[0];await fs.writeFile(path.join(f.root,'sample.mp4'),Buffer.from('0123456789'));f.app.store.song(s.id).cards[0].result={artifacts:['sample.mp4']};
  const media=await fetch(`${f.base}/api/artifact?${new URLSearchParams({songId:s.id,file:'sample.mp4'})}`,{headers:{Range:'bytes=3-5'}});assert.equal(media.status,206);assert.equal(await media.text(),'345');
});
test('后台重启恢复卡片与聊天，将未完成任务标记中断而不误跳卡',async t=>{
  const f=await fixture(t);const s=f.app.store.state.songs[0];s.cards[0].chat.push({role:'user',text:'保留这条修改'});s.cards[0].status='running';s.jobs.push({id:'old-process',cardId:'inventory',status:'running'});await f.app.store.save();
  const restored=new Store(f.root);await restored.init();assert.equal(restored.state.songs[0].cards[0].chat[0].text,'保留这条修改');assert.equal(restored.state.songs[0].jobs[0].status,'interrupted');assert.equal(restored.state.songs[0].active,'inventory');
  assert.equal(restored.state.songs[0].cards[0].status,'pending');
});
test('制作工具循环实际生成文件并验证产物，缺失产物不能完成',async t=>{
  const f=await fixture(t);const s=(await f.get()).songs[0];const vault=new Vault({file:path.join(f.root,'no-save'),crypt});await vault.set(secret,'temporary','deepseek-flash');let round=0;
  const answer=(name,args)=>({choices:[{message:{role:'assistant',content:null,tool_calls:[{id:`call-${round}`,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}]});
  const result=await runAgent({root:f.root,manifest:f.app.store.manifest,song:s,card:s.cards[0],kind:'produce',vault,signal:new AbortController().signal,log:()=>{},request:async()=>{
    round++;
    if(round===1)return answer('finish_stage',{status:'completed',summary:'不能完成',artifacts:['missing.md'],checks:[]});
    if(round===2)return answer('write_file',{file:'workflow/stages/inventory.md',content:'# 真实生成的盘点'});
    return answer('finish_stage',{status:'completed',summary:'盘点完成',artifacts:['workflow/stages/inventory.md'],checks:['已核对项目输入']});
  }});
  assert.equal(round,3);assert.equal(result.status,'completed');assert.equal(await fs.readFile(path.join(f.root,result.artifacts[0]),'utf8'),'# 真实生成的盘点');
});

test('替换当前歌曲：统一更新任务与歌词、重置状态、保留历史，上传不启动 Agent',async t=>{
  let calls=0;const f=await fixture(t,{agent:async()=>{calls++;throw Error('导入不应执行');}});
  const initial=await f.get();
  async function upload(title,lyrics,ext='wav',token=initial.csrf){
    const form=new FormData();form.set('title',title);if(ext)form.set('audio',new Blob([Buffer.from('RIFF-test-audio')]),`track.${ext}`);
    if(lyrics!==undefined)form.set('lyrics',new Blob([lyrics]),'辅助歌词.lrc');
    const r=await fetch(f.base+'/api/songs/import',{method:'POST',headers:{'X-Workbench-Token':token},body:form});return {status:r.status,body:await r.json()};
  }
  assert.equal((await upload('缺歌曲',undefined,null)).status,400);
  assert.equal((await upload('错误类型',undefined,'exe')).status,400);
  assert.equal((await upload('空歌词','')).status,400);
  assert.equal((await upload('无授权',undefined,'wav','bad')).status,403);
  assert.equal((await f.get()).songs.length,1);
  const a=await upload('新歌 A');assert.equal(a.status,200);const sa=a.body.songs.find(s=>s.id===a.body.createdSongId);
  f.app.store.song(sa.id).cards[0].status='completed';await f.app.store.save();
  const b=await upload('新歌 B','[00:01.00]用户提供的辅助文字');assert.equal(b.status,200);const sb=b.body.songs.find(s=>s.id===b.body.createdSongId);
  assert.equal(calls,0);assert.equal(sa.source.lyrics,null);assert.equal(sa.outline,'');assert.equal(sa.cards[0].status,'pending');assert.equal(sa.jobs.length,0);
  assert.equal(b.body.songs.length,1);assert.equal(sb.cards[0].status,'pending');assert.equal(sb.number,undefined);assert.notEqual(sa.source.audio.path,sb.source.audio.path);
  assert(sb.cards[1].content.includes(sb.source.audio.path));assert(sb.cards[1].content.includes(sb.source.lyrics.path));assert(sb.cards[4].content.includes(sb.source.audio.path));assert(!JSON.stringify(sb.cards).includes(sa.source.audio.path));
  const audio=await fetch(f.base+'/api/artifact?'+new URLSearchParams({songId:sb.id,file:sb.source.audio.path}),{headers:{Range:'bytes=0-3'}});
  assert.equal(audio.status,206);assert.equal(audio.headers.get('content-type'),'audio/wav');assert.equal(await audio.text(),'RIFF');
  assert.equal((await fetch(f.base+'/api/artifact?'+new URLSearchParams({songId:sa.id,file:sb.source.audio.path}))).status,400);
  assert.equal(await fs.readFile(path.join(f.root,sb.source.lyrics.path),'utf8'),'[00:01.00]用户提供的辅助文字');
  const {stageContext}=await import('../workbench/agent.mjs');
  const context=await stageContext(f.root,f.app.store.manifest,sb,sb.cards[1]);assert(context.includes(sb.source.audio.path));assert(context.includes('用户提供的辅助文字'));assert(!context.includes('《测试歌曲》'));
  const restored=new Store(f.root);await restored.init();assert.equal(restored.state.songs.length,1);assert.equal(restored.song(sb.id).source.audio.path,sb.source.audio.path);
  assert.equal((await f.get()).songs[0].title,'新歌 B');assert((await fs.readdir(path.join(f.root,'workflow/history/song-sessions'))).length>=2);
  assert.equal((await fs.stat(path.join(f.root,sa.source.audio.path))).isFile(),true);
});

test('人工确认闭环：编辑歌词落盘、后续步骤锁定、分镜意见实际重做而不改任务',async t=>{
  const calls=[];let f;
  f=await fixture(t,{stages:['inventory','analysis','story','scenes'],agent:async opts=>{
    calls.push({kind:opts.kind,message:opts.message});
    if(opts.card.id==='analysis'){
      await fs.writeFile(path.join(f.root,'lyrics.srt'),'1\n00:00:00,000 --> 00:00:01,000\n可能有误的歌词\n');
      return {status:'completed',summary:'请核对歌词',artifacts:['lyrics.srt'],checks:[]};
    }
    return {status:'completed',summary:opts.message?'已按意见修改':'待确认',artifacts:['song.md'],checks:[]};
  }});
  await f.post('credentials',{key:secret,mode:'temporary',model:'deepseek-flash'});
  await f.post('save',{songId:f.songId,revision:0,outline:'用户的创意大纲'});
  await f.post('run',{songId:f.songId,cardId:'inventory'});await f.wait();
  assert.equal((await f.post('run',{songId:f.songId,cardId:'analysis'})).status,400);
  await f.post('approve',{songId:f.songId,cardId:'inventory'});
  await f.post('run',{songId:f.songId,cardId:'analysis'});let s=(await f.wait()).songs[0];
  assert(s.cards[1].reviewText.text.includes('可能有误'));
  assert.equal((await f.post('run',{songId:f.songId,cardId:'story'})).status,400);
  assert.equal((await f.post('approve',{songId:f.songId,cardId:'analysis',revision:-1,reviewText:'错版本'})).status,400);
  const corrected='1\n00:00:00,000 --> 00:00:01,000\n用户修正的歌词\n';
  const saved=await f.post('review/save',{songId:f.songId,cardId:'analysis',revision:s.revision,reviewText:corrected});assert.equal(saved.status,200);
  assert.equal(saved.body.songs[0].cards[1].status,'review');assert.equal(await fs.readFile(path.join(f.root,'lyrics.srt'),'utf8'),corrected);
  s=saved.body.songs[0];await f.post('approve',{songId:f.songId,cardId:'analysis',revision:s.revision,reviewText:corrected});
  await f.post('run',{songId:f.songId,cardId:'story'});s=(await f.wait()).songs[0];const content=s.cards[2].content;
  assert.equal((await f.post('run',{songId:f.songId,cardId:'scenes'})).status,400);
  assert.equal((await f.post('feedback',{songId:f.songId,cardId:'story',message:'第二张分镜改为近景'})).status,200);
  s=(await f.wait()).songs[0];assert.equal(calls.at(-1).kind,'produce');assert.equal(calls.at(-1).message,'第二张分镜改为近景');assert.equal(s.cards[2].content,content);assert.equal(s.cards[2].status,'review');assert.equal(s.cards[3].status,'pending');
});

test('分镜自检达到上限后停用重绘工具，只能提交已有图片等待确认',async t=>{
  const f=await fixture(t);const song=(await f.get()).songs[0];const card=song.cards[2];
  await fs.writeFile(path.join(f.root,'board.png'),Buffer.from('test-image-payload'));
  const vault=new Vault({file:path.join(f.root,'unused'),crypt});await vault.set(secret,'temporary','deepseek-flash');let round=0;
  const result=await runAgent({root:f.root,manifest:f.app.store.manifest,song,card,kind:'produce',vault,signal:new AbortController().signal,log:()=>{},request:async(key,body)=>{
    round++;const call=(name,args)=>({choices:[{message:{role:'assistant',tool_calls:[{id:`visual-${round}`,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}]});
    if(round<=3)return call('inspect_image',{file:'board.png'});
    assert.deepEqual(body.tools.map(t=>t.function.name),['finish_stage']);
    return call('finish_stage',{status:'needs_review',summary:'交给人工确认，造型尚需调整',artifacts:['board.png'],checks:['仍有造型问题']});
  }});
  assert.equal(round,4);assert.equal(result.status,'needs_review');assert(result.checks.includes('仍有造型问题'));
});
