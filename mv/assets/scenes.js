'use strict';
window.SketchScenes=(()=>{
const {C,piece,box,line,rect,oval,crab,flower,painting,mailbox,windowPane}=Paper;
function base(g){g.setTransform(1,0,0,1,0,0);g.fillStyle=C.paper;g.fillRect(0,0,1920,1080);g.scale(6,6)}
function pavement(g){piece(g,'floor',[[0,113],[320,112],[320,180],[0,180]],C.sand,{edge:0,shadow:0});for(let y=135;y<181;y+=20)line(g,[[0,y],[320,y-15]],'#c6b28d',.24);for(let x=25;x<320;x+=60)line(g,[[x,180],[160+(x-160)*.3,111]],'#c6b28d',.24)}
function skyline(g){box(g,'sky',0,0,320,125,C.sky,{edge:0,shadow:0});for(let i=0;i<7;i++){let x=43+i*32,y=43+(i%3)*10;box(g,'far'+i,x,y,28,66-i%3*10,i%2?'#b8c9b2':'#cbd2bb',{edge:.25,shadow:.2});for(let xx=x+5;xx<x+25;xx+=7)for(let yy=y+7;yy<103;yy+=11)box(g,'win'+i+xx+yy,xx,yy,2,4,'#8fa797',{edge:0,shadow:0})}line(g,[[0,6],[320,48]],'#9d997e',.18);line(g,[[0,13],[320,55]],'#9d997e',.18)}
function street(g,actors=[],options={}){skyline(g);pavement(g);piece(g,'road',[[218,104],[320,130],[320,180],[174,180]],'#c2b596',{edge:.5,shadow:.2});piece(g,'walkway',[[0,130],[219,104],[282,180],[0,180]],'#e4cfaa',{edge:.8,shadow:.4});line(g,[[224,109],[193,180]],'#97937c',.45);line(g,[[228,109],[224,180]],'#97937c',.45);
 piece(g,'left',[[0,8],[64,15],[82,34],[82,121],[0,137]],'#d1ba92',{edge:.8,shadow:1});piece(g,'leftside',[[64,15],[82,34],[82,121],[64,123]],'#af9269');[[10,26],[39,30],[10,72],[39,74]].forEach(([x,y],i)=>windowPane(g,'leftw'+i,x,y,14,21));piece(g,'awning',[[0,99],[61,99],[71,106],[0,111]],C.green);for(let x=4;x<64;x+=10)piece(g,'awn'+x,[[x,99],[x+4,99],[x+9,108],[x+4,109]],C.white,{edge:.1,shadow:.1});box(g,'shop',7,112,39,18,'#7d9a83');
 actors.filter(a=>a.layer==='behind').forEach(a=>crab(g,a.v,a.x,a.y,a.size,a.o));
 if(options.corner!==false){piece(g,'right',[[244,0],[320,0],[320,139],[241,113]],'#dfcba7',{edge:.9,shadow:1.2});piece(g,'r-side',[[244,0],[254,0],[253,117],[241,113]],'#b99e76');for(let i=0;i<3;i++){windowPane(g,'rw'+i,266,15+i*31,15,21);windowPane(g,'rv'+i,299,17+i*31,14,22)}}
 if(options.steps){box(g,'poststep-low',116,133,43,12,'#c8b18b',{edge:.4});box(g,'poststep-high',88,121,43,24,'#d7c19b',{edge:.5});line(g,[[88,121],[131,121]],C.white,.8);line(g,[[131,133],[159,133]],C.white,.8)}
 mailbox(g);actors.filter(a=>a.layer!=='behind').forEach(a=>crab(g,a.v,a.x,a.y,a.size,a.o));
}
const actor=(v,x,y,size=40,o={},layer='front')=>({v,x,y,size,o,layer});
function gallery(g,people=[],outside=false,alternate=false){
 if(outside){skyline(g);pavement(g);box(g,'frontwall',20,8,280,121,'#d8c49f',{edge:.9});box(g,'glassdoor',83,20,150,103,'#c4d4c1',{edge:.6});box(g,'glassback',89,26,137,89,'#dfe3cb',{edge:.2});painting(g,'inside',171,38,39,46,1);people.filter(a=>a.layer==='behind').forEach(a=>crab(g,a.v,a.x,a.y,a.size,a.o));box(g,'leftframe',81,18,4,107,C.brown);box(g,'centerframe',155,18,5,107,C.brown);box(g,'rightframe',232,18,4,107,C.brown);line(g,[[165,83],[165,99]],C.green,1.4);line(g,[[148,83],[148,99]],C.green,1.4);piece(g,'topawning',[[17,6],[302,6],[308,20],[12,20]],C.green);people.filter(a=>a.layer!=='behind').forEach(a=>crab(g,a.v,a.x,a.y,a.size,a.o));}
 else{box(g,'gallery-wall',0,0,320,126,alternate?'#e6d7b6':'#e2dcc5',{edge:0,shadow:0});pavement(g);[[30,28,58,63],[133,28,55,62],[235,27,58,64]].forEach((p,i)=>painting(g,'painting'+i,...p,alternate?1:i%2));box(g,'rail',0,113,320,2,'#b6a485',{edge:.1,shadow:0});people.forEach(a=>crab(g,a.v,a.x,a.y,a.size,a.o))}
}
function splitStreet(g){skyline(g);pavement(g);piece(g,'leftpath',[[0,120],[158,90],[158,180],[0,180]],'#e2cca7');piece(g,'rightpath',[[177,90],[320,116],[320,180],[177,180]],'#d8c39b');crab(g,'male',116,143,45,{facing:'left',action:'walk',expression:'hopeful'});crab(g,'female',220,136,40,{facing:'right',action:'walk'});piece(g,'divider',[[154,12],[174,18],[174,179],[154,180]],'#b19a74',{edge:1,shadow:1.4})}
function shutter(g){box(g,'wall',0,0,320,130,'#dac6a2',{edge:0});pavement(g);box(g,'shutterframe',52,15,210,119,C.brown,{edge:.8});box(g,'shopinside',58,21,197,108,'#d9dfc4');painting(g,'closingart',182,78,47,46);box(g,'shutter',57,20,200,77,'#aeae94');for(let y=25;y<97;y+=5)line(g,[[59,y],[255,y]],'#8d9783',.45);line(g,[[57,98],[258,98]],C.white,1.1);crab(g,'male',127,147,46,{action:'wait',expression:'sad'})}
function subway(g,mode){box(g,'stationwall',0,0,320,124,'#c5cdb8',{edge:0});pavement(g);box(g,'train',9,24,303,106,'#b3c3ac',{edge:.9});box(g,'trainstripe',10,99,301,12,C.green,{edge:.1});for(let x=22;x<300;x+=68){box(g,'trainw'+x,x,40,52,52,C.dark);box(g,'inside'+x,x+2,42,48,48,'#dce0c9',{edge:.2})}
 if(mode==='I1'||mode==='L18')crab(g,'female',236,91,31,{facing:'right',action:'idle'});
 box(g,'door',112,31,59,97,'#cbd3bc',{edge:.5});line(g,[[141,31],[141,127]],C.green,.8);box(g,'doorw1',119,43,17,42,'#a6bba8');box(g,'doorw2',147,43,17,42,'#a6bba8');line(g,[[4,135],[316,135]],'#d5b26a',1.5);
 if(mode!=='I1')crab(g,'male',mode==='L17'?139:151,149,46,{facing:'right',action:mode==='L17'?'hurry':'search',expression:'worried',u:.2})
}
function elevator(g,mode){box(g,'liftwall',0,0,320,128,'#d8cbb0',{edge:0});pavement(g);[33,180].forEach((x,i)=>{box(g,'liftframe'+i,x,13,104,120,C.brown,{edge:.8});box(g,'lift'+i,x+5,19,94,112,'#c2ccbb');line(g,[[x+52,19],[x+52,129]],'#7c9480',.65);box(g,'indicator'+i,x+35,6,35,5,C.green,{edge:.2});box(g,'button'+i,x+108,65,5,12,C.white,{edge:.25});});
 if(mode==='L20'){box(g,'leftcutaway',40,22,90,106,'#e1dec4');crab(g,'female',86,119,35,{facing:'back',action:'idle'});piece(g,'separation',[[146,0],[166,3],[166,135],[146,132]],'#b99f77',{edge:.8,shadow:1.2});crab(g,'male',234,148,45,{facing:'left',expression:'sad',action:'wait'});}
 else crab(g,'male',155,149,46,{facing:'left',action:'hurry',expression:'worried',u:.2});
}
function meeting(g,again=false){if(again)gallery(g,[],true);else{box(g,'lobbywall',0,0,320,126,'#dfd4b7',{edge:0});pavement(g);box(g,'exit',102,10,116,116,C.brown);box(g,'exitglass',108,16,104,107,'#d0dbc1');line(g,[[160,16],[160,124]],C.green,.8)}crab(g,'male',132,145,44,{facing:'right',action:'walk',expression:'worried'});crab(g,'extra',210,145,41,{id:'extra-01',facing:'left',action:'hold',hold:{type:'pumpkin',hand:'left'}})}
function tram(g,blocked=false){street(g,[actor('female',220,117,33,{facing:'right',action:'walk'},'behind'),actor('male',116,145,45,{action:'reach',expression:'hopeful'})],{corner:false});for(let i=0;i<5;i++)piece(g,'cross'+i,[[198+i*16,145],[205+i*16,147],[217+i*16,161],[210+i*16,159]],C.white,{edge:.3,shadow:.1});if(blocked){box(g,'tram',153,43,153,83,'#b6c4ad',{edge:.8,shadow:1});box(g,'tramstripe',153,102,153,12,C.green);for(let x=163;x<296;x+=32)box(g,'tramwin'+x,x,54,24,36,'#dfdfc5');[175,282].forEach((x,i)=>piece(g,'tramwheel'+i,oval(x,128,8,5),'#617866'));}}
function miniCity(g,near=false,travel=false){box(g,'citypaper',0,0,320,180,'#d8d5ba',{edge:0});piece(g,'cityroad',[[0,83],[320,83],[320,116],[0,116]],'#d2bd96');piece(g,'cityvertical',[[151,0],[180,0],[180,180],[151,180]],'#d2bd96');for(let y of [10,126])for(let x of [8,56,104,193,241,289]){box(g,'cityhouse'+x+y,x,y,35,47,'#c1c9ac',{edge:.65});box(g,'cityroof'+x+y,x+2,y+2,31,17,C.green,{edge:.4})}box(g,'galleryroof',193,14,76,43,'#b1bfa4');painting(g,'cityart',206,21,20,25);mailbox(g,94,94,.65);box(g,'stairs',206,131,43,30,'#738c75');for(let y=136;y<160;y+=5)line(g,[[209,y],[245,y]],C.white,.4);piece(g,'citywall',[[164,60],[169,60],[169,149],[164,149]],'#a18b62',{edge:.7,shadow:1});crab(g,'male',near?143:130,116,near?30:22,{expression:travel?'worried':'sad',action:travel?'hurry':'wait',facing:travel?'right':'front',u:.2});crab(g,'female',near?190:216,112,near?27:20,{facing:'right',action:'walk'})}
function plaza(g,mode){box(g,'plaza-sky',0,0,320,120,'#e4e6d4',{edge:0});pavement(g);for(let x of [0,230]){box(g,'plazahouse'+x,x,12,88,107,'#d4c49e');windowPane(g,'plazawin'+x,x+20,31,19,30)}piece(g,'lampstem',[[158,42],[161,42],[161,135],[158,135]],C.green,{edge:.35});piece(g,'lamp',[[151,37],[169,37],[167,53],[153,53]],'#d9bd77',{edge:.5});
 if(mode==='L33'){line(g,[[65,162],[111,129],[154,132]],C.white,1.2);line(g,[[260,162],[211,130],[167,132]],C.white,1.2);crab(g,'male',117,143,43,{facing:'right',action:'walk',expression:'hopeful'});crab(g,'female',211,143,41,{facing:'left',action:'walk',expression:'hopeful'});}
 else{crab(g,'male',mode==='L34'?139:135,145,43,{facing:mode==='L34'?'right':'front',action:mode==='L34'?'walk':'idle',expression:'happy'});crab(g,'female',mode==='L34'?185:190,mode==='L34'?133:145,mode==='L34'?38:41,{facing:mode==='L34'?'left':'front',action:mode==='L34'?'walk':'idle',expression:'happy'});if(mode==='L34')piece(g,'lampocclude',[[159,93],[163,93],[163,145],[159,145]],C.green,{edge:.3});}
 if(mode==='L35'){const ox=160,oy=36;for(let i=0;i<12;i++){const a=i/12*6.283,x=ox+Math.cos(a)*28,y=oy+Math.sin(a)*21;piece(g,'firework'+i,[[x,y],[x+Math.cos(a+.5)*8,y+Math.sin(a+.5)*7],[x+Math.cos(a)*15,y+Math.sin(a)*11]],i%2?'#d9ac69':'#d6907e',{edge:.35,shadow:.25})}}
}
function paperFrame(g,fn){box(g,'outsideframe',0,0,320,180,'#abb59f',{edge:0});piece(g,'thoughtpaper',[[16,13],[304,12],[306,163],[15,165]],C.white,{edge:1.5,shadow:1.8});g.save();g.beginPath();g.rect(21,18,278,140);g.clip();g.translate(21,18);g.scale(278/320,140/180);fn();g.restore()}
function letter(g){street(g,[],{corner:false});g.save();g.globalAlpha=.45;box(g,'dim',0,0,320,180,C.paper,{edge:0,shadow:0});g.restore();piece(g,'letterpaper',[[30,14],[289,13],[292,165],[28,166]],'#fff9e9',{edge:1,shadow:2,rough:.32});piece(g,'letterfold',[[269,14],[290,14],[290,35]],'#e7d7b6',{edge:.35,shadow:.5});line(g,[[48,39],[270,39]],'#d7c29d',.25);box(g,'lettermark',48,25,7,6,'#d0a276',{edge:.15,shadow:.2});}
function draw(g,id){base(g);switch(id){
 case'L01':street(g,[actor('male',272,110,34,{action:'wait'},'behind'),actor('female',136,133,43,{facing:'left',action:'walk',hold:{type:'letter',hand:'right'}})],{steps:true});break;
 case'L02':street(g,[actor('female',108,121,45,{facing:'left',action:'post',hold:{type:'letter',hand:'right'},expression:'neutral'})],{steps:true});break;
 case'L03':case'L04':gallery(g,[actor('female',161,145,43,{facing:'back',action:'idle'})],false,id==='L04');break;
 case'L05':gallery(g,[actor('female',194,111,30,{facing:'back'},'behind'),actor('male',121,145,44,{facing:'right',action:'search',expression:'hopeful'})],true);break;
 case'L06':gallery(g,[actor('female',192,118,34,{facing:'left',action:'walk'},'behind'),actor('male',128,145,44,{facing:'right',action:'walk'})],true);break;
 case'L07':splitStreet(g);break;
 case'L08':shutter(g);break;
 case'L09':case'L10':case'L11':case'L12':street(g,[actor('female',235,109,29,{facing:'right',action:'walk'},'behind'),actor('male',id==='L10'?173:132,145,45,{facing:id==='L10'?'left':'right',action:id==='L09'?'walk':'wait',expression:id==='L12'?'sad':'hopeful'})]);if(id==='L12')crab(g,'extra',30,148,38,{facing:'left',action:'walk'});break;
 case'L13':gallery(g,[actor('female',197,118,35,{facing:'back'},'behind'),actor('male',134,146,45,{action:'reach',expression:'hopeful'})],true);break;
 case'L14':paperFrame(g,()=>gallery(g,[actor('male',132,145,42,{facing:'back',expression:'happy'}),actor('female',189,145,41,{facing:'back',expression:'happy'})]));break;
 case'L15':gallery(g,[actor('female',194,118,34,{facing:'back'},'behind'),actor('male',240,145,45,{facing:'right',action:'walk'})],true);break;
 case'L16':gallery(g,[actor('female',179,145,62,{facing:'left',action:'lookback',expression:'neutral'})],true);break;
 case'I1':case'L17':case'L18':subway(g,id);break;
 case'L19':case'L20':elevator(g,id);break;
 case'L21':meeting(g,false);break;case'L22':meeting(g,true);break;
 case'L23':miniCity(g,false,true);break;
 case'L24':street(g,[actor('female',236,107,28,{facing:'right'},'behind'),actor('male',131,146,44,{facing:'right',action:'wait',expression:'worried'})]);piece(g,'fence',[[170,110],[258,132],[258,151],[170,129]],'#d0b07c',{edge:.7});for(let i=0;i<5;i++)line(g,[[174+i*16,113+i*4],[174+i*16,130+i*4]],C.white,1);break;
 case'L25':tram(g,false);break;case'L26':tram(g,true);break;
 case'L27':gallery(g,[actor('male',139,145,46,{action:'wait',expression:'worried'})],true);break;
 case'L28':gallery(g,[actor('male',163,145,76,{action:'idle',expression:'sad'})],true);break;
 case'L29':gallery(g,[actor('male',112,145,60,{action:'reach',expression:'sad'})],true);break;
 case'L30':paperFrame(g,()=>street(g,[actor('male',128,144,44,{facing:'right',action:'walk',expression:'happy'}),actor('female',191,144,43,{facing:'right',action:'walk',expression:'happy'})],{corner:false}));break;
 case'L31':street(g,[actor('female',227,120,33,{facing:'back',action:'walk'},'behind'),actor('male',122,145,44,{facing:'right',expression:'sad'})]);break;
 case'L32':gallery(g,[actor('male',161,145,72,{action:'idle',expression:'hopeful'})],true);break;
 case'L33':case'L34':case'L35':case'L36':paperFrame(g,()=>plaza(g,id));break;
 case'L37':gallery(g,[actor('male',134,145,60,{action:'reach',expression:'sad'})],true);break;
 case'L38':paperFrame(g,()=>street(g,[actor('male',131,145,45,{action:'idle',expression:'regretful'}),actor('female',225,118,34,{facing:'back',action:'walk'},'behind')]));break;
 case'L39':street(g,[actor('male',141,145,75,{action:'wait',expression:'regretful'})]);break;
 case'L40':street(g,[actor('male',129,145,45,{action:'wait',expression:'sad'})]);box(g,'calframe',255,20,51,79,C.brown);box(g,'calpage',258,23,45,71,C.white,{edge:.5});box(g,'caltop',258,23,45,13,'#a9b89f');for(let y=45;y<85;y+=10)for(let x=264;x<300;x+=7)box(g,'day'+x+y,x,y,3,4,'#d7ccb3',{edge:0,shadow:0});piece(g,'turnpage',[[280,62],[303,62],[303,94]],'#e2d4b5',{edge:.3,shadow:.8});break;
 case'L41':case'L42':street(g,[actor('female',id==='L42'?241:235,108,30,{facing:'right',action:'walk'},'behind'),actor('male',id==='L42'?119:140,145,43,{facing:'left',action:'walk',expression:'sad'})]);piece(g,'signpole',[[203,52],[206,52],[206,140],[203,140]],C.green);box(g,'sign',190,47,27,36,'#cfb98f',{edge:.7,shadow:1});break;
 case'L43':street(g,[actor('female',246,107,29,{facing:'right',action:'walk'},'behind'),actor('male',139,145,46,{facing:'right',action:'wait',expression:'sad'})]);break;
 case'E1':street(g,[actor('male',140,145,62,{action:'idle',expression:'sad'})]);break;
 case'E2':miniCity(g,false);break;case'E3':miniCity(g,true);break;
 case'E4':case'E5':letter(g);break;
 default:throw new Error('Unknown shot '+id)
}return{id,characterModule:Character.designVersion,stage:'keyframe_sketch_only'};}
return{draw};
})();
