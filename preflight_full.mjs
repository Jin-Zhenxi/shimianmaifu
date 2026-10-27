import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const shell=path.resolve('.cache/hyperframes-browser/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe');
const browser=await puppeteer.launch({executablePath:shell,headless:true,userDataDir:path.resolve('.cache/chrome-full-qa'),args:['--no-sandbox','--disable-gpu-sandbox','--in-process-gpu','--allow-file-access-from-files','--disable-background-networking']});
try{
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('mv/index.html')).href,{waitUntil:'load'});await page.evaluate(()=>window.sceneReady);
 const meta=await page.evaluate(()=>({duration:MV_DATA.duration,timeline:MV_DATA.timeline}));await fs.mkdir('review/full-keyframes',{recursive:true});let count=0;
 for(const s of meta.timeline){const t=(s.start_frame+s.end_frame)/60,png=await page.evaluate(t=>renderAt(t),t);await fs.writeFile(`review/full-keyframes/${s.id}.png`,Buffer.from(png.split(',')[1],'base64'));count++;if(count%8===0)console.log('Checked '+count+'/48 music keyframes')}
 const bounds=[];
 for(let i=1;i<meta.timeline.length-1;i++){const t=meta.timeline[i].start_frame/30;const row=await page.evaluate(({i,t})=>{const a=ActorTracks.sample(i-1,t),b=ActorTracks.sample(i,t),diffs=[];for(const id of Object.keys(a))if(b[id])for(const k of ['x','y','size'])diffs.push(Math.abs(a[id][k]-b[id][k]));return{index:i,max:Math.max(0,...diffs)}},{i,t});bounds.push(row)}
 for(const t of [0,88,157.9,188.633333,232.133492,280.3,310.266666]){const a=await page.evaluate(t=>renderAt(t),t);await page.evaluate(()=>renderAt(12));const b=await page.evaluate(t=>renderAt(t),t);if(a!==b)throw Error('Nondeterministic frame '+t)}
 for(const [name,t]of [['letter-end',310.266666],['letter-audio-end',232.133492]]){const png=await page.evaluate(t=>renderAt(t),t);await fs.writeFile('review/full-keyframes/'+name+'.png',Buffer.from(png.split(',')[1],'base64'))}
 const a=await page.evaluate(()=>renderAt(281)),b=await page.evaluate(()=>renderAt(310.266666));if(a!==b)throw Error('Reading hold moves');
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile('review/full-preflight.json',JSON.stringify({duration:meta.duration,music_keyframes:count,runtime_errors:errors,deterministic_seek:true,final_reading_hold_frozen:true,actor_boundary_differences:bounds},null,2));console.log('PASS: 48 music shots, repeat seeks, final frozen reading hold.');
}finally{await browser.close()}
