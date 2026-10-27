import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:path.resolve('.cache/chrome-letter-review'),args:['--no-sandbox','--disable-gpu-sandbox','--in-process-gpu','--allow-file-access-from-files','--disable-background-networking']});
try{
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('mv/letter-preview.html')).href,{waitUntil:'load'});
 await page.waitForFunction(()=>window.sceneReady===true);
 const layout=await page.evaluate(()=>window.letterLayout);
 if(errors.length)throw Error(errors.join('\n'));
 for(const [name,t] of [['start',188.633333],['mid',232.133492],['full',layout.hold_start],['end',layout.duration-1/30]]){
  const png=await page.evaluate(t=>window.renderAt(t),t);
  await fs.writeFile(`review/letter-${name}.png`,Buffer.from(png.split(',')[1],'base64'));
 }
 const a=await page.evaluate(t=>window.renderAt(t),layout.hold_start+1);
 const b=await page.evaluate(t=>window.renderAt(t),layout.duration-1/30);
 if(a!==b)throw Error('Final reading hold is not frozen');
 await fs.writeFile('review/letter-layout.json',JSON.stringify({...layout,errors,final_hold_identical_pixels:true},null,2));
 console.log(JSON.stringify({lines:layout.rows.length,font:layout.size,last_line:layout.last_line_fully_visible,duration:layout.duration,hold_frozen:a===b}));
}finally{await browser.close()}
