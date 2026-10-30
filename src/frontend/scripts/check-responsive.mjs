import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
(async () => {
 const out = path.resolve(process.env.RESPONSIVE_OUTPUT || '../../docs/evidence/FE-05/screenshots');
 await fs.mkdir(out, {recursive:true});
 const browser = await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge', headless:true});
 const results = [];
 for (const width of [320,768,1280]) {
  const context = await browser.newContext({viewport:{width,height:900}});
  const page = await context.newPage();
  async function capture(name) {
   const issues = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const visible = el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0 && getComputedStyle(el).visibility !== 'hidden';
    const overflow = [...document.querySelectorAll('body *')].filter(el => visible(el) && !el.closest('nextjs-portal') && (el.getBoundingClientRect().right > width+1 || el.getBoundingClientRect().left < -1)).map(el => ({tag:el.tagName,text:el.textContent.slice(0,60)}));
    const controls = [...document.querySelectorAll('a,button,input,textarea,select')].filter(visible);
    const overlaps=[];
    for(let i=0;i<controls.length;i++) for(let j=i+1;j<controls.length;j++) {
     const a=controls[i], b=controls[j]; if(a.contains(b)||b.contains(a)) continue;
     const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();
     if(Math.min(r.right,s.right)-Math.max(r.left,s.left)>1 && Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>1) overlaps.push([a.textContent.slice(0,30),b.textContent.slice(0,30)]);
    }
    return {documentOverflow:document.documentElement.scrollWidth>width,overflow,overlaps};
   });
   await page.screenshot({path:path.join(out,`${width}-${name}.png`),fullPage:true});
   results.push({width,name,...issues});
  }
  for (const route of ['','learn','ask','assessment','profile','login','register']) {
   await page.goto((process.env.BASE_URL || 'http://127.0.0.1:3105')+'/'+route);
   await page.waitForTimeout(500);
   await capture(route||'home');
   if(route==='' && width<1024){await page.getByRole('button',{name:'Toggle navigation menu'}).click(); await capture('menu-open');}
   if(route==='ask'){
    await page.getByRole('checkbox').uncheck();
    await page.locator('[aria-label="Example questions"] button').first().click();
    await page.waitForTimeout(600); await capture('answer-source');
   }
  }
  await page.evaluate(()=>localStorage.setItem('aita:loggedInUser',JSON.stringify({name:'Alex Long Learner Name',email:'very.long.learner.email.for.responsive.check@example.com',role:'Learner'})));
  await page.goto((process.env.BASE_URL || 'http://127.0.0.1:3105')+'/profile'); await page.waitForTimeout(500); await capture('profile-signed-in');
  await context.close();
 }
 await browser.close();
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.filter(r=>r.documentOverflow||r.overflow.length||r.overlaps.length),null,2));
 console.log(`${results.length} checks; results: ${out}`);
 if(results.some(r=>r.documentOverflow||r.overflow.length||r.overlaps.length)) process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
