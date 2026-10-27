'use strict';
// Native p5.js 2.3.3 + p5.brush 2.2.3 drawing: wax hatch fills, pencil outlines.
// No raster input and no post-hoc conversion of either of the other two studies.
(() => {
const C=Art.pal,W=1920,H=1080;let P,paint,boil=0,initialized;
function seed(key,moving=false){const h=Art.hash(key+(moving?':'+boil:''));P.randomSeed(h);P.noiseSeed(h);brush.seed(h)}
function off(pts,key,amplitude=.22){const r=Art.rng(key);return pts.map(([x,y])=>[x+(r()-.5)*amplitude*2,y+(r()-.5)*amplitude*2])}
function ink(key,pts,color=C.ink,weight=.24,closed=false){seed(key,true);brush.noHatch();brush.noFill();brush.noWash();brush.set('2B',color,weight*4.2);let q=off(pts,key+':'+boil,.12);if(closed)q.push(q[0]);if(q.length===2)brush.line(...q[0],...q[1]);else brush.spline(q,.18)}
function shape(key,pts,color,{dist=.95,weight=.7,angle=38,edge=.22,outline=C.ink,base=true,shade=null}={}){
 seed(key);brush.noStroke();brush.noHatch();brush.noFill();brush.noWash();
 if(base){brush.wash('#faf4e4',255);brush.polygon(pts);brush.noWash()}
 brush.hatch(dist,angle,{rand:.20,continuous:true,gradient:false});brush.hatchStyle('wax',color,weight);brush.polygon(off(pts,key+'fill',.24));brush.noHatch();
 if(shade){brush.hatch(dist*1.8,angle+77,{rand:.22,continuous:true});brush.hatchStyle('wax',shade,weight*.55);brush.polygon(pts);brush.noHatch()}
 if(edge)ink(key+'edge',pts,outline,edge,true);
}
function box(key,x,y,w,h,c,opt={}){shape(key,[[x+.1,y],[x+w,y+.35],[x+w-.3,y+h],[x,y+h-.25]],c,opt)}
function oval(key,x,y,rx,ry,c,opt={}){shape(key,Art.ellipse(x,y,rx,ry,26),c,opt)}
function pane(key,x,y,w,h){box(key+'frame',x,y,w,h,C.ochre,{dist:.65,weight:.55,edge:.16});box(key+'glass',x+1,y+1,w-2,h-2,'#73998a',{dist:.6,weight:.62,edge:.15});
 ink(key+'shutter',[[x+3,y+2],[x+3,y+h-2]],'#acc1a2',.7);ink(key+'middle',[[x+w*.53,y],[x+w*.5,y+h]],C.ochre,.28);ink(key+'cross',[[x+1,y+h*.57],[x+w-1,y+h*.58]],C.cream,.25);ink(key+'sill',[[x-1,y+h+.7],[x+w+1,y+h+.5]],C.ochre,.4)}
function world(){
 P.background('#f9f3e3');P.push();P.translate(-W/2,-H/2);P.scale(6);
 // Hand-sized wax patches keep the large sky from becoming a uniform screen fill.
 for(let y=1;y<104;y+=22)for(let x=0;x<320;x+=44){let r=Art.rng('sky'+x+':'+y);shape('sky'+x+':'+y,[[x-2,y],[x+48,y+r()*2],[x+47,y+25],[x-2,y+24]],'#d3decd',{dist:1.15,weight:.43,angle:18+r()*15,edge:0,base:false})}
 shape('hill',[[60,93],[90,80],[120,86],[148,76],[176,85],[208,74],[247,88],[280,84],[320,97],[320,108],[60,109]],'#bcc6ab',{dist:.95,weight:.6,edge:0});
 shape('cloud-a',[[123,22],[129,19],[138,20],[143,23],[151,24],[151,26],[121,26]],'#fffbed',{dist:.55,weight:.85,edge:.12,outline:'#b9c6b3'});
 shape('cloud-b',[[178,36],[184,33],[192,35],[198,38],[209,38],[211,40],[177,40]],'#fffbed',{dist:.5,weight:.8,edge:.12,outline:'#b9c6b3'});
 [[84,49,20,51],[106,61,27,39],[144,43,23,57],[170,59,23,41],[195,51,30,51],[220,67,25,36]].forEach(([x,y,w,h],i)=>{
  box('tower'+i,x,y,w,h,i%2?'#bbc8ac':'#cbd2b8',{dist:1.05,weight:.58,angle:55+i*9,edge:.14,outline:'#879c85'});
  for(let xx=x+4;xx<x+w-3;xx+=6)for(let yy=y+6;yy<98;yy+=9)ink('twindow'+i+':'+xx+':'+yy,[[xx,yy],[xx,yy+3]],'#8ca590',.6);
 });
 shape('street',[[0,119],[229,99],[320,148],[320,180],[0,180]],'#b9b197',{dist:1.2,weight:.8,angle:20,edge:0,shade:'#d1c9ac'});
 shape('pavement',[[0,130],[220,104],[288,181],[-1,181]],'#dfc89d',{dist:1.1,weight:.85,angle:15,edge:.16,outline:'#b69c72',shade:'#e6d3ae'});
 ink('curb',[[1,130],[220,104],[288,180]],'#f5e8c8',.7);
 ink('rail1',[[222,109],[212,131],[194,180]],'#93937d',.3);ink('rail2',[[227,109],[227,140],[226,180]],'#93937d',.3);
 for(let i=0;i<4;i++)shape('crosswalk'+i,[[255+i*10,150+i*3],[261+i*10,152+i*3],[277+i*11,163+i*3],[270+i*11,161+i*3]],'#fff9e5',{dist:.65,weight:1.1,edge:.1,outline:'#d5c7a8'});
 [[[0,156],[242,131]],[[0,175],[265,155]],[[42,180],[96,121]],[[115,180],[151,114]]].forEach((p,i)=>ink('paving'+i,p,'#bfa980',.15));
 shape('left-wall',[[0,7],[65,15],[83,35],[83,119],[0,135]],'#d8bf90',{dist:.8,weight:.85,angle:48,edge:.25,outline:'#8a805f',shade:'#e3cfaa'});
 shape('left-side',[[65,15],[83,35],[83,119],[65,122]],'#af976f',{dist:.65,weight:.7,angle:100,edge:.2,outline:'#8d7e5f'});
 [[10,25,13,25],[38,29,15,24],[10,71,13,18],[39,72,14,18]].forEach((p,i)=>pane('leftwin'+i,...p));
 ink('ledge',[[3,56],[29,57],[59,59]],'#9c805a',.8);ink('ledge-highlight',[[3,55],[30,56],[59,58]],'#f6e8c4',.5);
 for(let x=6;x<57;x+=7)ink('baluster'+x,[[x,50.8],[x+.25,57]],'#657464',.22);
 box('pot',46,51,10,4,C.coral,{dist:.6,weight:.8,edge:.15});
 [[48,47],[52,45],[55,48],[49,43]].forEach(([x,y],i)=>{ink('plant-stem'+i,[[50,52],[x,y]],C.teal,.25);oval('leaf'+i,x,y,2,3.2,'#66826b',{dist:.6,weight:.8,edge:.13,outline:'#5a735b'})});
 shape('awning',[[1,99],[61,98],[72,105],[4,108]],'#557d68',{dist:.65,weight:.85,edge:.25,outline:'#3e6956'});
 for(let x=7;x<64;x+=10)shape('awnstripe'+x,[[x,99],[x+4,99],[x+8,106.4],[x+3.4,107]],'#f4edd5',{dist:.5,weight:.8,edge:0});
 box('shop',7,109,40,20,'#4f7665',{dist:.7,weight:.8,edge:.2});box('door',10,111,15,18,'#93ac8c',{dist:.65,weight:.75,edge:.2});box('shopwin',29,110,15,17,'#bdc6a0',{dist:.7,weight:.8,edge:.2});
 ink('linen-line',[[24,16],[85,30],[143,43]],'#948568',.16);
 shape('shirt1',[[80,28],[83,28.6],[86,29],[85,37],[81,36]],'#fff8e4',{dist:.5,weight:.85,edge:.1});
 shape('shirt2',[[89,30.4],[95,32],[94,39],[89,37]],'#b5c3a2',{dist:.6,weight:.7,edge:.12});
 shape('shirt3',[[99,33],[104,34],[103,41],[98,39]],'#fff8e4',{dist:.5,weight:.85,edge:.1});
 ink('wire1',[[0,0],[155,25],[320,49]],'#7d806c',.12);ink('wire2',[[0,6],[154,31],[320,55]],'#7d806c',.12);ink('hanger',[[181,27],[180,50],[179,78]],'#7d806c',.15);oval('lamp',179,78,2.5,.8,'#b39767',{dist:.45,weight:.65,edge:.1});
 // Background passerby, occluded by the right building, is deliberately incomplete.
 ink('depart-leg1',[[234,98],[234,105]],'#8f8363',.9);ink('depart-leg2',[[239,98],[242,104]],'#8f8363',.9);
 shape('depart-coat',[[234,86],[238,86],[242,92],[241,100],[232,99]],'#91ad91',{dist:.6,weight:.8,edge:.18});
 oval('depart-head',236,83.5,2,3,C.skin,{dist:.45,weight:.8,edge:.15});shape('depart-hair',[[234,84],[233,81],[236,79.5],[239,81],[239,83]],C.hair,{dist:.5,weight:.75,edge:.1});box('depart-bag',239,92,5,5,C.coral,{dist:.6,weight:.8,edge:.15});
 shape('right-wall',[[244,-1],[320,-1],[320,138],[241,112]],'#dfcba6',{dist:.85,weight:.8,angle:78,edge:.3,outline:'#ab926b',shade:'#ead9b8'});
 shape('corner-side',[[244,-1],[254,-1],[253,116],[241,112]],'#c0a478',{dist:.7,weight:.7,angle:98,edge:.2,outline:'#a38b63'});
 ink('corner-light',[[254,0],[253.5,65],[253,115]],'#f6e9c9',.5);
 for(let row=0;row<3;row++){let y=15+row*31;pane('rightw'+row,266,y,15,20);pane('rightv'+row,299,y+2,14,22)}
 shape('right-base',[[257,111],[320,130],[320,138],[257,116]],'#c7b28d',{dist:.7,weight:.7,edge:.15});
 ink('drainpipe',[[250,4],[250.5,62],[251,111]],'#a28c68',.48);box('corner-note',247,60,7,15,'#f4ead1',{dist:.6,weight:.6,edge:.12});box('note-art',248.5,63,3.8,6.3,'#9ca88c',{dist:.5,weight:.7,edge:.1});
 // The post box is drawn with red wax in several directions, not a smooth solid fill.
 oval('mail-ground',84,144,13,2.4,'#b9a67e',{dist:1,weight:.5,edge:0,base:false});
 box('post-stand',77,128,7,12,'#b75840',{dist:.6,weight:.8,edge:.18});box('post-foot',73,139,15,2,'#9c4d39',{dist:.6,weight:.8,edge:.18});
 shape('post-body',[[73,108],[75,106],[85,106],[88,109],[88,131],[72,131]],'#c66044',{dist:.55,weight:.9,edge:.25,outline:'#8f4936',shade:'#d37952'});
 shape('post-side',[[85,108],[88,109],[88,131],[85,130]],'#a34c37',{dist:.45,weight:.75,edge:.13});oval('post-cap',80,106,6.5,2.5,'#d17b56',{dist:.5,weight:.9,edge:.2,outline:'#9e513b'});
 ink('post-slot',[[74.5,112],[85,112]],'#753e31',.9);box('post-label',76,118,7,5,'#f5e8c7',{dist:.5,weight:.9,edge:.12});ink('postmark',[[77,120],[81,120]],'#a18d68',.12);
 // Waiting figure: slightly curved linework, ragged wax, an unposted letter.
 oval('hero-ground',132,145,15,2.5,'#baa77c',{dist:1,weight:.55,edge:0,base:false});
 shape('far-leg',[[132,126],[136,126],[136,140],[132,140]],'#9e9171',{dist:.5,weight:.8,edge:.18});shape('near-leg',[[125,127],[130,127],[129,141],[125,141]],'#afa083',{dist:.5,weight:.8,edge:.18});
 shape('shoe-back',[[132,139],[137,139],[141,141],[140,142],[132,142]],'#574e3e',{dist:.45,weight:.8,edge:.18});shape('shoe-front',[[124,140],[129,140],[132,142],[132,143],[123,143]],'#574e3e',{dist:.45,weight:.8,edge:.18});
 shape('coat',[[124,108],[129,106],[135,109],[137,129],[122,131],[122,119]],'#548171',{dist:.5,weight:.95,edge:.25,outline:'#385b50',shade:'#7b9b7e'});
 shape('coat-side',[[124,109],[127,110],[126,128],[122,130],[122,116]],'#47745e',{dist:.5,weight:.6,edge:.1});
 shape('lapel',[[129,107],[132,108],[131,116],[128,111]],'#e1cfaa',{dist:.45,weight:.7,edge:.15});ink('seam',[[131,116],[133,128]],'#3a6254',.18);
 shape('right-arm',[[134,111],[138,116],[140,123],[137,124],[132,115]],'#608773',{dist:.45,weight:.8,edge:.22});oval('hand-right',139,124,1.7,2,C.skin,{dist:.4,weight:.8,edge:.15});
 shape('left-arm',[[123,112],[119,118],[120,126],[123,127],[124,118]],'#49755f',{dist:.45,weight:.8,edge:.2});oval('hand-left',122,127,1.5,1.8,C.skin,{dist:.4,weight:.8,edge:.12});
 shape('letter',[[117.5,126],[126,127],[125,132],[117,131]],'#fff5de',{dist:.4,weight:.95,edge:.15,outline:'#ad9670'});ink('fold',[[118,126.7],[121.8,130],[125.5,127.4]],'#b4a17c',.12);
 box('neck',128,103,4.5,5.7,C.skin,{dist:.4,weight:.8,edge:.1});
 shape('head',[[128,97],[132,95],[136,97],[136.4,100],[138.6,101.5],[136.5,102.7],[135,106],[130,106],[128,103]],'#ddba93',{dist:.4,weight:.85,edge:.18,outline:'#8c775c'});
 shape('hair',[[127,103],[125.5,101],[126,97],[128,94.5],[133,94],[136.5,96],[136,98],[131,98],[130,102]],'#514b3b',{dist:.4,weight:.9,edge:.2,outline:'#514b3b'});
 oval('ear',129.6,101.2,.8,1.1,'#d1a680',{dist:.4,weight:.75,edge:.1});ink('eye',[[135.5,100.3],[136,100.4]],'#4c4b3d',.25);ink('mouth',[[135,104],[136,103.9]],'#a0785d',.12);
 [[49,159],[156,163],[175,135],[36,145]].forEach(([x,y],i)=>shape('ground-leaf'+i,[[x,y],[x+3,y-1],[x+4,y],[x+1,y+1]],'#c3a361',{dist:.45,weight:.8,edge:.1}));
 P.pop();
}
function paper(){let c=Art.canvas(W,H),g=c.getContext('2d'),im=g.createImageData(W,H),r=Art.rng('crayon-paper');for(let i=0;i<im.data.length;i+=4){let q=248+r()*7;im.data[i]=q;im.data[i+1]=q-1;im.data[i+2]=q-5;im.data[i+3]=255}g.putImageData(im,0,0);g.strokeStyle='rgba(108,91,55,.08)';g.lineWidth=.6;for(let i=0;i<700;i++){let x=r()*W,y=r()*H;g.beginPath();g.moveTo(x,y);g.lineTo(x+3+r()*8,y+r()*2);g.stroke()}return c}
const grain=paper();
window.drawStudy=async t=>{
 boil=Math.floor(t*12);
 if(!initialized)initialized=new Promise((resolve,reject)=>new p5(p=>{P=p;p.setup=async()=>{try{p.pixelDensity(1);p.createCanvas(W,H,p.WEBGL);p.setAttributes('preserveDrawingBuffer',true);p.noLoop();brush.instance(p);brush.load();brush.add('wax',{type:'default',weight:.33,scatter:.35,sharpness:.75,grain:2,opacity:185,spacing:.07,pressure:[1.15,.85],rotate:'natural'});resolve()}catch(e){reject(e)}};p.draw=()=>{if(paint)paint()} }));
 await initialized;await new Promise(resolve=>setTimeout(resolve,100));paint=world;await P.redraw();P.drawingContext.finish();
 const g=document.querySelector('#out').getContext('2d');g.globalCompositeOperation='source-over';g.clearRect(0,0,W,H);g.drawImage(P.canvas,0,0,W,H);g.globalCompositeOperation='multiply';g.drawImage(grain,0,0);g.globalCompositeOperation='source-over';
 window.styleMeta={style:'crayon',p5Version:p5.VERSION,brush:'p5.brush 2.2.3',fill:'native crayon hatching',outlineRate:12,fillSeed:'fixed'};
};
})();
