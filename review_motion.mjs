import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:path.resolve('.cache/chrome-motion-review'),args:['--no-sandbox','--disable-gpu-sandbox','--in-process-gpu','--allow-file-access-from-files','--disable-background-networking']});
try{
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('mv/index.html')).href,{waitUntil:'load'});await page.evaluate(()=>window.sceneReady);
 const frames=[];
 for(const t of [0,.8,2.4,3.5,4.5,5.65,6.5,7.4,9,11,13,15.2]){
  const a=await page.evaluate(t=>window.renderAt(t),t);await page.evaluate(()=>window.renderAt(.2));const b=await page.evaluate(t=>window.renderAt(t),t);
  if(a!==b)throw Error('Non-deterministic seek at '+t);
  const file=`review/fate-${String(frames.length).padStart(2,'0')}.png`;
  await fs.writeFile(file,Buffer.from(a.split(',')[1],'base64'));frames.push({time:t,file,scene:await page.evaluate(()=>window.currentScene)});
 }
 if(errors.length)throw Error(errors.join('\n'));
 const response=await fetch('http://127.0.0.1:3017/');if(response.status!==200)throw Error('Preview server unavailable');
 await fs.writeFile('review/motion-qa.json',JSON.stringify({stage:'browser_motion_preview',duration:457/30,frames:457,width:1920,height:1080,fps:30,source_start:4628/30,source_end:5085/30,deterministic_seek:true,runtime_errors:errors,frame_samples:frames,studio_http_status:response.status,mp4_exported:false,export_blocker:'HyperFrames Chrome --version probe exits 21 on this host; browser drawing and interactive preview work.'},null,2));
 console.log('PASS: 12 browser samples, repeat-seek identity, no runtime errors, live preview HTTP 200.');
}finally{await browser.close()}
