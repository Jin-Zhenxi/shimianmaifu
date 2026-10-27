'use strict';
// Native 320 x 180 drawing. All painting primitives are integer pixels.
// No translucent paint, gradients or antialiased curves: the final image uses <=32 RGBs.
(() => {
const P=['#f6eddb','#eadbbb','#d9c8a5','#c1ac86','#b09269','#937b58','#77654b','#534b3c',
'#dce5dc','#c9d7ca','#b4c4b2','#97ad9c','#769485','#587d70','#3d6359','#2f4d45',
'#e4bda0','#c99678','#a6765b','#533f34','#d5896b','#c66c51','#ac513d','#803e32',
'#f9f3df','#d6d5bb','#b8bda4','#899e91','#d9bc7c','#caa363','#a38255','#777c6b'];
const small=Art.canvas(320,180),g=small.getContext('2d',{alpha:false});
const rect=(x,y,w,h,c)=>{g.fillStyle=P[c];g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
function line(x0,y0,x1,y1,c){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;while(true){rect(x0,y0,1,1,c);if(x0===x1&&y0===y1)break;let e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}}
function poly(pts,c){let min=Math.max(0,Math.min(...pts.map(p=>p[1]))),max=Math.min(179,Math.max(...pts.map(p=>p[1])));for(let y=Math.ceil(min);y<=max;y++){let xs=[];for(let j=0,k=pts.length-1;j<pts.length;k=j++){let a=pts[k],b=pts[j];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)rect(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1,c)}}
const B=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function dither(x,y,w,h,c0,c1,amount){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){let a=typeof amount==='function'?amount(i,j):amount;rect(i,j,1,1,B[j&3][i&3]<a*16?c1:c0)}}
function cloud(x,y){rect(x+3,y,15,2,24);rect(x,y+2,30,2,24);rect(x+6,y+4,25,1,0)}
function windowP(x,y,w,h){rect(x-1,y-1,w+2,h+2,4);rect(x,y,w,h,13);rect(x+1,y+1,w-2,h-2,11);rect(x+w-3,y+1,2,h-2,14);line(x+1,y+h-3,x+w-2,y+h-3,9);line(x+Math.floor(w/2),y,x+Math.floor(w/2),y+h-1,4);rect(x-2,y+h,w+4,1,0)}
function hero(t){let k=Math.floor(t*4)%4,dx=[0,0,1,0][k];
 poly([[118,143],[124,142],[147,157],[142,159]],3);
 rect(125,131,4,10,7);rect(132,130,4,10,6);rect(123,140,7,2,19);rect(132,139,8,2,19);
 poly([[123,109],[130,107],[136,113],[137,130],[123,132]],14);rect(123,112,3,17,13);rect(127,111,2,13,11);line(131,111,133,126,15);line(124,127,135,128,15);
 poly([[135,113],[139,118],[139,124],[136,124],[131,115]],13);rect(138,123,3,3,16);
 poly([[123,113],[119,119],[119,127],[122,129],[124,126],[124,118]],14);rect(120,126,3,3,16);
 rect(118,127,8,5,24);line(118,127,122,130,2);line(126,127,122,130,2);
 rect(127,104,5,5,16);rect(130,98,7,7,16);rect(137,101,2,2,16);rect(135,101,1,1,19);rect(134,105,2,1,18);
 rect(128,95,7,3,19);rect(126,97,5,7,19);rect(129,96,8,2,19);rect(128,99,2,3,7);rect(131,98,4,1,18);
 if(dx){rect(130,107,2,1,17)}
}
window.drawStudy=async t=>{
 rect(0,0,320,180,0);dither(0,0,320,98,0,8,(x,y)=>Math.max(0,.38-y/250));cloud(122,21);cloud(179,35);
 poly([[62,92],[92,79],[119,86],[150,75],[177,84],[207,73],[241,88],[270,85],[300,99]],9);
 const towers=[[83,49,21,49,9],[105,62,28,36,10],[143,42,24,57,9],[169,59,24,40,25],[195,50,30,52,10],[219,67,25,36,9]];
 towers.forEach(([x,y,w,h,c],i)=>{rect(x,y,w,h,c);rect(x+w-4,y,4,h,c===9?10:11);for(let a=x+4;a<x+w-4;a+=6)for(let b=y+6;b<97;b+=9){rect(a,b,2,4,27);rect(a,b,1,2,25)}rect(x+2,y-2,w-4,2,25)});
 // Street and rails converge toward the same corner in all three studies.
 poly([[0,119],[229,99],[320,148],[320,180],[0,180]],2);
 poly([[221,100],[320,128],[320,180],[171,180]],3);
 poly([[0,130],[220,104],[287,180],[0,180]],1);
 line(0,130,220,104,24);line(220,104,287,180,4);line(222,106,291,180,0);
 line(222,109,218,120,6);line(218,120,205,153,6);line(205,153,194,180,6);
 line(227,109,226,120,6);line(226,120,225,153,6);line(225,153,226,180,6);
 for(let i=0;i<4;i++)poly([[255+i*10,150+i*3],[261+i*10,152+i*3],[277+i*11,163+i*3],[270+i*11,161+i*3]],0);
 line(0,156,242,131,2);line(0,175,265,155,2);line(42,180,96,121,2);line(115,180,151,114,2);
 // Left tong-lau facade; shutter grids are individual pixels.
 poly([[0,7],[65,15],[83,35],[83,119],[0,135]],2);poly([[65,15],[83,35],[83,119],[65,122]],4);
 rect(0,13,65,3,1);line(0,61,66,64,4);line(0,94,65,95,4);line(0,64,64,67,24);
 [[10,25,13,25],[38,29,15,24],[10,71,13,18],[39,72,14,18]].forEach(a=>windowP(...a));
 for(let yy=32;yy<48;yy+=3){line(10,yy,15,yy+1,11);line(40,yy,45,yy+1,11)}
 poly([[1,99],[61,98],[72,105],[4,108]],13);for(let i=5;i<64;i+=9)poly([[i,99],[i+4,99],[i+8,107],[i+3,108]],0);
 rect(8,109,39,20,14);rect(11,111,14,17,12);rect(28,110,16,17,11);rect(45,108,2,19,4);
 rect(4,55,54,4,4);rect(4,55,54,1,0);for(let x=7;x<56;x+=7)rect(x,51,1,7,7);
 rect(47,50,9,4,21);rect(49,45,5,5,12);rect(46,47,4,2,13);rect(53,44,4,3,13);
 // Drying linen, thin tram cables, sparse details; no screen text or UI.
 line(24,16,143,43,6);rect(81,29,5,8,0);rect(88,31,5,7,11);rect(96,33,5,7,24);line(79,27,103,34,7);
 line(0,0,320,49,6);line(0,6,320,55,6);line(181,27,179,78,6);rect(177,77,5,2,6);
 // Far figure is drawn before the foreground corner; only a fragment remains visible.
 poly([[226,102],[234,103],[244,111],[235,113]],3);rect(233,98,2,8,6);rect(239,98,2,7,6);rect(232,105,4,1,19);rect(240,104,4,1,19);
 poly([[233,86],[238,85],[242,91],[241,100],[232,99]],12);rect(240,91,4,5,20);rect(234,82,4,5,16);rect(233,80,5,3,19);
 // Right building occludes the departing figure.
 poly([[244,0],[320,0],[320,138],[241,112]],1);poly([[244,0],[254,0],[253,116],[241,112]],4);rect(252,0,2,115,24);
 for(let row=0;row<3;row++){let yy=15+row*31;windowP(266,yy,15,20);windowP(299,yy+2,14,22)}
 line(254,109,320,130,3);poly([[258,111],[320,130],[320,138],[257,116]],2);
 line(250,4,251,111,5);rect(247,60,7,15,0);rect(249,64,3,5,12);
 // Red post box is the only saturated accent.
 poly([[71,140],[82,139],[104,153],[91,156]],3);
 rect(76,129,8,11,22);rect(73,139,15,2,23);rect(72,108,16,23,22);rect(74,105,12,3,21);rect(76,103,8,2,20);
 rect(72,109,3,20,21);rect(85,109,3,22,23);rect(74,111,11,3,23);rect(75,111,9,1,7);rect(76,118,7,5,0);line(77,120,81,120,4);rect(77,127,7,1,20);
 hero(t);
 // Paving flecks / fallen leaves remain in the same strict palette.
 const r=Art.rng('pixel-ground');for(let i=0;i<135;i++){let x=Math.floor(r()*280),y=132+Math.floor(r()*48);if(x<168||y>150)rect(x,y,1,1,i%4===0?24:2)}
 [[49,159],[156,163],[175,135],[36,145]].forEach(([x,y])=>{rect(x,y,3,1,28);rect(x+2,y-1,2,1,29)});
 dither(0,177,320,3,1,2,.28);
 const out=document.querySelector('#out'),og=out.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(small,0,0,1920,1080);
 window.styleMeta={style:'pixel',native:[320,180],scale:6,palette:P,characterAnimation:'4 discrete sprite poses, no interpolation'};
};
})();
