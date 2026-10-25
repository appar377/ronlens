import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output=resolve(process.argv[2]??'../evidence');await mkdir(output,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:4184';
const browser=await chromium.launch({channel:'chrome',headless:true});
const observations=[];
try {
 for(const [name,route,width,height] of [
 ['reader-desktop','/paper/demo-retrieval?concept=retrieval-distance',1126,777],['reader-mobile','/paper/demo-retrieval?concept=retrieval-distance',296,700],
 ['library-desktop','/library',1097,870],['library-mobile','/library',292,560],
 ['network-desktop','/network',1128,816],['network-mobile','/network',303,754],
 ['saved-desktop','/saved',1126,777],['saved-mobile','/saved',390,844],['help-desktop','/help',1126,777],['help-mobile','/help',390,844],['404-mobile','/missing',390,844]]) {
  const page=await browser.newPage({viewport:{width,height},locale:'ja-JP',deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const response=await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:resolve(output,'full-'+name+'-final.png')});
  observations.push({name,url:base+route,width,height,dpr:1,zoom:1,scroll:[0,0],storage:'fresh',selected:route.includes('paper/')?'retrieval-distance':null,status:response.status(),errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.close();
 }
 await writeFile(resolve(output,'full-site-capture.json'),JSON.stringify({browser:browser.version(),observations},null,2)+'\n');
} finally {await browser.close()}
