import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
try {
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.BASE_URL || 'http://127.0.0.1:3105';
 async function register(name,email){
  await page.goto(base+'/register');
  await page.getByLabel('Full name',{exact:true}).fill(name);
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('test-password');
  await page.getByLabel('Confirm password',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.waitForURL('**/profile');
  await page.getByText('0%',{exact:true}).waitFor();
 }
 await register('Learner One','one@example.com');
 await page.goto(base+'/learn');
 await page.getByText('0 of 6 started',{exact:true}).waitFor();
 await page.getByRole('button',{name:/Assessment Feedback/}).click();
 await page.getByText('1 of 6 started',{exact:true}).waitFor();
 await page.getByRole('button',{name:/Assessment Feedback/}).click();
 await page.reload();
 await page.getByRole('heading',{name:'Assessment Feedback',exact:true}).waitFor();
 await page.getByText('1 of 6 started',{exact:true}).waitFor();
 await page.goto(base+'/');
 await page.getByText('1 of 6 learning topics started',{exact:true}).waitFor();
 await page.goto(base+'/profile');
 await page.getByText('17%',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Log out',exact:true}).click();
 await page.goto(base+'/login');
 await page.getByLabel('Email',{exact:true}).fill('one@example.com');
 await page.getByLabel('Password',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'Log in',exact:true}).click();
 await page.waitForURL(base+'/');
 await page.getByText('1 of 6 learning topics started',{exact:true}).waitFor();
 console.log('PASS new learner starts at 0%; one chapter is 17%; repeats, reload and login preserve progress');
 await register('Learner Two','two@example.com');
 await page.goto(base+'/learn');
 await page.getByText('0 of 6 started',{exact:true}).waitFor();
 await page.getByRole('heading',{name:'Welcome to demo course',exact:true}).waitFor();
 await page.goto(base+'/');
 await page.getByText('0 of 6 learning topics started',{exact:true}).waitFor();
 console.log('PASS second learner inherits neither progress nor selected chapter');
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
