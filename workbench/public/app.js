/* Plain JS; no credentials in localStorage, sessionStorage, URLs or console output. */
const $ = id => document.getElementById(id);
const fieldIds = ['task-content'];
const state = {data:null,songId:null,cardId:null,dirty:false,reviewDirty:false,busy:false,lastJob:null,hasCompletion:false,skillSelection:null};
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
  if(!data.songs.some(s=>s.id===state.songId)){state.songId=data.songs[0].id;state.cardId=null;state.dirty=false;state.skillSelection=null;}
  const s=song();
  if(!state.cardId || force || (!state.dirty && oldActive !== s.active)) state.cardId=s.active || s.cards.at(-1).id;
  const latest=s.jobs.at(-1);
  if(oldJob?.status === 'running' && latest?.status !== 'running') {
    if(latest?.status === 'succeeded')toast(latest.kind === 'revise' ? '已局部更新卡片，并保存歌曲 prompt' : s.active !== oldActive ? '这一步已完成，已进入下一卡' : '结果已保存，请查看当前卡');
    else toast(latest?.error || '任务已结束');
  }
  render();
  if(firstLoad) $('song-dialog').showModal();
}
function render() {
  const s=song(),c=card(); if(!s||!c)return;
  const credential=state.data.credential, job=activeJob();
  const anyJob=state.data.songs.some(s=>s.jobs.some(j=>j.status==='running'));
  $('new-song').disabled=state.busy||anyJob;
  $('song-source').hidden=!s.source;
  if(s.source){$('source-description').textContent=`音频：${s.source.audio.name} · ${s.source.lyrics ? `辅助歌词：${s.source.lyrics.name}` : '未上传歌词，歌曲理解阶段需本地转写与听校'}`;
    const url=artifactURL(s.source.audio.path);if($('source-player').getAttribute('src')!==url)$('source-player').src=url;
    $('source-lyrics').hidden=!s.source.lyrics;if(s.source.lyrics)$('source-lyrics').href=artifactURL(s.source.lyrics.path);
  }else{$('source-player').removeAttribute('src');}
  $('song-title').textContent=s.title; $('crumb-song').textContent=s.title; document.title=`${s.title} · MV 工作台`;
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
  if(!state.dirty){$('task-content').value=c.content || c.goal;$('title-input').value=s.title;$('outline-input').value=s.outline;}
  if(!state.dirty || state.skillSelection===null) state.skillSelection=s.enabledSkills ?? state.data.skills.map(s=>s.id);
  const skillsSignature=JSON.stringify([state.data.skills,state.skillSelection,state.busy,Boolean(job)]);
  if($('skills-list').dataset.signature!==skillsSignature){$('skills-list').dataset.signature=skillsSignature;$('skills-list').replaceChildren(...state.data.skills.map(skill=>{
    const label=element('label','skill-option'),input=element('input');input.type='checkbox';input.checked=state.skillSelection.includes(skill.id);input.disabled=Boolean(job)||state.busy;
    input.addEventListener('change',()=>{state.skillSelection=input.checked?[...state.skillSelection,skill.id]:state.skillSelection.filter(id=>id!==skill.id);state.dirty=true;$('save-status').textContent='● 有未保存的修改';});
    const text=element('span');text.append(element('strong','',skill.label),element('small','',skill.role));label.append(input,text);return label;
  }));}
  $('skills-rescan').disabled=Boolean(job)||state.busy;
  for(const f of [...fieldIds,'title-input','outline-input']) $(f).disabled=Boolean(job)||state.busy||(fieldIds.includes(f)&&c.status==='completed');
  $('save-button').disabled=Boolean(job)||state.busy;
  $('run-button').hidden=['completed','review'].includes(c.status); $('reopen-button').hidden=c.status!=='completed';
  const locked=s.cards.slice(0,s.cards.indexOf(c)).some(c=>c.status!=='completed');
  $('stage-lock').hidden=!locked;
  $('run-button').disabled=Boolean(job)||state.busy||locked||c.status==='review';$('reopen-button').disabled=Boolean(job)||state.busy;
  $('run-button').querySelector('span').textContent=c.status==='review' ? '按反馈重新制作':c.status==='blocked' ? '补充后重试':'开始这一步';
  const last=s.jobs.filter(j=>j.cardId===c.id).at(-1);
  $('job-panel').hidden=!last || (last.status==='succeeded' && last.kind==='revise');
  if(last){const running=last.status==='running';$('job-spinner').hidden=!running;$('job-title').textContent=running ? last.kind==='revise'?'正在修改卡片':'后台制作中':last.status==='succeeded'?'当前任务已完成':last.status==='cancelled'?'任务已停止':'任务未完成';
    $('job-progress').textContent=(last.error || last.progress || '')+(last.skills?.length ? ` · 已加载 ${last.skills.map(id=>state.data.skills.find(s=>s.id===id)?.label||id).join('、')}` : '');$('cancel-button').hidden=!running;
    $('job-events').textContent=last.events.map(e=>`${new Date(e.at).toLocaleTimeString()}  ${e.text}`).join('\n');
    const sec=Math.max(0,Math.floor((Date.parse(last.finishedAt||new Date().toISOString())-Date.parse(last.startedAt))/1000));$('job-time').textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  }
  $('result-panel').hidden=!c.result;
  $('lyrics-review').hidden=!(c.reviewText && c.status==='review');
  const reviewSignature=`${s.id}/${c.id}`;
  if($('lyrics-review-text').dataset.card!==reviewSignature){state.reviewDirty=false;$('lyrics-review-text').dataset.card=reviewSignature;}
  if(!state.reviewDirty)$('lyrics-review-text').value=c.reviewText?.text||'';
  $('lyrics-review-text').disabled=Boolean(job)||state.busy;
  $('save-lyrics').disabled=Boolean(job)||state.busy||!state.reviewDirty;
  $('result-feedback').hidden=!(c.status==='review' && ['story','scenes'].includes(c.id));
  $('feedback-text').disabled=Boolean(job)||state.busy;$('feedback-send').disabled=Boolean(job)||state.busy;
  const feedbackSignature=JSON.stringify([s.id,c.id,c.chat]);
  if($('feedback-history').dataset.signature!==feedbackSignature){$('feedback-history').dataset.signature=feedbackSignature;$('feedback-history').replaceChildren(...c.chat.map(m=>element('div',`message ${m.role}`,m.text)));}
  if(c.result){$('result-title').textContent=c.status==='review'?(c.id==='analysis'?'请核对歌词，再确认结果':'请查看结果，确认后开启下一步'):c.status==='blocked'?'需要补充的内容':'阶段结果';$('result-summary').textContent=c.result.summary;
    $('approve-button').hidden=c.status!=='review';$('approve-button').disabled=Boolean(job)||state.busy||locked;
    // Avoid recreating videos on every progress poll.
    const signature=JSON.stringify(c.result.artifacts)+s.id+c.id+last?.finishedAt;
    if($('artifacts').dataset.signature!==signature){$('artifacts').dataset.signature=signature;$('artifacts').replaceChildren(...c.result.artifacts.map(file=>{const item=element('div','artifact');
      if(/\.(png|jpe?g|webp)$/i.test(file)){const img=element('img');img.src=artifactURL(file);img.alt=file;img.loading='lazy';item.append(img);}
      if(/\.(mp4|webm)$/i.test(file)){const video=element('video');video.src=artifactURL(file);video.controls=true;video.preload='metadata';item.append(video);}
      const a=element('a','',`${file} ↗`);a.href=artifactURL(file);a.target='_blank';a.rel='noopener';item.append(a);return item;}));}
    $('result-checks').replaceChildren(...c.result.checks.map(t=>element('li','',t)));
  }
  $('download-prompt').href=artifactURL(s.promptPath,true);$('download-prompt').title=s.promptPath;
  $('download-prompt').textContent=`${s.title}.md ↓`;
  const complete=s.cards.every(c=>c.status==='completed');$('complete-banner').hidden=!complete;state.hasCompletion=complete;
  $('complete-note').textContent=credential.mode==='permanent'?'永久凭证已保留，下次可继续使用。':'本次临时 API Key 已自动清除。';
  $('save-status').textContent=state.dirty?'● 有未保存的修改':'✓ 已同步到歌曲 prompt.md';
}
async function action(fn) { if(state.busy)return;state.busy=true;render();try{await fn();}catch(e){toast(e.message);}finally{state.busy=false;render();} }
async function save() {
  if(state.reviewDirty) await saveReview();
  if(!state.dirty)return;
  const s=song(),c=card();
  const data=await api('save',{songId:s.id,revision:s.revision,title:$('title-input').value,outline:$('outline-input').value,enabledSkills:state.skillSelection,
    ...(c.status==='completed'?{}:{card:{id:c.id,content:$('task-content').value}})});
  state.dirty=false;adopt(data);
}
async function saveReview(){
  const data=await api('review/save',{songId:song().id,cardId:card().id,revision:song().revision,reviewText:$('lyrics-review-text').value});
  state.reviewDirty=false;adopt(data);
}
$('lyrics-review-text').addEventListener('input',()=>{state.reviewDirty=true;$('save-lyrics').disabled=false;});
$('save-lyrics').addEventListener('click',()=>action(async()=>{await saveReview();toast('歌词修改已保存，确认后开启下一步');}));
$('result-feedback').addEventListener('submit',e=>{e.preventDefault();const message=$('feedback-text').value.trim();if(!message)return;action(async()=>{await save();const data=await api('feedback',{songId:song().id,cardId:card().id,message});$('feedback-text').value='';adopt(data);});});
async function selectCard(id){if(id===state.cardId)return;await action(async()=>{await save();const data=await api('select',{songId:song().id,cardId:id});state.cardId=id;adopt(data);});}
function openSettings() {
  const c=state.data.credential;$('api-key').value='';$('api-model').value=c.model;
  document.querySelector(`input[name="credential-mode"][value="${c.mode}"]`).checked=true;
  $('clear-key').hidden=!c.configured&&!c.notice;$('credential-message').textContent=c.notice || (c.configured?'凭证已设置。填写新的 Key 可替换；不更改可直接关闭。':'');
  $('credential-dialog').showModal();
}
function openImport(){ $('song-form').reset();$('lyrics-file').disabled=true;$('lyrics-file-label').hidden=true;$('import-message').textContent='';$('song-dialog').showModal(); }
$('new-song').addEventListener('click',()=>action(async()=>{await save();openImport();}));
$('song-dialog-close').addEventListener('click',()=>{$('song-dialog').close();});
$('audio-file').addEventListener('change',()=>{const file=$('audio-file').files[0];if(file)$('import-song-title').value=file.name.replace(/\.[^.]+$/,'').slice(0,70);});
$('include-lyrics').addEventListener('change',()=>{const enabled=$('include-lyrics').checked;$('lyrics-file-label').hidden=!enabled;$('lyrics-file').disabled=!enabled;$('lyrics-file').required=enabled;if(!enabled)$('lyrics-file').value='';});

$('song-form').addEventListener('submit',async e=>{
  e.preventDefault();if(state.busy)return;
  state.busy=true;render();$('import-button').disabled=true;$('song-dialog-close').disabled=true;
  $('import-message').textContent='正在导入歌曲，请稍候…';
  try {
    const audio=$('audio-file').files[0],lyrics=$('lyrics-file').files[0];
    if(!audio?.size)throw Error('请选择非空歌曲文件');
    if(audio.size+(lyrics?.size||0)>120*1024*1024)throw Error('上传总大小不能超过 120MB');
    if($('include-lyrics').checked&&(!lyrics?.size||lyrics.size>1024*1024))throw Error('请选择不超过 1MB 的非空歌词文件');
    const form=new FormData();form.set('title',$('import-song-title').value.trim());form.set('audio',audio);if($('include-lyrics').checked)form.set('lyrics',lyrics);
    const response=await fetch('/api/songs/import',{method:'POST',headers:{'X-Workbench-Token':state.data.csrf},body:form});
    const data=await response.json();if(!response.ok)throw Error(data.error||'导入失败');
    state.songId=data.createdSongId;state.cardId=null;state.skillSelection=null;state.dirty=false;
    $('song-dialog').close();$('project-panel').hidden=false;adopt(data,{force:true});toast('歌曲已导入；填写创意大纲，点击「开始这一步」启动制作');
  }catch(err){$('import-message').textContent=err.message;}
  finally{state.busy=false;$('import-button').disabled=false;$('song-dialog-close').disabled=false;render();}
});
for(const id of [...fieldIds,'title-input','outline-input'])$(id).addEventListener('input',()=>{state.dirty=true;$('save-status').textContent='● 有未保存的修改';});
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
$('approve-button').addEventListener('click',()=>action(async()=>{await save();adopt(await api('approve',{songId:song().id,cardId:card().id,revision:song().revision,...(card().reviewText?{reviewText:$('lyrics-review-text').value}:{})}),{force:true});toast('结果已确认，已开启下一步');}));
$('cancel-button').addEventListener('click',()=>action(async()=>{adopt(await api('cancel',{songId:song().id}));}));
window.addEventListener('beforeunload',e=>{if(state.dirty||state.reviewDirty){e.preventDefault();e.returnValue='';}});
async function poll(){try{if(!state.busy){adopt(await api('state'));if(offline){offline=false;toast('后台已重新连接');}}}catch{if(!offline){offline=true;toast('后台连接已断开。请重新运行启动脚本，页面会自动重连。');}}finally{setTimeout(poll,1200);}}
poll();
