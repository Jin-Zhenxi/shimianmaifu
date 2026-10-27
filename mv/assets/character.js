/* Single source of character geometry for the collage MV. Browser + CommonJS.
 * Claude/Clawd-inspired paper crabs: block-shaped shell, four short feet,
 * simple dark eyes. This is the project's adaptation, not an official asset.
 * All geometry is drawn here; scenes must call Character.draw(), never copy it.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.Character=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DESIGN_VERSION='collage-crabs-v1.1';
const PALETTES=Object.freeze({
 male:Object.freeze({shell:'#d78050',light:'#e8a16a',dark:'#b85d3c',belly:'#edb184',ink:'#493e33',blush:'#d99a83'}),
 female:Object.freeze({shell:'#dcba65',light:'#ecd28e',dark:'#b4934c',belly:'#f1d99a',ink:'#4d4434',blush:'#e4a19c',bow:'#d68c9c',bowDark:'#bb7188'}),
 extra:Object.freeze({shell:'#a7aaa0',light:'#c1c2b7',dark:'#848a80',belly:'#d0cfc0',ink:'#4c5149',blush:'#b7a7a1'})
});
const VALID={variant:['male','female','extra'],facing:['front','left','right','back'],expression:['neutral','happy','shy','sad','surprised','hopeful','worried','regretful'],action:['idle','walk','jump','hug','hold','search','wait','lookback','hurry','reach','post']};
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(key){let a=hash(key);return()=>{a|=0;a=a+0x6d2b79f5|0;let z=Math.imul(a^a>>>15,1|a);z^=z+Math.imul(z^z>>>7,61|z);return((z^z>>>14)>>>0)/4294967296}}
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ellipse=(x,y,rx,ry,n=26)=>Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*rx,y+Math.sin(i/n*Math.PI*2)*ry]);
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function path(g,p){g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()}
function options(o={}){const n={variant:'male',id:undefined,x:0,y:0,size:200,facing:'front',expression:'neutral',action:'idle',t:0,u:undefined,halloween:true,shadow:true,...o};
 for(const [k,values]of Object.entries(VALID))if(!values.includes(n[k]))throw new RangeError(`Unknown ${k}: ${n[k]}`);
 if(!Number.isFinite(n.size)||n.size<=0)throw new RangeError('size must be positive');
 for(const k of ['x','y','t'])if(!Number.isFinite(n[k]))throw new RangeError(`${k} must be finite`);
 if(n.u!==undefined&&!Number.isFinite(n.u))throw new RangeError('u must be finite');
 n.id=n.id||n.variant;return n}
function segment(a,b,r0,r1=r0){const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d,ny=(b[0]-a[0])/d;return[[a[0]+nx*r0,a[1]+ny*r0],[b[0]+nx*r1,b[1]+ny*r1],[b[0]-nx*r1,b[1]-ny*r1],[a[0]-nx*r0,a[1]-ny*r0]]}
function pose(o){
 const frame=Math.floor(o.t*10+1e-6),time=frame/10;
 const cycle=o.u===undefined?time:Math.floor(o.u*10+1e-6)/10;
 let lift=0,bob=Math.sin(time*2.1)*.7,legs=[0,0,0,0],swing=0,bend=0;
 if(o.action==='walk'||o.action==='hurry'){const ph=cycle*Math.PI*2*(o.action==='hurry'?1.65:1);legs=[Math.sin(ph),Math.sin(ph+Math.PI),Math.sin(ph),Math.sin(ph+Math.PI)];bob=-Math.abs(Math.sin(ph*2))*1.5;swing=Math.sin(ph)*5}
 if(o.action==='jump'){const u=clamp(o.u===undefined?(time%1):o.u);if(u<.16){bend=Math.sin(u/.16*Math.PI/2)*5;bob=bend}else if(u<.84){lift=-Math.sin((u-.16)/.68*Math.PI)*34;bob=0}else{bend=Math.sin((u-.84)/.16*Math.PI)*4;bob=bend}}
 if(o.expression==='sad'||o.expression==='regretful')bob+=2;
 const y=bob+lift,side=o.facing==='left'||o.facing==='right';
 let hands={left:[-65,-40+y],right:[65,-40+y]};
 if(o.action==='walk'||o.action==='hurry'){hands.left[1]+=swing;hands.right[1]-=swing}
 if(o.action==='jump'){hands.left=[-68,-63+y];hands.right=[68,-63+y]}
 if(o.action==='hug'){hands.left=[-28,-27+y];hands.right=[28,-27+y];if(o.hugSide==='right'){hands.left=[45,-27+y];hands.right=[83,-40+y]}if(o.hugSide==='left'){hands.left=[-83,-40+y];hands.right=[-45,-27+y]}}
 if(o.action==='hold'){hands.left=[-61,-29+y];hands.right=[62,-36+y]}
 if(o.action==='search'){hands.right=[66,-70+y];hands.left=[-63,-34+y]}
 if(o.action==='wait'){hands.left=[-46,-29+y];hands.right=[46,-29+y]}
 if(o.action==='lookback'){hands.left=[-67,-44+y];hands.right=[62,-34+y]}
 if(o.action==='reach'){hands.right=[82+clamp(cycle)*12,-40+y];hands.left=[-61,-34+y]}
 if(o.action==='post'){hands.right=[78+clamp(cycle)*13,-29+y];hands.left=[-61,-35+y]}
 // Optional animation controls preserve the approved shape, and share hand/prop kinematics.
 if(o.handPose){for(const s of ['left','right'])if(o.handPose[s])hands[s]=[o.handPose[s][0],o.handPose[s][1]+y]}
 const held=propSpec(o);if(held)hands[held.hand][1]=Math.max(hands[held.hand][1],-29+y);
 // Side views are independently projected geometry, not a squashed front face.
 function project(p){if(!side)return p.slice();return[p[0]*.62+(p[0]>0?3:-3),p[1]]}
 hands={left:project(hands.left),right:project(hands.right)};
 const j=rng(o.id+':'+frame),scale=o.size/100;
 const jitter=o.paperJitter===false?[0,0]:[(j()-.5)*3.2,(j()-.5)*3.2];
 return{frame,time,cycle,lift,bob,y,legs,swing,bend,side,project,hands,scale,jitter,mirror:o.facing==='left'?-1:1}
}
function rough(pts,key,amp=.23){const r=rng(key),out=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));for(let j=0;j<n;j++){const u=j/n;out.push([a[0]+(b[0]-a[0])*u+(r()-.5)*amp*2,a[1]+(b[1]-a[1])*u+(r()-.5)*amp*2])}}return out}
// Each piece is textured independently and receives a real paper edge + cast shadow.
function paintPaper(g,key,pts,color,{edge=.65,shadow=.8,texture=1}={}){
 const p=rough(pts,key),r=rng(key+':paper');const xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 g.save();path(g,p);g.fillStyle='#fff9e9';g.strokeStyle='#fff9e9';g.lineWidth=edge*2;g.lineJoin='round';g.shadowColor='rgba(72,53,31,.22)';g.shadowBlur=shadow*5;g.shadowOffsetX=shadow*1.3;g.shadowOffsetY=shadow*2.3;g.fill();if(edge)g.stroke();g.shadowColor='transparent';
 g.save();path(g,p);g.clip();g.fillStyle=color;g.fillRect(x-1,y-1,w+2,h+2);
 const n=Math.max(8,Math.min(5000,Math.ceil(w*h*texture*.9)));
 for(let i=0;i<n;i++){g.fillStyle=i%3?'rgba(86,57,32,.065)':'rgba(255,251,226,.24)';g.fillRect(x+r()*w,y+r()*h,.10+r()*.25,.08+r()*.20)}
 g.lineWidth=.09;g.strokeStyle='rgba(110,78,42,.10)';for(let i=0;i<Math.min(120,w*h*.012);i++){const xx=x+r()*w,yy=y+r()*h;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+.5+r()*1.5,yy+r()*.3);g.stroke()}
 g.restore();g.restore()
}
// Cache a paper cutout's ink and fibres, not the character pose. Articulated
// joints, camera and held props still update from the current frame's geometry.
const cutouts=new Map();
function paper(g,key,pts,color,style={}){
 if(typeof document==='undefined')return paintPaper(g,key,pts,color,style);
 const x=Math.min(...pts.map(p=>p[0])),y=Math.min(...pts.map(p=>p[1])),w=Math.max(...pts.map(p=>p[0]))-x,h=Math.max(...pts.map(p=>p[1]))-y;
 const normalized=pts.map(p=>[p[0]-x,p[1]-y]);
 const cacheKey=key+color+JSON.stringify(style)+normalized.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(';');
 let tile=cutouts.get(cacheKey);const pad=8,R=4;
 if(!tile){tile=document.createElement('canvas');tile.width=Math.max(1,Math.ceil((w+pad*2)*R));tile.height=Math.max(1,Math.ceil((h+pad*2)*R));const q=tile.getContext('2d');q.scale(R,R);q.translate(pad,pad);paintPaper(q,key,normalized,color,style);cutouts.set(cacheKey,tile);if(cutouts.size>600)cutouts.delete(cutouts.keys().next().value)}else{cutouts.delete(cacheKey);cutouts.set(cacheKey,tile)}
 g.drawImage(tile,x-pad,y-pad,tile.width/R,tile.height/R);
}
function ink(g,pts,color,width=.7){g.save();g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.restore()}
function pumpkin(g,x,y,s=1,key='pumpkin'){g.save();g.translate(x,y);g.scale(s,s);paper(g,key+'stem',rect(-1,-7,2,3),'#64846b',{edge:.3,shadow:.2});paper(g,key+'body',ellipse(0,0,6.2,5.5),'#dc8a45',{edge:.45,shadow:.4});ink(g,[[-2,-3],[-3,0],[-2,3]],'#b56838',.5);ink(g,[[2,-3],[3,0],[2,3]],'#b56838',.5);paper(g,key+'eye1',[[-3,-1],[-1.5,-1.8],[-1.8,.3]],'#6d563b',{edge:0,shadow:0});paper(g,key+'eye2',[[3,-1],[1.5,-1.8],[1.8,.3]],'#6d563b',{edge:0,shadow:0});ink(g,[[-2,2],[0,3],[2,2]],'#6d563b',.5);g.restore()}
function bow(g,key,x,y,back=false){const c=PALETTES.female;g.save();g.translate(x,y);g.rotate(-.13);paper(g,key+'tail1',[[-2,1],[-7,12],[-2,10],[0,13],[2,2]],c.bowDark,{edge:.5,shadow:.6});paper(g,key+'tail2',[[2,1],[5,11],[7,9],[10,11],[7,1]],c.bow,{edge:.5,shadow:.6});paper(g,key+'left',[[-2,-2],[-14,-10],[-18,-8],[-17,4],[-13,7],[-1,2]],c.bow,{edge:.7,shadow:1});paper(g,key+'right',[[2,-2],[15,-10],[19,-7],[18,5],[14,7],[1,2]],c.bow,{edge:.7,shadow:1});ink(g,[[-13,-6],[-3,0],[-13,3]],c.bowDark,.6);ink(g,[[14,-6],[3,0],[14,3]],c.bowDark,.6);paper(g,key+'knot',rect(-3,-4,7,8),back?c.bowDark:'#e7acb4',{edge:.5,shadow:.8});g.restore()}
function witchHat(g,key,x,y,side=false){g.save();g.translate(x,y);g.rotate(-.18);paper(g,key+'cone',[[-11,0],[-5,-23],[2,-33],[1,-24],[5,-19],[10,0]],'#685e4a',{edge:.65,shadow:.8});paper(g,key+'band',[[-9,-5],[8,-5],[10,0],[-11,0]],'#bd8658',{edge:.2,shadow:.2});paper(g,key+'brim',[[-17,-1],[14,-2],[18,3],[-18,4]],'#685e4a',{edge:.6,shadow:.6});paper(g,key+'buckle',rect(-2,-5,4,4),'#dac178',{edge:.2,shadow:.2});g.restore()}
function ghost(g,key,x,y){g.save();g.translate(x,y);paper(g,key,[[-5,4],[-5,-1],[-3,-5],[0,-6],[4,-4],[5,4],[2,3],[0,5],[-2,3]],'#f2edde',{edge:.35,shadow:.35});paper(g,key+'e1',rect(-2,-1,1.2,1.7),'#687064',{edge:0,shadow:0});paper(g,key+'e2',rect(1,-1,1.2,1.7),'#687064',{edge:0,shadow:0});g.restore()}
function propSpec(o){if(o.releaseProp===true)return null;if(!o.hold&&o.action!=='hold'&&o.action!=='post')return null;const v=typeof o.hold==='string'?{type:o.hold}:o.hold||{type:'letter',hand:o.action==='post'?'right':'left'};const side=v.hand||'left';if(!['left','right'].includes(side))throw new RangeError('hold.hand must be left or right');if(!['letter','pumpkin','flower'].includes(v.type||'letter')&&typeof v.draw!=='function')throw new RangeError('Unknown prop type');return{type:'letter',...v,hand:side}}
function drawProp(g,key,spec,hand){g.save();g.translate(...hand);if(spec.insertProgress!==undefined){g.beginPath();g.rect(-26,-2,52,Math.max(0,34*(1-clamp(spec.insertProgress))));g.clip()}if(typeof spec.draw==='function'){g.save();g.beginPath();g.rect(-26,-2,52,34);g.clip();spec.draw(g,{x:0,y:0,angle:0,safeBounds:{x:-26,y:-2,width:52,height:34}});g.restore()}else if(spec.type==='letter'){
 paper(g,key+'envelope',[[-19,0],[18,0],[19,22],[-20,22]],'#f3e7c9',{edge:.6,shadow:.8});ink(g,[[-19,1],[0,13],[18,1]],'#c5ad83',.7);ink(g,[[-19,22],[-5,12]],'#d2bd98',.45);ink(g,[[19,22],[5,12]],'#d2bd98',.45);paper(g,key+'stamp',rect(10,4,4,5),'#d4a180',{edge:.2,shadow:.1})
 }else if(spec.type==='pumpkin'){ink(g,[[-7,14],[-6,2],[0,-1],[6,2],[7,14]],'#7d765c',1.1);pumpkin(g,0,19,1.65,key+'bucket')}
 else if(spec.type==='flower'){ink(g,[[0,24],[0,0]],'#6c8b70',1.4);paper(g,key+'leaf',[[0,13],[-9,6],[-7,14],[0,17]],'#92a67e',{edge:.3,shadow:.3});for(let i=0;i<5;i++)paper(g,key+'petal'+i,ellipse(Math.cos(i*1.256)*4.5,Math.sin(i*1.256)*4.5+3,4,4),'#e4cba1',{edge:.25,shadow:.25});paper(g,key+'seed',ellipse(0,3,2.5,2.5),'#b58c4e',{edge:.2,shadow:.2})}
 g.restore();return{x:hand[0]-26,y:hand[1]-2,width:52,height:34}
}
function face(g,key,o,pal,q){const y=q.y;const blink=(q.time%4.2)>4.04;const side=q.side;
 if(o.facing==='back')return;
 const gaze=o.action==='lookback'?-5:o.action==='search'?Math.sin(q.cycle*3)*4:0;
 const eyeCenters=side?[[20+gaze,-58+y]]:[[-23+gaze,-58+y],[23+gaze,-58+y]];
 if(o.expression==='shy')for(const [x,yy]of(side?[[8,-43+y]]:[[-36,-44+y],[36,-44+y]]))paper(g,key+'blush'+x,ellipse(x,yy,7,3),pal.blush,{edge:0,shadow:0});
 eyeCenters.forEach(([x,yy],i)=>{if(blink||o.expression==='happy'){paper(g,key+'eye'+i,[[x-6,yy+1],[x-1,yy-5],[x+2,yy-5],[x+7,yy+1],[x+5,yy+3],[x,yy-1],[x-4,yy+3]],pal.ink,{edge:0,shadow:0})}
 else if(o.expression==='regretful'){ink(g,[[x-5,yy],[x-1,yy+2],[x+5,yy]],pal.ink,1.8);ink(g,[[x-6,yy-7],[x+5,yy-9]],pal.ink,1)}
 else if(o.expression==='hopeful'){paper(g,key+'eye'+i,rect(x-5,yy-7,10,15),pal.ink,{edge:0,shadow:0});paper(g,key+'glint'+i,rect(x-3,yy-5,2.5,3),'#fff5d5',{edge:0,shadow:0});ink(g,[[x-5,yy-12],[x+5,yy-12]],pal.ink,.8)}
 else if(o.expression==='worried'){paper(g,key+'eye'+i,rect(x-4,yy-4,8,13),pal.ink,{edge:0,shadow:0});ink(g,[[x-7,yy-9+(i?-2:1)],[x+6,yy-9+(i?2:-3)]],pal.ink,1.35)}
 else if(o.expression==='sad'){paper(g,key+'eye'+i,rect(x-4,yy-1,8,10),pal.ink,{edge:0,shadow:0});ink(g,[[x-7,yy-8+(i?-2:2)],[x+6,yy-8+(i?2:-2)]],pal.ink,1.4)}
 else if(o.expression==='shy'){paper(g,key+'eye'+i,[[x-5,yy-2],[x+4,yy],[x+3,yy+9],[x-5,yy+7]],pal.ink,{edge:0,shadow:0})}
 else paper(g,key+'eye'+i,rect(x-5,yy-5,10,13),pal.ink,{edge:0,shadow:0})});
 const mx=side?27:0,my=-39+y;
 if(o.expression==='happy')ink(g,[[mx-6,my-2],[mx-2,my+2],[mx+2,my+2],[mx+6,my-2]],pal.ink,1.1);
 else if(o.expression==='sad')ink(g,[[mx-5,my+2],[mx,my-1],[mx+5,my+2]],pal.ink,1.05);
 else if(o.expression==='hopeful')ink(g,[[mx-4,my],[mx,my+2],[mx+4,my]],pal.ink,1);
 else if(o.expression==='regretful')ink(g,[[mx-4,my+2],[mx,my],[mx+4,my+2]],pal.ink,.9);
 else if(o.expression==='worried')paper(g,key+'mouth',ellipse(mx,my,2,2.4),pal.ink,{edge:0,shadow:0});
 else if(o.expression==='surprised')paper(g,key+'mouth',ellipse(mx,my,3,4),pal.ink,{edge:0,shadow:0});
 else ink(g,[[mx-3,my],[mx+3,my]],pal.ink,.85)
}
function draw(g,input={}){
 const o=options(input),q=pose(o),pal=PALETTES[o.variant],key=o.id,side=q.side,project=q.project,back=o.facing==='back',prop=propSpec(o);
 g.save();g.translate(o.x+q.jitter[0],o.y+q.jitter[1]);g.scale(q.scale*q.mirror,q.scale);
 if(o.shadow){g.save();g.globalAlpha=.13*Math.max(.3,1+q.lift/60);g.fillStyle='#776548';path(g,ellipse(0,1,side?47:76,5.5));g.fill();g.restore()}
 // Four unmistakable short, blocky Clawd legs; each is a hinged paper piece.
 [-39,-14,14,39].forEach((x,i)=>{const step=q.legs[i],dx=step*6,up=-Math.max(0,step)*5;const xx=side?x*.64:x;const hip=[xx,-26+q.y],knee=[xx+dx*.45,-10+q.lift+q.bend*.2],foot=[xx+dx,up+q.lift];const pp=[[hip[0]-5.7,hip[1]],[hip[0]+5.7,hip[1]],[knee[0]+5.7,knee[1]],[foot[0]+5.7,foot[1]],[foot[0]-5.7,foot[1]],[knee[0]-5.7,knee[1]]];paper(g,key+'leg'+i,pp,i%2?pal.dark:pal.shell,{edge:.6,shadow:.6})});
 const shell=projectShell(q);
 // Shoulder tabs and forearms share the exact kinematic endpoints exported by handAt().
 const shoulders={left:project([-48,-56+q.y]),right:project([48,-56+q.y])};
 const elbows={left:project([o.action==='hug'?-66:-67,-48+q.y]),right:project([o.action==='hug'?66:67,-48+q.y])};
 for(const s of ['left','right']){
  paper(g,key+s+'upper',segment(shoulders[s],elbows[s],8,7),pal.dark,{edge:.65,shadow:.8});
  paper(g,key+s+'lower',segment(elbows[s],q.hands[s],7,6),pal.shell,{edge:.65,shadow:.8})
 }
 paper(g,key+'shell',shell,pal.shell,{edge:.95,shadow:1.25});
 const shine=projectPoly(q,[[-47,-78+q.y],[44,-78+q.y],[44,-74+q.y],[-47,-74+q.y]]);paper(g,key+'rim',shine,pal.light,{edge:.1,shadow:0});
 if(back){const rear=projectPoly(q,[[-36,-62+q.y],[-24,-70+q.y],[24,-70+q.y],[36,-62+q.y],[34,-38+q.y],[-34,-38+q.y]]);paper(g,key+'rear-plate',rear,pal.light,{edge:.45,shadow:.4});ink(g,projectPoly(q,[[-24,-36+q.y],[0,-29+q.y],[24,-36+q.y]]),pal.dark,.8)}
 else{paper(g,key+'belly',projectPoly(q,[[-28,-27+q.y],[28,-27+q.y],[25,-23+q.y],[-25,-23+q.y]]),pal.belly,{edge:.15,shadow:.15});face(g,key,o,pal,q)}
 // Accessories sit away from eyes and can be removed with halloween:false.
 if(o.variant==='female'){
  if(o.halloween)witchHat(g,key+'hat',side?-16:-27,-84+q.y,side);
  bow(g,key+'bow',side?20:32,-85+q.y,back)
 }else if(o.halloween&&!back){if(o.variant==='male')pumpkin(g,side?10:-31,-31+q.y,.68,key+'badge');else ghost(g,key+'badge',side?10:-31,-32+q.y)}
 // Props are attached to the same hand origin, drawn before the grasping claw.
 let propBounds=null;if(prop)propBounds=drawProp(g,key+'prop',prop,q.hands[prop.hand]);
 for(const s of ['left','right']){
  const [x,y]=q.hands[s],sign=s==='left'?-1:1;
  const claw=[[x-7,y-6],[x-3,y-10],[x+3,y-10],[x+7,y-6],[x+6,y+3],[x+2,y+6],[x-3,y+5],[x-7,y+1]];
  paper(g,key+s+'claw',claw,pal.light,{edge:.65,shadow:.75});
  ink(g,[[x+sign*5,y-7],[x+sign*1,y-2],[x+sign*4,y+1]],pal.dark,.8)
 }
 g.restore();return{designVersion:DESIGN_VERSION,hands:{left:worldHand(o,q,'left'),right:worldHand(o,q,'right')},propBounds:propBounds?worldBounds(o,q,propBounds):null,faceBounds:back?null:worldBounds(o,q,{x:side?8:-43,y:-74+q.y,width:side?32:86,height:42}),frame:q.frame}
}
function projectPoly(q,p){return p.map(q.project)}
function projectShell(q){return projectPoly(q,[[-50,-83+q.y],[46,-83+q.y],[46,-76+q.y],[56,-76+q.y],[56,-31+q.y],[47,-31+q.y],[47,-22+q.y],[-47,-22+q.y],[-47,-31+q.y],[-56,-31+q.y],[-56,-76+q.y],[-50,-76+q.y]])}
function worldHand(o,q,s){const p=q.hands[s];return{x:o.x+q.jitter[0]+p[0]*q.scale*q.mirror,y:o.y+q.jitter[1]+p[1]*q.scale,angle:0,scale:q.scale,facing:o.facing,side:s}}
function worldBounds(o,q,b){const xs=[b.x,b.x+b.width].map(x=>o.x+q.jitter[0]+x*q.scale*q.mirror);return{x:Math.min(...xs),y:o.y+q.jitter[1]+b.y*q.scale,width:b.width*q.scale,height:b.height*q.scale}}
function handAt(input,side='left'){if(!['left','right'].includes(side))throw new RangeError('hand must be left or right');const o=options(input),q=pose(o);return worldHand(o,q,side)}
function poseHands(input={}){const o=options({...input,facing:'front'}),q=pose(o);return Object.fromEntries(Object.entries(q.hands).map(([s,p])=>[s,[p[0],p[1]-q.y]]))}
return Object.freeze({draw,handAt,poseHands,palettes:PALETTES,designVersion:DESIGN_VERSION,capabilities:VALID,nominalHeight:100});
});
