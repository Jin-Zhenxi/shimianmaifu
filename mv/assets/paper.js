'use strict';
window.Paper=(()=>{
const C={paper:'#f4ecda',white:'#fff9e9',sky:'#e0e5d7',far:'#c6d0b8',sage:'#a8b8a0',green:'#5e7c6c',dark:'#47655a',sand:'#dfc79e',brown:'#af9165',red:'#ba644b',ink:'#506151'};
function rng(key){let a=811;for(const c of String(key))a=Math.imul(a^c.charCodeAt(0),16777619);return()=>{a|=0;a=a+0x6d2b79f5|0;let z=Math.imul(a^a>>>15,1|a);z^=z+Math.imul(z^z>>>7,61|z);return((z^z>>>14)>>>0)/4294967296}}
const tile=Object.assign(document.createElement('canvas'),{width:256,height:256}),tg=tile.getContext('2d'),r=rng('paper');
for(let i=0;i<9500;i++){tg.fillStyle=i%3?'rgba(89,63,31,.10)':'rgba(255,251,229,.38)';tg.fillRect(r()*256,r()*256,.6+r()*1.3,.5+r())}
tg.strokeStyle='rgba(92,68,38,.12)';tg.lineWidth=.6;for(let i=0;i<120;i++){let x=r()*256,y=r()*256;tg.beginPath();tg.moveTo(x,y);tg.lineTo(x+r()*7+2,y+r()*2);tg.stroke()}
const patterns=new WeakMap();
function path(g,p){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()}
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const oval=(x,y,rx,ry,n=28)=>Array.from({length:n},(_,i)=>[x+Math.cos(i/n*6.2831853)*rx,y+Math.sin(i/n*6.2831853)*ry]);
function piece(g,key,pts,color,{edge=.6,shadow=.6,rough=.22}={}){const rand=rng(key),p=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let j=0;j<n;j++){let u=j/n;p.push([a[0]+(b[0]-a[0])*u+(rand()-.5)*rough*2,a[1]+(b[1]-a[1])*u+(rand()-.5)*rough*2])}}
 let pat=patterns.get(g);if(!pat){pat=g.createPattern(tile,'repeat');pat.setTransform(new DOMMatrix().scale(1/6));patterns.set(g,pat)}
 g.save();path(g,p);g.fillStyle=C.white;g.strokeStyle=C.white;g.lineWidth=edge*2;g.lineJoin='round';g.shadowColor='rgba(70,49,27,.17)';g.shadowBlur=shadow*6;g.shadowOffsetX=shadow*2;g.shadowOffsetY=shadow*4;g.fill();if(edge)g.stroke();g.shadowColor='transparent';g.save();path(g,p);g.clip();g.fillStyle=color;g.fill();g.fillStyle=pat;g.fill();g.restore();g.restore()}
function box(g,k,x,y,w,h,col,o){piece(g,k,rect(x,y,w,h),col,o)}
function line(g,pts,c=C.ink,w=.45){g.save();g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.restore()}
function crab(g,variant,x,y,size=40,more={}){if(window.MV_ACTOR_HOOK)return window.MV_ACTOR_HOOK(g,variant,x,y,size,more);return Character.draw(g,{variant,id:variant,x,y,size,t:.3,u:.3,paperJitter:false,shadow:true,...more})}
function flower(g,k,x,y,s=1){for(let i=0;i<5;i++)piece(g,k+i,oval(x+Math.cos(i*1.256)*s*2,y+Math.sin(i*1.256)*s*2,s*1.8,s*1.8),'#d99983',{edge:.18,shadow:.1});piece(g,k+'seed',oval(x,y,s,s),'#d6b976',{edge:.1,shadow:0})}
function painting(g,k,x,y,w,h,kind=0){box(g,k+'frame',x,y,w,h,'#b99c72',{edge:.7,shadow:.9});box(g,k+'mat',x+2,y+2,w-4,h-4,C.white,{edge:.2,shadow:.2});box(g,k+'art',x+5,y+5,w-10,h-10,kind?'#d8d4b4':'#bbcbb1',{edge:0,shadow:0});let xx=x+w*.5,yy=y+h*.55;line(g,[[xx,yy+7],[xx,yy-7]],C.green,.8);flower(g,k+'fl',xx,yy-7,Math.min(w,h)/17);piece(g,k+'leaf',[[xx,yy+3],[xx-6,yy],[xx-4,yy+6]],C.green,{edge:.15,shadow:0})}
function mailbox(g,x=80,y=145,s=1){g.save();g.translate(x,y);g.scale(s,s);box(g,'poststem',-3,-17,6,17,'#ab533d');box(g,'postfoot',-9,-1,18,2,C.red);piece(g,'postbody',[[-10,-41],[-7,-45],[7,-45],[11,-41],[11,-15],[-11,-15]],C.red,{edge:.8,shadow:.9});piece(g,'postcap',oval(0,-44,8,3),'#d68662');box(g,'postslot',-7,-37,14,3,'#774231',{edge:.2,shadow:.15});box(g,'postlabel',-5,-29,10,7,C.white,{edge:.25,shadow:.2});line(g,[[-3,-26],[3,-26]],C.brown,.4);g.restore()}
function windowPane(g,k,x,y,w,h){box(g,k,x,y,w,h,C.brown,{edge:.45,shadow:.4});box(g,k+'glass',x+1,y+1,w-2,h-2,'#729383',{edge:.2,shadow:.2});box(g,k+'light',x+2,y+2,w*.3,h-4,'#b8c9ad',{edge:.1,shadow:.1});line(g,[[x+w/2,y+1],[x+w/2,y+h]],C.sand,.7);line(g,[[x-1,y+h+1],[x+w+1,y+h+1]],C.white,.8)}
return{C,rng,piece,box,line,rect,oval,crab,flower,painting,mailbox,windowPane};
})();
