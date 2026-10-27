'use strict';
// User-requested v3 revisions; native paper scenes, not a darkening filter.
(()=>{
const {C,piece,box,line,rect,oval,crab,painting,mailbox,windowPane}=Paper;
const old=SketchScenes.draw;
const N={sky:'#344d56',far:'#4d686c',wall:'#657b79',side:'#475e61',ground:'#788984',road:'#536b70',lamp:'#e4c18b',ink:'#d4d6bd'};
function reset(g){g.setTransform(1,0,0,1,0,0);g.fillStyle=N.sky;g.fillRect(0,0,1920,1080);g.scale(6,6)}
function moon(g){piece(g,'moon',oval(219,27,10,10),'#eadcaa',{edge:.45,shadow:0});[[112,21],[153,35],[184,14],[273,39]].forEach(([x,y],i)=>{line(g,[[x-1,y],[x+1,y]],'#c6cfbd',.35);line(g,[[x,y-1],[x,y+1]],'#c6cfbd',.35)});}
function nightSky(g){box(g,'night-sky',0,0,320,119,N.sky,{edge:0,shadow:0});moon(g);for(let i=0;i<7;i++){let x=35+i*37,y=50+(i%3)*9;box(g,'nfar'+i,x,y,30,66-i%3*8,i%2?'#4b6568':'#58716e',{edge:.25,shadow:.25});for(let xx=x+5;xx<x+26;xx+=8)for(let yy=y+6;yy<111;yy+=12)box(g,'nwin'+i+xx+yy,xx,yy,3,5,(Math.floor(xx+yy)%3)?'#ceb385':'#74887d',{edge:.1,shadow:0})}}
function nightGround(g){piece(g,'night-ground',[[0,111],[320,110],[320,180],[0,180]],N.ground,{edge:0,shadow:0});for(let y=137;y<181;y+=21)line(g,[[0,y],[320,y-15]],'#9baba0',.22)}
function lamp(g,x=215){piece(g,'lamp-pole',rect(x,44,1.7,95),'#bdc1a6',{edge:.2,shadow:.25});piece(g,'lamp-shade',[[x-6,43],[x+7,43],[x+5,53],[x-4,53]],N.lamp,{edge:.4});g.save();g.globalAlpha=.18;piece(g,'paper-light',[[x-3,53],[x+4,53],[x+30,141],[x-28,141]],'#eed49b',{edge:0,shadow:0});g.restore();}
function windows(g,k,x,y,w,h){box(g,k,x,y,w,h,'#a5ad98',{edge:.35});box(g,k+'inside',x+1,y+1,w-2,h-2,N.lamp,{edge:.15,shadow:0});line(g,[[x+w/2,y+1],[x+w/2,y+h]],'#839381',.6)}
function nightStreet(g,people=[],{tram=false,calendar=false}={}){
 nightSky(g);nightGround(g);piece(g,'nroad',[[205,108],[320,126],[320,180],[178,180]],N.road,{edge:.5});
 piece(g,'nlwall',[[0,8],[66,18],[79,36],[79,122],[0,136]],'#687d76',{edge:.8,shadow:1});piece(g,'nlside',[[66,18],[79,36],[79,122],[66,124]],N.side);for(let i=0;i<2;i++){windows(g,'nlw'+i,12,28+i*43,16,24);windows(g,'nlv'+i,43,32+i*43,16,24)}piece(g,'nawning',[[0,100],[62,100],[72,109],[0,113]],'#3c6260');for(let i=0;i<6;i++)piece(g,'nstripe'+i,[[i*10+4,100],[i*10+8,100],[i*10+13,110],[i*10+8,111]],'#bac8b1',{edge:.1,shadow:0});
 piece(g,'nrwall',[[260,0],[320,0],[320,145],[257,120]],N.wall,{edge:.8,shadow:1});for(let i=0;i<3;i++){windows(g,'nrw'+i,275,17+i*31,14,21);windows(g,'nrv'+i,301,19+i*31,13,22)}
 lamp(g,218);mailbox(g,76,145,.9);people.forEach(p=>crab(g,p.v,p.x,p.y,p.size,p.o||{}));
 if(tram){box(g,'ntram',155,54,158,78,'#8faaa0',{edge:.8,shadow:1.3});box(g,'ntram-stripe',155,111,158,10,'#3e6760');for(let x=166;x<303;x+=32)box(g,'ntwindow'+x,x,65,23,36,'#e5cb97',{edge:.3});[176,292].forEach((x,i)=>piece(g,'nwheel'+i,oval(x,134,8,5),'#344f51'));}
}
function nightStation(g,id){box(g,'station-night',0,0,320,125,'#425e64',{edge:0});piece(g,'stationfloor',[[0,125],[320,125],[320,180],[0,180]],'#71817c',{edge:0});box(g,'stationlight',30,9,105,2,'#e9d3a3',{edge:.25});box(g,'stationlight2',189,9,94,2,'#e9d3a3',{edge:.25});box(g,'trainbody',8,25,304,105,'#8b9e90',{edge:.8});box(g,'trainband',9,101,302,11,'#3e6661');for(let x=22;x<300;x+=68){box(g,'trainwindow'+x,x,41,52,51,'#35545a');box(g,'litcar'+x,x+2,43,48,47,'#dbc99e',{edge:.1})}if(id!=='L17')crab(g,'female',236,91,31,{facing:'right'});box(g,'closeddoor',112,31,59,97,'#aebaa3');line(g,[[141,31],[141,128]],'#557775',.7);box(g,'windowdoor1',119,43,17,42,'#cfc7a1');box(g,'windowdoor2',147,43,17,42,'#cfc7a1');line(g,[[0,137],[320,137]],'#d2b17b',1.4);if(id!=='I1')crab(g,'male',id==='L17'?139:151,149,46,{facing:'right',action:id==='L17'?'hurry':'search',expression:'worried',u:.2})}
function nightGallery(g,id){nightSky(g);nightGround(g);box(g,'nightgallery',20,7,280,121,'#5d7773',{edge:.8});box(g,'gallerydoor',84,21,149,103,'#b6c1a7');box(g,'warmgallery',89,26,139,93,'#d6c99f',{edge:.3});painting(g,'gallerylitart',176,37,38,46,1);box(g,'gallerymullion',155,20,4,106,'#557572');line(g,[[165,83],[165,99]],'#577d70',1.2);piece(g,'nightgalleryawning',[[17,6],[302,6],[308,20],[12,20]],'#3f6961');box(g,'awninglamp',46,25,35,2,N.lamp,{edge:.1});
 const configs={L27:[139,46,'wait','worried'],L28:[163,76,'idle','sad'],L29:[112,60,'reach','sad'],L32:[161,72,'idle','hopeful'],L37:[134,60,'reach','sad']};let [x,size,action,expression]=configs[id];crab(g,'male',x,145,size,{action,expression});}
function daySearch(g,u=.58){box(g,'search-sky',0,0,320,180,'#dce3d5',{edge:0});piece(g,'cityscroll',[[5,12],[315,10],[317,169],[4,171]],'#f4e4bf',{edge:.9,shadow:1.2});
 // Four recognisable city quarters, traversed by one continuous returning route.
 const blocks=[[14,21,'#c9aa8b'],[109,20,'#a9b8a1'],[208,20,'#c9b88b'],[28,106,'#bcbaa0'],[140,109,'#9fb7ae'],[241,107,'#ccb49b']];
 blocks.forEach(([x,y,col],i)=>{box(g,'search-house'+i,x,y,60,39,col,{edge:.5});box(g,'search-roof'+i,x+2,y+2,56,10,i%2?'#768d7c':'#b48e70',{edge:.3});for(let xx=x+7;xx<x+54;xx+=13)box(g,'search-window'+i+xx,xx,y+19,7,11,'#e8dfbc',{edge:.2})});
 mailbox(g,33,91,.52);painting(g,'search-art',121,29,21,24);box(g,'stationstairs',229,121,44,25,'#5f8079');for(let yy=126;yy<146;yy+=5)line(g,[[232,yy],[269,yy]],'#dfd9b9',.4);
 piece(g,'route-road',[[8,66],[303,66],[303,98],[8,98]],'#d4bd94',{edge:.2});piece(g,'return-road',[[82,91],[109,91],[109,158],[82,158]],'#d4bd94',{edge:.2});piece(g,'bottom-road',[[90,149],[309,149],[309,166],[90,166]],'#d4bd94',{edge:.2});piece(g,'right-road',[[280,86],[302,86],[302,157],[280,157]],'#d4bd94',{edge:.2});
 const path=[[48,84],[88,84],[165,84],[248,84],[291,85],[291,154],[98,154],[97,96],[188,94]];
 line(g,path,'#bf8b65',1.15);line(g,[[51,88],[100,88],[169,88],[250,88],[287,90]],'#f7edd2',.55);mailbox(g,33,92,.52);
 let x,y,face;if(u<.34){x=70+u*160;y=90;face='right'}else if(u<.68){x=286;y=106+(u-.34)*130;face='right'}else{x=260-(u-.68)*480;y=153;face='left'}
 crab(g,'male',x,y,33,{facing:face,action:'search',expression:'worried',u:.2});
 // No female instance, silhouette, reflection, pin or bow in this shot.
}
function cloudDays(g,x=163,y=39){const pts=[];for(let i=0;i<56;i++){let a=i/56*Math.PI*2,rx=52+(i%4<2?3:-1),ry=20+(i%4<2?1:-1);pts.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry])}piece(g,'days-cloud',pts,'#f7efdb',{edge:1,shadow:1.5,rough:.35});piece(g,'thought1',oval(x-28,y+32,4,3),'#f7efdb',{edge:.3});piece(g,'thought2',oval(x-34,y+41,2.3,2),'#f7efdb',{edge:.25});g.save();g.fillStyle='#697463';g.font='600 19px "Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('1000天',x,y+.5);g.restore()}
function longWait(g,id){nightStreet(g,[{v:'male',x:141,y:146,size:id==='L39'?72:48,o:{action:'wait',expression:id==='L39'?'regretful':'sad'}}]);cloudDays(g,id==='L39'?164:164,id==='L39'?37:40)}
function arcade(g,id){nightSky(g);nightGround(g);piece(g,'arcade-road',[[0,123],[320,118],[320,158],[0,166]],'#607775',{edge:.45});piece(g,'alleydepth',[[177,46],[291,46],[291,138],[177,138]],'#49676a',{edge:.45});for(let i=0;i<3;i++)windows(g,'faralley'+i,199+i*29,60,11,21);lamp(g,269);
 piece(g,'arcade-left',[[0,9],[51,14],[51,137],[0,150]],'#5b7471',{edge:.7});windows(g,'arcadewindow',12,37,24,36);piece(g,'overhang',[[37,18],[309,18],[315,34],[33,34]],'#7f9990',{edge:.7,shadow:1});line(g,[[50,26],[304,26]],'#c9bd93',.5);
 box(g,'archleg-left',164,32,9,109,'#81978b',{edge:.45});box(g,'archleg-right',294,32,9,109,'#81978b',{edge:.45});
 if(id==='L41')crab(g,'female',254,137,35,{facing:'back',action:'walk'});
 if(id==='L41'){piece(g,'curtain-rolled',[[174,33],[293,33],[291,41],[175,40]],'#d0c1a0',{edge:.5});}
 if(id==='L42'){piece(g,'wind-curtain',[[173,33],[294,33],[294,94],[282,124],[251,141],[214,129],[183,132],[177,99]],'#cfc3a7',{edge:1,shadow:1.7,rough:.45});for(let x=192;x<284;x+=22)line(g,[[x,40],[x+4,81],[x-3,125]],'#acaf96',.5);}
 if(id==='L43'||id==='E1'){piece(g,'curtain-gone',[[282,33],[300,33],[320,65],[314,103],[320,139],[305,133],[294,99]],'#cfc3a7',{edge:.8,shadow:1});}
 if(id==='L41'||id==='L42')crab(g,'male',103,146,53,{facing:'right',action:'search',expression:'hopeful'});
 else crab(g,'male',103,146,id==='E1'?62:53,{facing:'right',action:id==='E1'?'idle':'wait',expression:'sad'});
 if(id!=='E1'){line(g,[[131,62],[145,59],[156,61]],'#b3c2b5',.7);line(g,[[136,69],[150,66],[160,68]],'#b3c2b5',.5)}
}
function parting(g,far=false){nightSky(g);nightGround(g);piece(g,'fork-left',[[162,93],[143,108],[18,169],[0,159],[110,106]],'#6e8580',{edge:.7});piece(g,'fork-right',[[163,93],[183,109],[320,160],[302,172],[214,129]],'#6e8580',{edge:.7});piece(g,'fork-island',[[152,104],[171,104],[209,180],[107,180]],'#9aa68f',{edge:.7});lamp(g,160);mailbox(g,157,132,.35);
 crab(g,'male',far?55:102,far?151:143,far?40:43,{facing:'left',action:'walk',expression:'sad',u:.2});crab(g,'female',far?274:229,far?145:139,far?37:40,{facing:'right',action:'walk',expression:'neutral',u:.2});
}
function letterNight(g){nightStreet(g,[]);g.save();g.globalAlpha=.20;box(g,'letterdim',0,0,320,180,'#dae0cb',{edge:0,shadow:0});g.restore();piece(g,'letterpaper',[[30,14],[289,13],[292,165],[28,166]],'#fff9e9',{edge:1,shadow:2,rough:.32});piece(g,'letterfold',[[269,14],[290,14],[290,35]],'#e7d7b6',{edge:.35,shadow:.5});line(g,[[48,39],[270,39]],'#d7c29d',.25);box(g,'lettermark',48,25,7,6,'#d0a276',{edge:.15,shadow:.2})}
const nightIds=new Set(['I1','L17','L18','L25','L26','L27','L28','L29','L31','L32','L37','L39','L40','L41','L42','L43','E1','E2','E3','E4','E5']);
SketchScenes.draw=(g,id)=>{if(!nightIds.has(id)&&!id.startsWith('L23'))return old(g,id);reset(g);
 if(id.startsWith('L23')){const phase={'L23-A':.12,'L23-B':.50,'L23-C':.86};daySearch(g,phase[id]??.60)}
 else if(['I1','L17','L18'].includes(id))nightStation(g,id);
 else if(['L25','L26'].includes(id))nightStreet(g,[{v:'female',x:235,y:119,size:33,o:{facing:'right',action:'walk'}},{v:'male',x:116,y:145,size:45,o:{action:'reach',expression:'hopeful'}}],{tram:id==='L26'});
 else if(['L27','L28','L29','L32','L37'].includes(id))nightGallery(g,id);
 else if(id==='L31')nightStreet(g,[{v:'female',x:240,y:126,size:34,o:{facing:'back',action:'walk'}},{v:'male',x:122,y:145,size:44,o:{facing:'right',expression:'sad'}}]);
 else if(['L39','L40'].includes(id))longWait(g,id);
 else if(['L41','L42','L43','E1'].includes(id))arcade(g,id);
 else if(['E2','E3'].includes(id))parting(g,id==='E3');
 else if(['E4','E5'].includes(id))letterNight(g);
 return{id,revision:'v3-user-feedback',characterModule:Character.designVersion,stage:'keyframe_sketch_only',night:nightIds.has(id)};
};
})();
