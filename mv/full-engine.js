'use strict';
window.FullMV=(()=>{
 const W=1920,H=1080,D=MV_DATA,E=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},mix=(a,b,u)=>a+(b-a)*u;
 const stage=document.createElement('canvas');stage.width=W;stage.height=H;const sg=stage.getContext('2d');
 const groups={L02:'L01',L04:'L03',L06:'L05',L10:'L09',L11:'L09',L12:'L09',L16:'L15',L17:'I1',L18:'I1',L19:'L20',L26:'L25',L28:'L27',L29:'L27',L32:'L27',L34:'L33',L35:'L33',L36:'L33',L37:'L27',L39:'L40',L42:'L41',L43:'L41',E1:'L41',E3:'E2'};
 const backgrounds=new Map();
 let lastDrawT=null;
 function transitionFrames(index){if(!index)return 0;const a=D.timeline[index-1].id,b=D.timeline[index].id;return D.transitions[index-1].duration_frames||((groups[a]||a)!==(groups[b]||b)?18:0)}
 function background(id){const key=groups[id]||id;if(backgrounds.has(key))return backgrounds.get(key);
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  window.MV_ACTOR_HOOK=()=>null;try{SketchScenes.draw(g,key)}finally{window.MV_ACTOR_HOOK=null}
  backgrounds.set(key,c);return c;
 }
 const letterLayout={rows:D.letter.visual_lines,size:D.letter.font_size_px,hold_start:280.3,duration:310.3};
 let letterBase;
 function letter(g,t){if(!letterBase){letterBase=document.createElement('canvas');letterBase.width=W;letterBase.height=H;const h=letterBase.getContext('2d');window.MV_ACTOR_HOOK=()=>null;try{SketchScenes.draw(h,'E4')}finally{window.MV_ACTOR_HOOK=null}h.setTransform(6,0,0,6,0,0);Paper.piece(h,'final-letter',[[28,10],[292,10],[292,170],[28,170]],'#fff9e9',{edge:1,shadow:2})}
  g.setTransform(1,0,0,1,0,0);g.drawImage(letterBase,0,0);g.save();g.fillStyle='#4d5145';g.font='36px LetterSans';g.textBaseline='top';for(const row of letterLayout.rows){g.globalAlpha=E((t-row.start)/.4);g.fillText(row.text,row.x,row.y)}g.restore();
 }
 function renderBackground(g,index,t){const shot=D.timeline[index],id=shot.id,f=Math.round(t*30),local=f-shot.start_frame;
  const n=transitionFrames(index);
  g.setTransform(1,0,0,1,0,0);
  if(index&&n&&local<n){const v=E(local/n),old=background(D.timeline[index-1].id),next=background(id);g.drawImage(old,0,0);
   const memory=['L14','L30','L33','L38'].includes(id)||['L14','L30','L36','L38'].includes(D.timeline[index-1].id);
   if(memory){const x=960*(1-v),y=540*(1-v),w=W*v,h=H*v;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(next,0,0);g.restore();if(w>1){g.save();g.strokeStyle='#fff9e9';g.lineWidth=12;g.strokeRect(x,y,w,h);g.restore()}}
   else{const x=W*v;g.save();g.beginPath();g.rect(0,0,x,H);g.clip();g.drawImage(next,0,0);g.restore();if(v>0){g.save();g.fillStyle=['L25','L27','L39','L41'].includes(id)?'#81978b':'#c5ad86';g.strokeStyle='#fff9e9';g.lineWidth=5;g.beginPath();g.moveTo(x-18,-6);g.lineTo(x+18,0);g.lineTo(x+12,H+6);g.lineTo(x-15,H);g.closePath();g.fill();g.stroke();g.restore()}}
  }else g.drawImage(background(id),0,0);
 }
 function curtain(g,t){const q=Math.floor(t*10)/10,close=E((q-4733/30)/.55),open=E((q-4798/30)/1.6),bottom=41+102*close;g.save();g.scale(6,6);g.beginPath();g.rect(174,33,147,114);g.clip();g.translate(open*140,0);Paper.piece(g,'full-curtain',[[174,33],[294,33],[294,bottom-12],[283,bottom-1],[254,bottom],[216,bottom-6],[183,bottom-2],[177,(33+bottom)/2]],'#cfc3a7',{edge:.85,shadow:1.7});if(close>.05)for(let x=192;x<284;x+=22)Paper.line(g,[[x,40],[x+4,(40+bottom)/2],[x-3,bottom-8]],'#acaf96',.5);g.restore()}
 function extras(g,shot,t,states){const id=shot.id,u=E((t-shot.start_frame/30)/((shot.end_frame-shot.start_frame)/30));g.save();g.scale(6,6);
  if(id==='L08'){
   // Cover the static lowered shutter with the revealed shop, then lower one physical sheet.
   Paper.box(g,'openshop',57,20,200,108,'#d9dfc4');Paper.painting(g,'shutart',182,67,47,46);
   const h=mix(4,105,u);g.save();g.beginPath();g.rect(56,20,202,h);g.clip();Paper.box(g,'moving-shutter',57,20,200,108,'#aeae94');for(let y=25;y<129;y+=5)Paper.line(g,[[59,y],[255,y]],'#8d9783',.45);g.restore();
  }
  if(id==='L35'||id==='L36'){
   let p=id==='L35'?E((t-shot.start_frame/30)/1.3):1,fall=id==='L36'?u*57:0;
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rx=(8+31*p),x=160+Math.cos(a)*rx,y=47+Math.sin(a)*rx*.65+fall;g.save();g.translate(x,y);g.rotate(a+u*.3);Paper.piece(g,'fullfire'+i,[[0,0],[4,2],[9,0],[4,-2]],i%2?'#d9ac69':'#d6907e',{edge:.35,shadow:.3});g.restore()}
  }
  // An occasional paper leaf is part of the town's wind, not a full-frame effect.
  if(!['L03','L04','L14','L19','L20','L23','L30','L33','L34','L35','L36','L38'].includes(id))for(let i=0;i<2;i++){const x=((t*6+i*153)%370)-25,y=112+Math.sin(t*.7+i)*7;Paper.piece(g,'windleaf'+i,[[x,y],[x+2,y-1],[x+4,y],[x+1,y+1]],'#c6ad7d',{edge:.16,shadow:0})}
  g.restore();
 }
 function drawActors(g,index,t){const shot=D.timeline[index],states=ActorTracks.sample(index,t),id=shot.id;
  const sorted=Object.entries(states).sort((a,b)=>a[1].y-b[1].y);
  for(const [actor,s]of sorted){
   if(s.x < -70||s.x>390||s.y < -60)continue;
   if(id==='L23'&&actor!=='male')continue;
   // Backdrop occluders and doors keep sightlines physical and faces unmasked.
   g.save();g.scale(6,6);
   if(actor==='female'&&['L01','L02','L09','L10','L11','L12','L24','L31'].includes(id)){g.beginPath();g.rect(-70,-60,311,260);g.clip()}
   if(actor==='male'&&['L01','L02'].includes(id)){g.restore();continue}
   if(actor==='female'&&['I1','L17','L18'].includes(id)){g.beginPath();g.rect(182,43,113,67);g.clip()}
   if(actor==='female'&&['L19','L20'].includes(id)){g.beginPath();g.rect(40,22,90,106);g.clip()}
   if(actor==='female'&&['L41','L42','L43','E1'].includes(id)){g.beginPath();g.rect(174,38,120,104);g.clip()}
   const jitter=Paper.rng(actor+Math.floor(t*10));g.translate((jitter()-.5)*.3,(jitter()-.5)*.3);
   Character.draw(g,{...s,variant:actor==='extra'?'extra':actor});g.restore();
  }
  return states;
 }
 function tram(g,shot,t){const u=E((t-shot.start_frame/30)/((shot.end_frame-shot.start_frame)/30)),x=mix(-180,365,u);g.save();g.scale(6,6);g.translate(x-155,0);Paper.box(g,'movingtram',155,54,158,78,'#8faaa0',{edge:.8,shadow:1.3});Paper.box(g,'tramstripe',155,111,158,10,'#3e6760');for(let xx=166;xx<303;xx+=32)Paper.box(g,'tramwin'+xx,xx,65,23,36,'#e5cb97',{edge:.3});for(const xx of [176,292])Paper.piece(g,'tramwheel'+xx,Paper.oval(xx,134,8,5),'#344f51');g.restore()}
 function draw(g,t){t=Math.max(0,Math.min(310.3-1/30,t));if(t===lastDrawT||(t>=280.3&&lastDrawT>=280.3))return;const f=Math.floor(t*30+1e-5),index=D.timeline.findIndex(s=>s.start_frame<=f&&f<s.end_frame);
  if(f>=5659){letter(g,t);const u=Math.max(0,Math.min(1,(t-5659/30)/.8));if(u<1){g.save();g.beginPath();g.rect(W*u,0,W*(1-u),H);g.clip();g.drawImage(background('E3'),0,0);g.restore()}window.mvState={id:t<232.133492?'E4':'E5',t,states:{}};lastDrawT=t;return}
  if(index<0)throw Error('Uncovered frame '+f);const shot=D.timeline[index];
  renderBackground(sg,index,t);sg.save();const n=transitionFrames(index),local=f-shot.start_frame;if(n&&local<n){sg.beginPath();sg.rect(0,0,W*E(local/n),H);sg.clip()}extras(sg,shot,t);sg.restore();const states=drawActors(sg,index,t);
  if(shot.id==='L26')tram(sg,shot,t);
  if(['L41','L42','L43','E1'].includes(shot.id))curtain(sg,t);
  // One slow monotonic camera move per location group; actors and props share it.
  const group=groups[shot.id]||shot.id;let first=index,last=index;
  while(first>0&&(groups[D.timeline[first-1].id]||D.timeline[first-1].id)===group)first--;
  while(last+1<D.timeline.length&&(groups[D.timeline[last+1].id]||D.timeline[last+1].id)===group)last++;
  const z=1+.018*E(t/(5659/30));
  g.setTransform(1,0,0,1,0,0);g.save();g.translate(960,540);g.scale(z,z);g.drawImage(stage,-960,-540);g.restore();
  const lyric=D.lyrics.find(x=>x.start<=t&&t<x.end);if(lyric){g.save();g.textAlign='center';g.textBaseline='middle';g.font='60px LetterSans';g.lineJoin='round';g.strokeStyle='#344b49';g.lineWidth=8;g.fillStyle='#fff9e9';g.strokeText(lyric.text,960,1003);g.fillText(lyric.text,960,1003);g.restore()}
  window.mvState={id:shot.id,t,states};lastDrawT=t;
 }
 return{draw,backgrounds,letterLayout};
})();
