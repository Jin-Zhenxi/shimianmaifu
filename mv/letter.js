'use strict';
// Exact user text; wrapping changes layout only. No independent animation state.
window.Letter=(()=>{
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 const font=size=>`${size}px "Microsoft YaHei",sans-serif`;
 function layout(g,data){
  let result;
  for(const size of [36,34,32]){
   g.font=font(size);const rows=[];let y=137;
   for(const paragraph of data.content.split('\n')){
    let text='';
    for(const ch of paragraph){
     if(g.measureText(text+ch).width>1416&&text){
      if('，。？！；：、）》”’！？,.!?;:'.includes(ch)){text+=ch;rows.push({text,x:252,y});y+=size*1.24;text='';continue}
      rows.push({text,x:252,y});y+=size*1.24;text='';
     }
     text+=ch;
    }
    if(text){rows.push({text,x:252,y});y+=size*1.24}
    y+=12;
   }
   result={rows,size,line_height:size*1.24};
   if(y<997)break;
  }
  if(result.rows.at(-1).y>970)throw Error('Letter exceeds one-page readable layout');
  let at=data.reveal_start_music_frame/data.fps;
  for(const row of result.rows){row.start=at;row.full=at+.4;at+=Math.max(2.2,Array.from(row.text).length/7)}
  result.last_line_fully_visible=Math.ceil(result.rows.at(-1).full*data.fps)/data.fps;
  result.hold_start=Math.max(data.audio_end_seconds,result.last_line_fully_visible);
  result.end_frame=Math.ceil((result.hold_start+data.final_hold_seconds)*data.fps);
  result.duration=result.end_frame/data.fps;
  result.text_roundtrip=result.rows.map(x=>x.text).join('')===data.content.replaceAll('\n','');
  if(!result.text_roundtrip)throw Error('Letter text changed during layout');
  return result;
 }
 function draw(g,t,data,l){
  // Shared approved E4 background; text and paper remain fixed while reading.
  SketchScenes.draw(g,'E4');g.setTransform(1,0,0,1,0,0);
  // Expanded paper provides a readable single-page view of the entire letter.
  g.save();g.scale(6,6);Paper.piece(g,'final-letter',[[28,10],[292,10],[292,170],[28,170]],'#fff9e9',{edge:1,shadow:2});g.restore();
  g.save();g.font=font(l.size);g.fillStyle='#4d5145';g.textBaseline='top';
  for(const row of l.rows){g.globalAlpha=smooth((t-row.start)/.4);g.fillText(row.text,row.x,row.y)}
  g.restore();
 }
 return{layout,draw};
})();
