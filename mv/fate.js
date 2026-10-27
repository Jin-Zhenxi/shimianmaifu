'use strict';
// One continuous location across L41-E1. All characters use Character.draw.
window.FateScene=(()=>{
 const {piece,box,line,oval,crab}=Paper;
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 const lerp=(a,b,u)=>a+(b-a)*u;
 const START=4628/30,END=5085/30;
 function windows(g,key,x,y,w,h){box(g,key,x,y,w,h,'#a5ad98',{edge:.35});box(g,key+'in',x+1,y+1,w-2,h-2,'#e4c18b',{edge:.15,shadow:0});line(g,[[x+w/2,y+1],[x+w/2,y+h]],'#839381',.6)}
 function curtain(g,closed,t){
  const bottom=41+102*closed,wind=Math.sin(t*1.7)*closed*1.5;
  piece(g,'fate-curtain',[[174,33],[294,33],[294,bottom-12],[283,bottom-1],[254,bottom+wind],[216,bottom-6],[183,bottom-2],[177,(33+bottom)/2]],'#cfc3a7',{edge:.85,shadow:1.7,rough:.45});
  if(closed>.05)for(let x=192;x<284;x+=22)line(g,[[x,40],[x+4,(40+bottom)/2],[x-3,bottom-8]],'#acaf96',.5);
 }
 function draw(g,absolute){
  const t=Math.floor(absolute*10+1e-6)/10,s=t-START;
  const stage=absolute<4733/30?'L41':absolute<4798/30?'L42':absolute<4942/30?'L43':'E1';
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#344d56';g.fillRect(0,0,1920,1080);
  // One slow push over the entire sequence; never a beat-driven camera pump.
  const z=1+.035*ease((absolute-START)/(END-START));g.translate(960,540);g.scale(z,z);g.translate(-960,-540);g.scale(6,6);
  box(g,'fate-sky',-10,-10,340,140,'#344d56',{edge:0,shadow:0});
  piece(g,'fate-moon',oval(219,27,10,10),'#eadcaa',{edge:.45,shadow:0});
  for(let i=0;i<7;i++){const x=35+i*37,y=50+(i%3)*9;box(g,'fatefar'+i,x,y,30,66-i%3*8,i%2?'#4b6568':'#58716e',{edge:.25});for(let xx=x+5;xx<x+26;xx+=8)for(let yy=y+6;yy<111;yy+=12)box(g,'fatewin'+i+xx+yy,xx,yy,3,5,(Math.floor(xx+yy)%3)?'#ceb385':'#74887d',{edge:.1,shadow:0})}
  piece(g,'fate-ground',[[-10,111],[330,110],[330,190],[-10,190]],'#788984',{edge:0});
  piece(g,'fate-road',[[-10,123],[330,118],[330,158],[-10,166]],'#607775',{edge:.45});
  box(g,'fatealley',177,46,114,92,'#49676a',{edge:.45});for(let i=0;i<3;i++)windows(g,'faralley'+i,199+i*29,60,11,21);
  box(g,'fatepole',269,44,1.7,95,'#bdc1a6',{edge:.2});piece(g,'fatelamp',[[263,43],[276,43],[274,53],[265,53]],'#e4c18b',{edge:.4});
  g.save();g.globalAlpha=.18;piece(g,'fatelight',[[266,53],[273,53],[299,141],[241,141]],'#eed49b',{edge:0,shadow:0});g.restore();
  piece(g,'fateleft',[[0,9],[51,14],[51,137],[0,150]],'#5b7471',{edge:.7});windows(g,'fatewindow',12,37,24,36);
  piece(g,'fateoverhang',[[37,18],[309,18],[315,34],[33,34]],'#7f9990',{edge:.7,shadow:1});line(g,[[50,26],[304,26]],'#c9bd93',.5);
  // Female stays behind the curtain and exits behind the right-hand pier.
  const fx=lerp(247,319,ease(s/5.4));
  g.save();g.beginPath();g.rect(174,37,120,105);g.clip();
  if(s<5.4)crab(g,'female',fx,137,35,{id:'female',facing:s<1.6?'back':'right',action:'walk',t,u:undefined});
  g.restore();
  const close=ease((s-2.5)/1.2),open=ease((s-(4798/30-START)) /1.8);
  g.save();g.translate(open*129,0);curtain(g,close,t);g.restore();
  box(g,'fatearchleft',164,32,9,109,'#81978b',{edge:.45});box(g,'fatearchright',294,32,9,109,'#81978b',{edge:.45});
  // Male's gaze and claw fall only after the passage is revealed to be empty.
  const sad=stage==='L43'||stage==='E1',lower=ease((absolute-4942/30)/2);
  g.save();const jitter=Paper.rng('male:'+Math.floor(t*10));g.translate((jitter()-.5)*.32,(jitter()-.5)*.32);
  g.translate(103,146);g.rotate(lower*.025);g.translate(-103,-146);
  crab(g,'male',103,146,53,{id:'male',facing:'right',action:sad?'wait':'search',expression:sad?'sad':'hopeful',t,u:undefined,paperJitter:false});
  g.restore();
  // A small loose scrap signals the same gust that moves the canvas curtain.
  if(s>2.1&&s<8.5){const u=ease((s-2.1)/6.4);g.save();g.translate(130+160*u,100-25*Math.sin(u*Math.PI));g.rotate(u*2);piece(g,'wind-paper',[[0,0],[3,-1],[4,1],[1,2]],'#cfbf9e',{edge:.2,shadow:0});g.restore()}
  // Foreground corner anchors the single geography; the doorway remains legible.
  line(g,[[0,170],[320,155]],'#9baba0',.3);
  return{stage,t,closed:close*(1-open),femaleX:fx,maleLower:lower};
 }
 return{draw,start:START,end:END,duration:END-START};
})();
