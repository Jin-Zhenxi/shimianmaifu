'use strict';
(() => {
const out=document.querySelector('#out'),g=out.getContext('2d'),C=Art.pal;
let frame=0;
function ragged(points,key,amount=.26){const r=Art.rng(key),p=[];for(let i=0;i<points.length;i++){let a=points[i],b=points[(i+1)%points.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));for(let j=0;j<n;j++){let f=j/n;p.push([a[0]+(b[0]-a[0])*f+(r()-.5)*amount,a[1]+(b[1]-a[1])*f+(r()-.5)*amount])}}return p}
// Each call makes a separate textured cut-paper element, with its own edge and shadow.
function piece(key,pts,color,{edge=.85,shadow=1,rough=.3,kind='card',pinned=false}={}){
 const r=Art.rng(key),j=Art.rng(key+':'+frame),p=ragged(pts,key,rough);
 const xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);let x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0,h=Math.max(...ys)-y0;
 g.save();if(!pinned)g.translate((j()-.5)*4/6,(j()-.5)*4/6);
 Art.path(g,p);g.fillStyle=C.white;g.strokeStyle=C.white;g.lineWidth=edge*2;g.lineJoin='round';g.shadowColor='rgba(78,56,33,.25)';g.shadowBlur=shadow*8;g.shadowOffsetX=shadow*3;g.shadowOffsetY=shadow*5;g.fill();if(edge)g.stroke();g.shadowColor='transparent';
 g.save();Art.path(g,p);g.clip();g.fillStyle=color;g.fillRect(x0-1,y0-1,w+2,h+2);
 const count=Math.max(30,Math.min(11000,Math.ceil(w*h*2.3)));
 for(let i=0;i<count;i++){const x=x0+r()*w,y=y0+r()*h;g.fillStyle=i%3===0?'rgba(255,251,231,.18)':'rgba(89,65,39,.065)';g.fillRect(x,y,.15+r()*.24,.12+r()*.25)}
 g.lineWidth=.08;g.strokeStyle='rgba(86,61,34,.11)';for(let i=0;i<Math.min(500,w*h*.05);i++){let x=x0+r()*w,y=y0+r()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+.3+r()*1.4,y+.1+r()*.35);g.stroke()}
 if(kind==='kraft'){g.strokeStyle='rgba(108,76,39,.15)';g.lineWidth=.14;for(let i=0;i<100;i++){let y=y0+r()*h;g.beginPath();g.moveTo(x0,y);g.bezierCurveTo(x0+w*.3,y+2,x0+w*.7,y-2,x0+w,y);g.stroke()}}
 if(kind==='stripe'){for(let x=x0-10;x<x0+w+20;x+=3){g.fillStyle='rgba(255,247,224,.35)';g.fillRect(x,y0,1.2,h)}}
 g.restore();
 if(rough>.6){const rr=Art.rng(key+'fib');g.strokeStyle='rgba(255,251,235,.7)';g.lineWidth=.10;for(let i=0;i<p.length;i+=3){let [x,y]=p[i];g.beginPath();g.moveTo(x,y);g.lineTo(x+(rr()-.5)*.8,y+(rr()-.5)*.8);g.stroke()}}
 g.restore();
}
const rec=(key,x,y,w,h,col,o)=>piece(key,Art.rect(x,y,w,h),col,o);
const oval=(key,x,y,rx,ry,col,o)=>piece(key,Art.ellipse(x,y,rx,ry,26),col,o);
function strip(key,points,col,width=.6){const a=points[0],b=points[1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),nx=-dy/L*width/2,ny=dx/L*width/2;piece(key,[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],col,{edge:.1,shadow:.2,rough:.08})}
function win(key,x,y,w,h){rec(key+'back',x,y,w,h,C.ochre,{edge:.5,shadow:.5});rec(key+'glass',x+.8,y+.8,w-1.6,h-1.6,C.teal,{edge:.22,shadow:.3});rec(key+'sl',x+1.3,y+1.4,w*.35,h-3,C.sage,{edge:.1,shadow:.2,kind:'stripe'});strip(key+'bar',[[x+w*.5,y+.5],[x+w*.5,y+h]],C.cream,.6);rec(key+'sill',x-1,y+h,w+2,.7,C.white,{edge:.18,shadow:.45})}
function puppet(){
 oval('hero-ground',132,145,16,3,'#c4ae88',{edge:0,shadow:0});
 piece('far-leg',[[132,126],[136,126],[136,140],[132,140]],C.ochre,{edge:.4});
 piece('near-leg',[[125,127],[130,127],[129,141],[125,141]],'#8e8669',{edge:.5});
 piece('shoe-back',[[132,139],[137,139],[141,141],[140,142],[132,142]],C.hair,{edge:.3});
 piece('shoe-front',[[124,140],[129,140],[132,142],[132,143],[123,143]],C.hair,{edge:.3});
 piece('coat',[[124,108],[129,106],[135,109],[137,129],[122,131],[122,119]],C.teal,{edge:.8,kind:'card'});
 piece('coat-side',[[124,109],[127,110],[126,128],[122,130],[122,116]],'#668b78',{edge:.18,shadow:.2});
 piece('lapel',[[129,107],[132,108],[131,116],[128,111]],C.cream,{edge:.18,shadow:.3});
 strip('seam',[[131,116],[133,128]],'#385c51',.25);
 piece('right-arm',[[134,111],[138,116],[140,123],[137,124],[132,115]],C.teal,{edge:.55});
 oval('hand-right',139,124,1.7,2,C.skin,{edge:.3});
 piece('left-arm',[[123,112],[119,118],[120,126],[123,127],[124,118]],'#3b6258',{edge:.5});
 oval('hand-left',122,127,1.5,1.8,C.skin,{edge:.2});
 piece('letter',[[117.5,126],[126,127],[125,132],[117,131]],C.white,{edge:.24,shadow:.5});
 strip('letter-fold1',[[118,126.7],[121.8,130]],C.sand,.18);strip('letter-fold2',[[121.8,130],[125.5,127.4]],C.sand,.18);
 rec('neck',128,103,4.5,5.7,C.skin,{edge:.25});
 piece('head',[[128,97],[132,95],[136,97],[136.4,100],[138.6,101.5],[136.5,102.7],[135,106],[130,106],[128,103]],C.skin,{edge:.55});
 piece('hair',[[127,103],[125.5,101],[126,97],[128,94.5],[133,94],[136.5,96],[136,98],[131,98],[130,102]],C.hair,{edge:.4});
 oval('ear',129.6,101.2,.8,1.1,'#c99c78',{edge:.15,shadow:.2});
 oval('eye',135.7,100.3,.25,.3,C.ink,{edge:0,shadow:0});
 strip('mouth',[[135,104],[136,103.9]],'#9b7158',.16);
 rec('button',132.1,120,.5,.5,C.cream,{edge:0,shadow:0});
}
window.drawStudy=async t=>{
 frame=Math.floor(t*10);g.setTransform(1,0,0,1,0,0);g.fillStyle='#ccae7e';g.fillRect(0,0,1920,1080);g.scale(6,6);
 piece('kraft-base',Art.rect(-2,-2,324,184),'#dec59c',{edge:0,shadow:0,rough:0,kind:'kraft',pinned:true});
 piece('sky',[[3,5],[102,2],[199,5],[317,1],[319,113],[3,124]],'#e9e9d7',{rough:.9,shadow:.5,pinned:true});
 piece('hills',[[59,93],[91,79],[119,86],[150,75],[176,83],[207,75],[245,88],[281,83],[319,97],[320,110],[58,111]],'#c8d0b6',{edge:.5,rough:1,pinned:true});
 piece('cloud-a',[[124,20],[130,18],[140,20],[145,22],[151,22],[153,25],[123,25],[120,23]],C.white,{edge:.45,shadow:.45});
 piece('cloud-b',[[177,35],[182,33],[191,34],[196,37],[209,37],[212,39],[178,40]],C.white,{edge:.4,shadow:.35});
 [[84,49,21,50],[105,62,27,38],[144,43,22,57],[169,59,23,41],[195,51,29,51],[219,67,26,36]].forEach(([x,y,w,h],i)=>{
  rec('tower'+i,x,y,w,h,i%2?'#c0c8ac':'#d2d7bf',{edge:.55,shadow:.4,rough:.5});
  rec('tower-rim'+i,x+w-3,y,3,h,'#aabda8',{edge:.2,shadow:.2});
  for(let xx=x+4;xx<x+w-3;xx+=6)for(let yy=y+5;yy<99;yy+=9)rec('towerwin'+i+':'+xx+':'+yy,xx,yy,1.5,3,'#95ada1',{edge:.06,shadow:.05});
 });
 piece('street',[[0,119],[229,99],[322,148],[322,182],[-2,182]],'#c7b99a',{edge:.5,rough:.8,pinned:true});
 piece('pavement',[[0,130],[220,104],[288,183],[-2,183]],'#e3d0a9',{edge:.9,rough:1.5,kind:'kraft',pinned:true});
 strip('curb',[[220,104],[288,180]],C.white,1.1);
 strip('rail-a',[[222,109],[194,180]],'#8b8a73',.55);strip('rail-b',[[227,109],[226,180]],'#8b8a73',.55);
 for(let i=0;i<4;i++)piece('crosswalk'+i,[[255+i*10,150+i*3],[261+i*10,152+i*3],[277+i*11,163+i*3],[270+i*11,161+i*3]],C.white,{edge:.2,shadow:.3,rough:.6});
 [['pave1',[[0,156],[242,131]]],['pave2',[[0,175],[265,155]]],['pave3',[[42,180],[96,121]]],['pave4',[[115,180],[151,114]]]].forEach(([k,p])=>strip(k,p,'#c9b58d',.18));
 piece('left-wall',[[0,7],[65,15],[83,35],[83,119],[0,135]],'#cfb78d',{edge:.9,shadow:1.1,rough:.65,kind:'kraft'});
 piece('left-side',[[65,15],[83,35],[83,119],[65,122]],'#a88c63',{edge:.55,shadow:.5,kind:'kraft'});
 [[10,25,13,25],[38,29,15,24],[10,71,13,18],[39,72,14,18]].forEach((p,i)=>win('leftwin'+i,...p));
 strip('balcony-ledge',[[3,57],[59,59]],C.white,2);strip('floor-seam',[[1,64],[64,67]],C.ochre,.55);
 for(let x=6;x<57;x+=7)strip('balust'+x,[[x,51],[x,57]],C.ink,.4);
 rec('pot',46,51,10,4,C.coral,{edge:.3});
 [[48,47],[52,45],[55,48],[49,43]].forEach(([x,y],i)=>oval('plant'+i,x,y,2,3,C.teal,{edge:.24,shadow:.4}));
 piece('awning',[[1,99],[61,98],[72,105],[4,108]],C.teal,{edge:.6,shadow:1.2});
 for(let x=7;x<64;x+=10)piece('awnstripe'+x,[[x,99],[x+4,99],[x+8,106.4],[x+3.4,107]],C.white,{edge:.12,shadow:.2});
 rec('shop',7,109,40,20,'#55796b',{edge:.5});rec('door',10,111,15,18,'#8fa68c',{edge:.45});rec('shopwin',29,110,15,17,'#b9c5a2',{edge:.4});
 strip('linen-line',[[24,16],[143,43]],C.ochre,.25);
 piece('shirt1',[[80,28],[83,28.6],[86,29],[85,37],[81,36]],C.white,{edge:.3,shadow:.3});
 piece('shirt2',[[89,30.4],[95,32],[94,39],[89,37]],'#a0b496',{edge:.3,shadow:.3});
 piece('shirt3',[[99,33],[104,34],[103,41],[98,39]],C.white,{edge:.3,shadow:.3});
 strip('tramwire1',[[0,0],[320,49]],'#8a8268',.18);strip('tramwire2',[[0,6],[320,55]],'#8a8268',.18);strip('hanger',[[181,27],[179,78]],'#8a8268',.22);
 oval('streetlamp',179,78,2.5,.9,C.ochre,{edge:.15,shadow:.2});
 // A separate paper puppet disappears behind the near building.
 piece('depart-leg1',[[233,98],[235,98],[235,106],[232,106]],C.ochre,{edge:.25});
 piece('depart-leg2',[[238,98],[240,98],[242,104],[239,105]],C.ochre,{edge:.25});
 piece('depart-coat',[[234,86],[238,86],[242,92],[241,100],[232,99]],'#8aab92',{edge:.6});
 oval('depart-head',236,83.5,2,3,C.skin,{edge:.4});piece('depart-hair',[[234,84],[233,81],[236,79.5],[239,81],[239,83]],C.hair,{edge:.3});
 rec('depart-bag',239,92,5,5,C.coral,{edge:.4});
 piece('right-wall',[[244,-2],[322,-2],[322,138],[241,112]],'#dfcaa2',{edge:1,shadow:1.6,rough:.8,kind:'kraft'});
 piece('corner-side',[[244,-1],[254,-1],[253,116],[241,112]],'#ba9c72',{edge:.55,shadow:.8});
 strip('corner-light',[[254,0],[253,115]],C.white,.7);
 for(let row=0;row<3;row++){let y=15+row*31;win('rightw'+row,266,y,15,20);win('rightv'+row,299,y+2,14,22)}
 piece('right-base',[[257,111],[320,130],[320,138],[257,116]],'#c4ab82',{edge:.4,shadow:.8,kind:'kraft'});
 strip('drainpipe',[[250,4],[251,111]],'#8f7c5e',.6);rec('corner-note',247,60,7,15,C.white,{edge:.3,shadow:.6});rec('note-art',248.5,63,3.8,6.3,'#91a189',{edge:.15,shadow:.1});
 // Mailbox is assembled from individually cut cap, barrel, stand and label.
 oval('mail-ground',84,144,13,2.4,'#bda67d',{edge:0,shadow:0});
 rec('post-stand',77,128,7,12,C.red,{edge:.6});rec('post-foot',73,139,15,2,C.red,{edge:.5});
 piece('post-body',[[73,108],[75,106],[85,106],[88,109],[88,131],[72,131]],C.red,{edge:.85,shadow:1.2});
 piece('post-shadow',[[85,108],[88,109],[88,131],[85,130]],'#963f33',{edge:.15,shadow:.3});
 oval('post-cap',80,106,6.5,2.5,C.coral,{edge:.5,shadow:.7});
 rec('post-slot',74.5,111,11,2.3,'#713c2f',{edge:.2,shadow:.3});rec('post-label',76,118,7,5,C.white,{edge:.3,shadow:.3});
 strip('post-label-mark',[[77,120],[81,120]],C.ochre,.22);
 puppet();
 [[49,159],[156,163],[175,135],[36,145]].forEach(([x,y],i)=>piece('leaf'+i,[[x,y],[x+3,y-1],[x+4,y],[x+1,y+1]],'#be9b5f',{edge:.15,shadow:.5}));
 // Two small translucent tape tabs reinforce the handmade mounted-paper feeling.
 piece('tape-top',[[14,4],[32,5],[31,9],[13,8]],'#d9c89b',{edge:.08,shadow:.3,rough:.7});
 window.styleMeta={style:'collage',updateRate:10,jitterPhysicalPixels:2,independentPaperPieces:true};
};
})();
