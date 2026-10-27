'use strict';
window.ActorTracks=(()=>{
 const E=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},mix=(a,b,u)=>a+(b-a)*u;
 const M=(x,y=145,size=45,facing='right',action='wait',expression='hopeful',extra={})=>({x,y,size,facing,action,expression,...extra});
 const F=(x,y=118,size=34,facing='back',action='idle',expression='neutral',extra={})=>M(x,y,size,facing,action,expression,extra);
 const plans={
 L01:{female:[F(136,133,43,'left','walk','neutral',{hold:{type:'letter',hand:'right'}}),F(108,121,45,'left','walk','neutral',{hold:{type:'letter',hand:'right'}})],male:[M(272,110,34),M(272,110,34)]},
 L02:{female:[F(108,121,45,'left','post','neutral',{hold:{type:'letter',hand:'right'}}),F(108,121,45,'left','post','neutral',{hold:{type:'letter',hand:'right'}})]},
 L03:{female:[F(161,145,43),F(161,145,43)]},L04:{female:[F(161,145,43),F(161,145,43)]},
 L05:{male:[M(90,145,44,'right','search'),M(121,145,44,'right','search')],female:[F(194,111,30),F(194,111,30)]},
 L06:{male:[M(121,145,44,'right','walk'),M(189,145,44,'right','walk')],female:[F(194,118,34,'left','walk'),F(121,118,34,'left','walk')]},
 L07:{male:[M(135,143,45,'left','walk'),M(88,143,45,'left','walk')],female:[F(207,136,40,'right','walk'),F(266,136,40,'right','walk')]},
 L08:{male:[M(127,147,46,'right','wait','sad'),M(127,147,46,'right','wait','sad')]},
 L09:{male:[M(110,145,45,'right','walk'),M(145,145,45,'right','walk')],female:[F(235,109,29,'right','walk'),F(263,109,29,'right','walk')]},
 L10:{male:[M(145,145,45,'left','wait'),M(145,145,45,'left','wait')],female:[F(263,109,29,'right','walk'),F(359,109,29,'right','walk')]},
 L11:{male:[M(145,145,45),M(145,145,45)]},
 L12:{male:[M(145,145,45,'right','wait','sad'),M(145,145,45,'right','wait','sad')],extra:[M(48,148,38,'left','walk','neutral'),M(-45,148,38,'left','walk','neutral')]},
 L13:{male:[M(134,146,45,'right','reach'),M(134,146,45,'right','reach')],female:[F(197,118,35),F(197,118,35)]},
 L14:{male:[M(136,131,36,'back','idle','happy'),M(136,131,36,'back','idle','happy')],female:[F(185,131,35,'back','idle','happy'),F(185,131,35,'back','idle','happy')]},
 L15:{male:[M(134,145,45,'right','walk'),M(358,145,45,'right','walk')],female:[F(194,118,34),F(194,118,34)]},
 L16:{female:[F(194,118,34,'left','lookback'),F(194,118,34,'left','lookback')]},
 I1:{female:[F(236,91,31,'right'),F(236,91,31,'right')]},
 L17:{male:[M(-40,149,46,'right','hurry','worried'),M(139,149,46,'right','hurry','worried')],female:[F(236,91,31,'right'),F(236,91,31,'right')]},
 L18:{male:[M(139,149,46,'right','search','worried'),M(151,149,46,'right','search','worried')],female:[F(236,91,31,'right'),F(236,91,31,'right')]},
 L19:{male:[M(310,148,45,'left','hurry','worried'),M(234,148,45,'left','hurry','worried')]},
 L20:{male:[M(234,148,45,'left','wait','sad'),M(234,148,45,'left','wait','sad')],female:[F(86,119,35),F(86,20,35)]},
 L21:{male:[M(95,145,44,'right','walk','worried'),M(149,145,44,'right','walk','worried')],extra:[M(260,145,41,'left','hold','neutral',{hold:{type:'pumpkin',hand:'left'}}),M(185,145,41,'left','hold','neutral',{hold:{type:'pumpkin',hand:'left'}})]},
 L22:{male:[M(104,145,44,'right','walk','worried'),M(151,145,44,'right','walk','worried')],extra:[M(250,145,41,'left','hold','neutral',{hold:{type:'pumpkin',hand:'left'}}),M(-60,145,41,'left','hold','neutral',{hold:{type:'pumpkin',hand:'left'}})]},
 L23:{male:[M(60,85,33,'right','walk','worried'),M(184,95,33,'right','walk','worried')]},
 L24:{male:[M(131,146,44,'right','wait','worried'),M(131,146,44,'right','wait','worried')],female:[F(236,107,28,'right'),F(236,107,28,'right')]},
 L25:{male:[M(116,145,45,'right','reach'),M(116,145,45,'right','reach')],female:[F(235,119,33,'right','walk'),F(248,119,33,'right','walk')]},
 L26:{male:[M(116,145,45,'right','reach'),M(116,145,45,'right','reach')],female:[F(248,119,33,'right','walk'),F(365,119,33,'right','walk')]},
 L27:{male:[M(139,145,46,'right','wait','worried'),M(139,145,46,'right','wait','worried')]},
 L28:{male:[M(139,145,46,'right','idle','sad'),M(139,145,46,'right','idle','sad')]},
 L29:{male:[M(139,145,46,'right','reach','sad'),M(139,145,46,'right','reach','sad')]},
 L30:{male:[M(132,130,38,'right','walk','happy'),M(155,130,38,'right','walk','happy')],female:[F(185,130,37,'right','walk','happy'),F(208,130,37,'right','walk','happy')]},
 L31:{male:[M(122,145,44,'right','wait','sad'),M(122,145,44,'right','wait','sad')],female:[F(227,120,33,'right','walk'),F(358,120,33,'right','walk')]},
 L32:{male:[M(122,145,44,'right','search'),M(122,145,44,'right','search')]},
 L33:{male:[M(90,139,37,'right','walk'),M(136,133,37,'right','walk')],female:[F(230,139,35,'left','walk','hopeful'),F(183,133,35,'left','walk','hopeful')]},
 L34:{male:[M(136,133,37,'right','walk','happy'),M(188,133,37,'right','walk','happy')],female:[F(183,133,35,'left','walk','happy'),F(135,124,35,'left','walk','happy')]},
 L35:{male:[M(188,133,37,'front','idle','happy'),M(188,133,37,'front','idle','happy')],female:[F(135,124,35,'front','idle','happy'),F(135,124,35,'front','idle','happy')]},
 L36:{male:[M(188,133,37,'front','idle','happy'),M(188,133,37,'front','idle','happy')],female:[F(135,124,35,'front','idle','happy'),F(135,124,35,'front','idle','happy')]},
 L37:{male:[M(134,145,48,'right','reach','sad'),M(134,145,48,'right','reach','sad')]},
 L38:{male:[M(135,131,39,'right','reach','regretful'),M(135,131,39,'right','idle','regretful')],female:[F(216,110,30,'back','walk'),F(255,110,30,'back','walk')]},
 L39:{male:[M(141,146,56,'right','wait','regretful'),M(141,146,56,'right','wait','regretful')]},
 L40:{male:[M(141,146,56,'right','wait','sad'),M(141,146,48,'right','wait','sad')]},
 L41:{male:[M(103,146,53,'right','search'),M(103,146,53,'right','search')],female:[F(247,137,35,'right','walk'),F(268,137,35,'right','walk')]},
 L42:{male:[M(103,146,53,'right','search'),M(103,146,53,'right','search')],female:[F(268,137,35,'right','walk'),F(340,137,35,'right','walk')]},
 L43:{male:[M(103,146,53,'right','search','sad'),M(103,146,53,'right','search','sad')]},
 E1:{male:[M(103,146,53,'right','search','sad'),M(103,146,53,'right','wait','sad')]},
 E2:{male:[M(102,143,43,'left','walk','sad'),M(76,148,42,'left','walk','sad')],female:[F(229,139,40,'right','walk'),F(255,143,38,'right','walk')]},
 E3:{male:[M(76,148,42,'left','walk','sad'),M(-40,156,40,'left','walk','sad')],female:[F(255,143,38,'right','walk'),F(360,151,37,'right','walk')]}
 };
 const timeline=MV_DATA.timeline.filter(s=>s.id!=='E4');
 const nodes=[];let previous={};
 for(const shot of timeline){
  const spec=plans[shot.id];if(!spec)throw Error('Missing actor track '+shot.id);
  const start={},end={};
  for(const [id,pair]of Object.entries(spec)){start[id]=previous[id]?{...previous[id]}:{...pair[0],x:id==='female'?367:-47};end[id]={...pair[1]};if(id==='male'&&['L28','L38','E1'].includes(shot.id))end[id].handPose={left:[-46,-29],right:[46,-29]};if(id==='male'&&shot.id==='L29')end[id].handPose={left:[-61,-34],right:[94,-40]};if(id==='female'&&shot.id==='L02'){end[id].releaseProp=true;end[id].hold=null;end[id].handPose={left:[-61,-35],right:[91,-29]}}}
  for(const [id,state]of Object.entries(previous))if(!spec[id]&&state.x>-45&&state.x<365){start[id]={...state};end[id]={...state,x:state.facing==='left'?-65:385,action:'walk'}}
  // The opening is already established; no artificial entrance from black.
  if(!nodes.length)for(const id of Object.keys(spec))start[id]={...spec[id][0]};
  nodes.push({...shot,spec,start,end});previous=end;
 }
 function sample(index,t){const node=nodes[index],duration=(node.end_frame-node.start_frame)/30,local=Math.max(0,t-node.start_frame/30),u=Math.min(1,local/duration),states={};
  for(const [id,a]of Object.entries(node.start)){const b=node.end[id],pair=node.spec[id],target=pair?pair[0]:b;
   // Continuous settling to a new scene anchor, then the shot's principal route.
   const settle=Math.min(.65,duration*.28),v=E(local/settle),w=E((local-settle)/Math.max(.1,duration-settle));
   const mid=target;const s={...a};
   for(const key of ['x','y','size'])s[key]=local<settle?mix(a[key],mid[key],v):mix(mid[key],b[key],w);
   if(local>settle*.65){for(const key of ['facing','action','expression','hold'])s[key]=mid[key]}
   if(!pair){s.action='walk';s.x=mix(a.x,b.x,E(local/Math.min(1,duration*.6)))}
   if(node.id==='L23'&&id==='male'){const path=[[a.x,a.y],[290,85],[290,154],[96,154],[96,95],[184,95]],v=Math.max(0,Math.min(.999,u))*5,j=Math.floor(v),f=E(v-j);s.x=mix(path[j][0],path[j+1][0],f);s.y=mix(path[j][1],path[j+1][1],f);s.size=mix(a.size,33,E(local/.5));s.facing=local<.05?a.facing:path[j+1][0]<path[j][0]?'left':'right';s.action=local<.05?a.action:'walk'}
   s.t=t;s.u=undefined;s.paperJitter=false;s.id=id;
   const ah=Character.poseHands({...a,t}),bh=Character.poseHands({...mid,t,handPose:undefined});s.handPose={};for(const hand of ['left','right'])s.handPose[hand]=ah[hand].map((v,k)=>mix(v,bh[hand][k],E(local/settle)));
   if(node.id==='L02'&&id==='female'){s.action='post';s.u=E(u);s.releaseProp=u>.8;s.hold={type:'letter',hand:'right',insertProgress:E((u-.45)/.35)};s.handPose={right:[mix(ah.right[0],91,E(u)),mix(ah.right[1],-29,E(u))],left:ah.left.map((v,k)=>mix(v,[-61,-35][k],E(u)))}}
   if(['L28','L38','E1'].includes(node.id)&&id==='male'){const h=E(u);s.handPose={right:ah.right.map((v,k)=>mix(v,[46,-29][k],h)),left:ah.left.map((v,k)=>mix(v,[-46,-29][k],h))}}
   if(node.id==='L29'&&id==='male'){const h=E(u);s.handPose={right:ah.right.map((v,k)=>mix(v,[94,-40][k],h)),left:ah.left.map((v,k)=>mix(v,[-61,-34][k],h))}}
   states[id]=s;
  }return states;
 }
 return{nodes,sample};
})();
