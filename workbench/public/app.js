/* Plain JS; no credentials in localStorage, sessionStorage, URLs or console output. */
const $ = id => document.getElementById(id);
const fieldIds = ['goal','instructions','checks'];
const state = {data:null,songId:null,cardId:null,dirty:false,busy:false,lastJob:null,hasCompletion:false,skillSelection:null};
let toastTimer,offline=false;
const song = () => state.data?.songs.find(s=>s.id === state.songId);
const card = () => song()?.cards.find(c=>c.id === state.cardId);
const activeJob = () => song()?.jobs.find(j=>j.status === 'running');
const labels = {pending:'待制作',running:'处理中',completed:'已完成',blocked:'等待补充',review:'待查看确认'};
function toast(text) { $('toast').textContent=text; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,4500); }
async function api(endpoint,data) {
  const response = await fetch(`/api/${endpoint}`,data === undefined ? {cache:'no-store'} : {method:'POST',headers:{'Content-Type':'application/json','X-Workbench-Token':state.data.csrf},body:JSON.stringify(data)});
  const result = await response.json(); if (!response.ok) throw Error(result.error || '操作失败'); return result;
}
function element(tag,cls,text) { const el=document.createElement(tag); if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el; }
function artifactURL(file,download=false) { return `/api/artifact?${new URLSearchParams({songId:song().id,file,...(download ? {download:'1'} : {})})}`; }
function adopt(data,{force=false}={}) {
  const firstLoad=!state.data;
  const oldSong=song(), oldActive=oldSong?.active, oldJob=oldSong?.jobs.at(-1);
  state.data=data;
  if(!state.songId)state.songId=data.songs[0].id;
  const s=song();
  if(!state.cardId || force || (!state.dirty && oldActive !== s.active)) state.cardId=s.active || s.cards.at(-1).id;
  const latest=s.jobs.at(-1);
  if(oldJob?.status === 'running' && latest?.status !== 'running') {
    if(latest?.status === 'succeeded')toast(latest.kind === 'revise' ? '已局部更新卡片，并保存歌曲 prompt' : s.active !== oldActive ? '这一步已完成，已进入下一卡' : '结果已保存，请查看当前卡');
    else toast(latest?.error || '任务已结束');
  }
  render();
  if(!data.credential.configured && (firstLoad || !s.cards.every(c=>c.status==='completed')) && !state.dirty && !state.busy && !$('credential-dialog').open && !state.credentialsDismissed) openSettings();
}
function render() {
  const s=song(),c=card(); if(!s||!c)return;
  const credential=state.data.credential, job=activeJob();
  $('song-number').textContent=`NO. ${s.number}`; $('song-title').textContent=s.title; $('crumb-song').textContent=s.title; document.title=`${s.title} · MV 工作台`;
  $('step-count').textContent=`${s.cards.filter(c=>c.status==='completed').length} / ${s.cards.length}`;
  const navigationSignature=JSON.stringify([s.cards.map(c=>[c.id,c.status]),c.id,state.busy,Boolean(job)]);
  if($('steps').dataset.signature!==navigationSignature){$('steps').dataset.signature=navigationSignature;$('steps').replaceChildren(...s.cards.map((item,i)=>{
    const btn=element('button',`step${item.id===c.id ? ' active':''}`);btn.type='button';btn.setAttribute('aria-current',item.id===c.id ? 'step':'false');
    btn.append(element('span','step-num',item.status==='completed' ? '✓':String(i+1).padStart(2,'0')));
    const label=element('span');label.append(element('strong','',item.title),element('small','',labels[item.status]));btn.append(label,element('span','step-arrow','›'));
    btn.disabled=state.busy||Boolean(job);btn.addEventListener('click',()=>selectCard(item.id));return btn;
  }));}
  $('connection').textContent=`DeepSeek · ${credential.configured ? credential.mode==='permanent' ? '已保存':'临时连接' : '待连接'}`;
  $('connection').className=`connection${credential.configured ? ' connected':''}`;
  $('card-title').textContent=c.title; $('card-number').textContent=String(s.cards.indexOf(c)+1).padStart(2,'0');
  $('card-status').textContent=labels[c.status];$('card-status').className=`status ${c.status}`;
  if(!state.dirty){for(const f of fieldIds)$(f).value=c[f];$('number-input').value=s.number;$('title-input').value=s.title;$('outline-input').value=s.outline;}
  if(!state.dirty || state.skillSelection===null) state.skillSelection=s.enabledSkills ?? state.data.skills.map(s=>s.id);
  const skillsSignature=JSON.stringify([state.data.skills,state.skillSelection,state.busy,Boolean(job)]);
  if($('skills-list').dataset.signature!==skillsSignature){$('skills-list').dataset.signature=skillsSignature;$('skills-list').replaceChildren(...state.data.skills.map(skill=>{
    const label=element('label','skill-option'),input=element('input');input.type='checkbox';input.checked=state.skillSelection.includes(skill.id);input.disabled=Boolean(job)||state.busy;
    input.addEventListener('change',()=>{state.skillSelection=input.checked?[...state.skillSelection,skill.id]:state.skillSelection.filter(id=>id!==skill.id);state.dirty=true;$('save-status').textContent='● 有未保存的修改';});
    const text=element('span');text.append(element('strong','',skill.label),element('small','',skill.role));label.append(input,text);return label;
  }));}
  $('skills-rescan').disabled=Boolean(job)||state.busy;
  for(const f of [...fieldIds,'number-input','title-input','outline-input']) $(f).disabled=Boolean(job)||state.busy||(fieldIds.includes(f)&&c.status==='completed');
  $('save-button').disabled=Boolean(job)||state.busy;
  $('run-button').hidden=c.status==='completed'; $('reopen-button').hidden=c.status!=='completed';
  $('run-button').disabled=Boolean(job)||state.busy;$('reopen-button').disabled=Boolean(job)||state.busy;
  $('run-button').querySelector('span').textContent=c.status==='review' ? '按反馈重新制作':c.status==='blocked' ? '补充后重试':'开始这一步';
  $('chat-input').disabled=Boolean(job)||state.busy||c.status==='completed';$('send-button').disabled=$('chat-input').disabled;
  $('suggestions').hidden=c.chat.length>0||c.status==='completed';
  for(const btn of $('suggestions').querySelectorAll('button'))btn.disabled=Boolean(job)||state.busy;
  const chatSignature=JSON.stringify([c.id,c.chat]);
  if($('messages').dataset.signature!==chatSignature){$('messages').dataset.signature=chatSignature;$('messages').replaceChildren(...c.chat.map(m=>{const box=element('div',`message ${m.role}`);box.append(element('small','',m.role==='user'?'你':'DeepSeek'),element('div','',m.text));if(m.changes?.length)box.append(element('div','change',`已修改 ${m.changes.length} 处 · 已自动保存 prompt.md`));return box;}));}
  const last=s.jobs.filter(j=>j.cardId===c.id).at(-1);
  $('job-panel').hidden=!last || (last.status==='succeeded' && last.kind==='revise');
  if(last){const running=last.status==='running';$('job-spinner').hidden=!running;$('job-title').textContent=running ? last.kind==='revise'?'正在修改卡片':'后台制作中':last.status==='succeeded'?'当前任务已完成':last.status==='cancelled'?'任务已停止':'任务未完成';
    $('job-progress').textContent=(last.error || last.progress || '')+(last.skills?.length ? ` · 已加载 ${last.skills.map(id=>state.data.skills.find(s=>s.id===id)?.label||id).join('、')}` : '');$('cancel-button').hidden=!running;
    $('job-events').textContent=last.events.map(e=>`${new Date(e.at).toLocaleTimeString()}  ${e.text}`).join('\n');
    const sec=Math.max(0,Math.floor((Date.parse(last.finishedAt||new Date().toISOString())-Date.parse(last.startedAt))/1000));$('job-time').textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  }
  $('result-panel').hidden=!c.result;
  if(c.result){$('result-title').textContent=c.status==='review'?'请查看样片，再继续下一卡':c.status==='blocked'?'需要补充的内容':'阶段结果';$('result-summary').textContent=c.result.summary;
    $('approve-button').hidden=c.status!=='review';$('approve-button').disabled=Boolean(job)||state.busy;
    // Avoid recreating videos on every progress poll.
    const signature=JSON.stringify(c.result.artifacts)+c.id;
    if($('artifacts').dataset.signature!==signature){$('artifacts').dataset.signature=signature;$('artifacts').replaceChildren(...c.result.artifacts.map(file=>{const item=element('div','artifact');
      if(/\.(png|jpe?g|webp)$/i.test(file)){const img=element('img');img.src=artifactURL(file);img.alt=file;img.loading='lazy';item.append(img);}
      if(/\.(mp4|webm)$/i.test(file)){const video=element('video');video.src=artifactURL(file);video.controls=true;video.preload='metadata';item.append(video);}
      const a=element('a','',`${file} ↗`);a.href=artifactURL(file);a.target='_blank';a.rel='noopener';item.append(a);return item;}));}
    $('result-checks').replaceChildren(...c.result.checks.map(t=>element('li','',t)));
  }
  $('download-prompt').href=artifactURL(s.promptPath,true);$('download-prompt').title=s.promptPath;
  $('download-prompt').textContent=`${s.number}-${s.title}.md ↓`;
  const complete=s.cards.every(c=>c.status==='completed');$('complete-banner').hidden=!complete;state.hasCompletion=complete;
  $('complete-note').textContent=credential.mode==='permanent'?'永久凭证已保留，下次可继续使用。':'本次临时 API Key 已自动清除。';
  $('save-status').textContent=state.dirty?'● 有未保存的修改':'✓ 已同步到歌曲 prompt.md';
}
async function action(fn) { if(state.busy)return;state.busy=true;render();try{await fn();}catch(e){toast(e.message);}finally{state.busy=false;render();} }
async function save() {
  if(!state.dirty)return;
  const s=song(),c=card();
  const data=await api('save',{songId:s.id,revision:s.revision,number:$('number-input').value,title:$('title-input').value,outline:$('outline-input').value,enabledSkills:state.skillSelection,
    ...(c.status==='completed'?{}:{card:{id:c.id,...Object.fromEntries(fieldIds.map(f=>[f,$(f).value]))}})});
  state.dirty=false;adopt(data);
}
async function selectCard(id){if(id===state.cardId)return;await action(async()=>{await save();const data=await api('select',{songId:song().id,cardId:id});state.cardId=id;adopt(data);});}
function openSettings() {
  const c=state.data.credential;$('api-key').value='';$('api-model').value=c.model;
  document.querySelector(`input[name="credential-mode"][value="${c.mode}"]`).checked=true;
  $('clear-key').hidden=!c.configured&&!c.notice;$('credential-message').textContent=c.notice || (c.configured?'凭证已设置。填写新的 Key 可替换；不更改可直接关闭。':'');
  $('credential-dialog').showModal();
}
for(const id of [...fieldIds,'number-input','title-input','outline-input'])$(id).addEventListener('input',()=>{state.dirty=true;$('save-status').textContent='● 有未保存的修改';});
$('project-toggle').addEventListener('click',()=>{$('project-panel').hidden=!$('project-panel').hidden;});
$('skills-toggle').addEventListener('click',()=>{$('project-panel').hidden=false;$('skills-list').scrollIntoView({behavior:'smooth',block:'center'});});
$('skills-rescan').addEventListener('click',()=>action(async()=>{await save();adopt(await api('skills/rescan',{}));toast(`已发现 ${state.data.skills.length} 个 Skill`);}));
$('settings-open').addEventListener('click',openSettings);
$('settings-close').addEventListener('click',()=>{state.credentialsDismissed=true;$('api-key').value='';$('credential-dialog').close();});
$('credential-dialog').addEventListener('cancel',()=>{state.credentialsDismissed=true;$('api-key').value='';});
$('credential-dialog').addEventListener('close',()=>{$('api-key').value='';});
$('credential-form').addEventListener('submit',async e=>{e.preventDefault();const btn=$('connect-button');btn.disabled=true;$('credential-message').textContent='正在保存凭证…';
  try{const pending=api('credentials',{key:$('api-key').value.trim(),mode:document.querySelector('input[name="credential-mode"]:checked').value,model:$('api-model').value});$('api-key').value='';const data=await pending;state.credentialsDismissed=false;$('credential-dialog').close();adopt(data);toast('DeepSeek 凭证已保存；开始任务时会检查 API 连接');}
  catch(err){$('credential-message').textContent=err.message;}finally{btn.disabled=false;}
});
$('clear-key').addEventListener('click',async()=>{try{adopt(await api('credentials/clear',{}));$('credential-message').textContent='本机保存和内存中的凭证均已清除。';$('api-key').value='';$('clear-key').hidden=true;}catch(e){$('credential-message').textContent=e.message;}});
$('save-button').addEventListener('click',()=>action(async()=>{await save();toast('已保存歌曲 prompt.md');}));
$('run-button').addEventListener('click',()=>action(async()=>{await save();if(!state.data.credential.configured){openSettings();return;}adopt(await api('run',{songId:song().id,cardId:card().id}));}));
$('reopen-button').addEventListener('click',()=>action(async()=>{await save();adopt(await api('reopen',{songId:song().id,cardId:card().id}));toast('已重新打开当前卡及后续阶段');}));
$('approve-button').addEventListener('click',()=>action(async()=>{await save();adopt(await api('approve',{songId:song().id,cardId:card().id}),{force:true});toast('结果已确认，已进入下一卡');}));
$('cancel-button').addEventListener('click',()=>action(async()=>{adopt(await api('cancel',{songId:song().id}));}));
document.querySelectorAll('[data-suggestion]').forEach(btn=>btn.addEventListener('click',()=>{$('chat-input').value=btn.dataset.suggestion;$('chat-input').focus();}));
$('chat-form').addEventListener('submit',e=>{e.preventDefault();const message=$('chat-input').value.trim();if(!message||activeJob())return;action(async()=>{await save();if(!state.data.credential.configured){openSettings();return;}const data=await api('revise',{songId:song().id,cardId:card().id,message});$('chat-input').value='';adopt(data);$('messages').scrollTop=$('messages').scrollHeight;});});
$('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('chat-form').requestSubmit();}});
window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
async function poll(){try{if(!state.busy){adopt(await api('state'));if(offline){offline=false;toast('后台已重新连接');}}}catch{if(!offline){offline=true;toast('后台连接已断开。请重新运行启动脚本，页面会自动重连。');}}finally{setTimeout(poll,1200);}}
poll();
