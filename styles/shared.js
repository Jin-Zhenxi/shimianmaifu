'use strict';
// Shared staging, not a shared raster illustration: each renderer redraws its own geometry.
window.Art={
 W:1920,H:1080,
 hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0},
 rng(key){let a=this.hash(key);return()=>{a|=0;a=a+0x6d2b79f5|0;let z=Math.imul(a^a>>>15,1|a);z^=z+Math.imul(z^z>>>7,61|z);return((z^z>>>14)>>>0)/4294967296}},
 canvas(w,h){return Object.assign(document.createElement('canvas'),{width:w,height:h})},
 path(g,pts){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()},
 ellipse(x,y,rx,ry,n=32){return Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*rx,y+Math.sin(i/n*Math.PI*2)*ry])},
 rect(x,y,w,h){return[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]},
 pal:{paper:'#f5eedc',cream:'#efe1bd',sky:'#d8e2dc',far:'#c4ccc0',sage:'#a8b8a0',teal:'#47756c',ink:'#3c5048',sand:'#d5bd91',ochre:'#b68b5c',coral:'#c96950',red:'#b6503d',blush:'#d9a791',skin:'#d9b38a',hair:'#453d32',white:'#fffaed'},
 staging:{hero:[774,852],mailbox:[480,852],corner:[1434,626],vanishing:[1326,620]},
};
