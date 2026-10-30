import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { progressKey } from '../lib/progress.js';
import { mockUnit, mockMaterials } from '../data/mock-aita-data.js';

const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
try {
 for(const saved of ['1','4','invalid','999']) {
  const context=await browser.newContext();
  const material=mockMaterials[Number(saved)];
  const raw=saved==='invalid' ? 'invalid' : JSON.stringify({startedMaterialIds:material ? [material.id] : [],selectedMaterialId:material?.id || 'missing'});
  await context.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:progressKey(null,mockUnit.code),raw});
  const page=await context.newPage();
  await page.route('**/favicon.ico',route=>route.fulfill({status:204}));
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
  await page.goto((process.env.BASE_URL || 'http://127.0.0.1:3105')+'/learn');
  const expected=saved==='1'?'Construction Hazards':saved==='4'?'Emergency Procedures':'Welcome to demo course';
  await page.getByRole('heading',{name:expected,exact:true}).waitFor();
  await page.reload();
  await page.getByRole('heading',{name:expected,exact:true}).waitFor();
  await page.waitForTimeout(300);
  assert.deepEqual(errors,[],`Hydration/console errors for saved index ${saved}`);
  console.log(`PASS saved index ${saved}: correct chapter on initial visit and reload; no hydration errors`);
  await context.close();
 }
} finally {await browser.close();}
