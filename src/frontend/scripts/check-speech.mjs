import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.addInitScript(() => {
  const state = window.__speechTest = { utterances: [], recognitions: [], active: null, cancelCount: 0, failStart: false };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable:true, value:class { constructor(text){this.text=text;} } });
  Object.defineProperty(window, 'speechSynthesis', { configurable:true, value:{
   speak(utterance){ state.utterances.push(utterance); state.active=utterance; utterance.onstart?.(); },
   cancel(){ state.cancelCount++; const old=state.active; state.active=null; old?.onend?.(); }
  }});
  class Recognition {
   constructor(){ state.recognitions.push(this); this.active=false; }
   start(){ if(state.failStart) throw Error('permission denied'); this.active=true; }
   abort(){ this.active=false; this.onend?.(); }
  }
  Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:Recognition,writable:true});
  Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,value:undefined,writable:true});
 });
 const url = process.env.BASE_URL || 'http://127.0.0.1:3105';
 const main = page.locator('main'), header = page.locator('header');
 const read = () => main.getByRole('button',{name:'Read',exact:true});
 const active = () => page.evaluate(()=>Boolean(window.__speechTest.active));
 let checks=0;
 function passed(name){checks++;console.log(`PASS ${name}`);}
 await page.goto(url+'/learn');
 await header.getByRole('link',{name:'Log in',exact:true}).waitFor();
 await read().click();
 assert.equal(await active(),true);
 await main.getByRole('button',{name:/Construction Hazards/}).click();
 assert.equal(await active(),false);
 await read().click();
 assert.match(await page.evaluate(()=>window.__speechTest.active.text),/^Construction Hazards/);
 passed('changing chapter stops old speech; Read uses the selected chapter');

 await main.getByRole('button',{name:'Speak',exact:true}).click();
 assert.equal(await active(),false);
 assert.equal(await read().count(),1);
 assert.equal(await page.evaluate(()=>window.__speechTest.recognitions.at(-1).active),true);
 passed('local Speak stops Read');
 await read().click();
 assert.equal(await page.evaluate(()=>window.__speechTest.recognitions.at(-1).active),false);
 passed('Read stops microphone input');
 await header.getByRole('button',{name:'Speak',exact:true}).click();
 assert.equal(await active(),false);
 assert.equal(await read().count(),1);
 passed('header Speak stops panel Read');
 await main.getByRole('button',{name:'Speak',exact:true}).click();
 assert.equal(await header.getByRole('button',{name:'Speak',exact:true}).count(),1);
 assert.equal(await page.evaluate(()=>window.__speechTest.recognitions.filter(r=>r.active).length),1);
 passed('only the active Speak button shows Stop');
 await main.getByRole('button',{name:'Stop',exact:true}).click();
 await read().click();
 await header.getByRole('link',{name:'Ask Aita',exact:true}).click();
 await page.waitForURL('**/ask');
 await page.waitForFunction(()=>!window.__speechTest.active);
 assert.equal(await active(),false);
 passed('client-side navigation stops playback');

 await page.locator('[aria-label="Example questions"] button').first().click();
 await header.getByRole('link',{name:'Learn',exact:true}).click();
 await page.waitForURL('**/learn');
 await page.waitForTimeout(500);
 assert.equal(await active(),false);
 passed('pending answer cannot start playback after leaving the page');

 await page.evaluate(()=>window.__speechTest.failStart=true);
 await main.getByRole('button',{name:'Speak',exact:true}).click();
 assert.equal(await main.getByRole('button',{name:'Speak',exact:true}).count(),1);
 assert.equal(await main.getByRole('button',{name:'Stop',exact:true}).count(),0);
 passed('recognition start failure resets the Speak button');
 await page.evaluate(()=>{window.__speechTest.failStart=false;window.SpeechRecognition=undefined;});
 await read().click();
 await main.getByRole('button',{name:'Speak',exact:true}).click();
 assert.equal(await active(),false);
 assert.equal(await read().count(),1);
 passed('unsupported microphone input still stops playback');

 await header.getByRole('link',{name:'Assessment',exact:true}).click();
 await page.waitForURL('**/assessment');
 await read().click();
 await main.locator('select').selectOption('incorrect');
 assert.equal(await active(),false);
 await read().click();
 assert.equal(await active(),true);
 passed('changing assessor feedback stops old audio');
 assert.deepEqual(errors,[]);
 console.log(`${checks} browser interaction checks passed (speech APIs simulated; no real microphone or speaker verification).`);
} finally { await browser.close(); }
