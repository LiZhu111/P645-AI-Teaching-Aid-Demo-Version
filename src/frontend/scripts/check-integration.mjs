import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:3105';
const output = '../../docs/evidence/phase1';
await mkdir(output, { recursive: true });
const checks = [];
function pass(name) { checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const state = window.__speechTest = { active: null, recognitions: [] };
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class { constructor(text) { this.text = text; } } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speak(utterance) { state.active = utterance; }, cancel() { state.active = null; }, pause() {}, resume() {}
    } });
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: class {
      constructor() { state.recognitions.push(this); } start() { this.active = true; } abort() { this.active = false; this.onend?.(); }
    } });
  });
  async function api(action, args = {}) {
    const response = await page.request.post(`${base}/api/aita`, { data: { action, ...args } });
    assert.equal(response.status(), 200);
    return response.json();
  }
  const units = await api('units');
  assert.equal(units.length, 8);
  const outline = await api('outline');
  assert.equal(outline.reading_order.length, 166);
  const item = await api('material', { item_id: outline.reading_order[1].item_id });
  assert.ok(item.speech_segments.length > 1);
  assert.match(item.database_id, /^mat_[a-f0-9]{64}$/);
  pass('MCP units, canonical demo course outline and segmented material');
  await page.goto(`${base}/learn`);
  await page.getByRole('heading', { name: outline.reading_order[0].title, exact: true }).waitFor();
  const main = page.locator('main');
  await page.locator('nav[aria-label="Learning material"] button').nth(1).click();
  await page.getByRole('heading', { name: item.title, exact: true }).waitFor();
  await main.getByRole('button', { name: 'Read', exact: true }).click();
  assert.ok(await page.evaluate(() => window.__speechTest.active));
  await page.evaluate(offset => window.__speechTest.active.onboundary({ charIndex: offset }), item.speech_segments[0].length + 1);
  await page.reload();
  await page.getByText('Resume position saved at paragraph 2.', { exact: true }).waitFor();
  await main.getByRole('button', { name: 'Read', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__speechTest.active.text), item.speech_segments.slice(1).join(' '));
  pass('real material segment position survives reload and Read resumes correctly');
  await main.getByRole('button', { name: 'Speak', exact: true }).click();
  await page.waitForFunction(() => window.__speechTest.active === null);
  await main.getByRole('button', { name: 'Read', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__speechTest.recognitions.at(-1).active), false);
  await page.locator('header').getByRole('link', { name: 'Ask Aita', exact: true }).click();
  await page.waitForURL('**/ask');
  await page.waitForFunction(() => window.__speechTest.active === null);
  pass('Read/Speak arbitration and navigation cleanup');
  await page.locator('textarea').fill('What are the different types of hazard?');
  await main.getByRole('button', { name: 'Ask Aita', exact: true }).click();
  await page.getByText('Context-only demo', { exact: true }).waitFor();
  await page.getByText(/A model is not configured/).waitFor();
  pass('typed question reaches backend; no-model mode honestly labelled');
  const sourceLink = page.getByRole('navigation', { name: 'Answer sources' }).getByRole('link').first();
  const sourceUrl = new URL(await sourceLink.getAttribute('href'), base);
  const sourceMaterial = await api('material', { unit_code: sourceUrl.searchParams.get('unit'), item_id: sourceUrl.searchParams.get('item') });
  await sourceLink.click();
  await page.getByRole('heading', { name: sourceMaterial.title, exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: sourceMaterial.title, exact: true }).waitFor();
  pass('answer source opens the exact SQLite material and survives reload');
  await page.locator('nav[aria-label="Learning material"] button').nth(1).click();
  await page.getByRole('heading', { name: item.title, exact: true }).waitFor();
  await page.waitForURL('**/learn');
  await page.reload();
  await page.getByRole('heading', { name: item.title, exact: true }).waitFor();
  pass('manual chapter selection replaces the source link and survives reload');
  const otherUnit = units.find(unit => unit.unit_code !== 'DEMO101');
  await page.locator('#unitSelect').selectOption(otherUnit.unit_code);
  const otherOutline = await api('outline', { unit_code: otherUnit.unit_code });
  await page.getByRole('heading', { name: otherOutline.reading_order[0].title, exact: true }).waitFor();
  await page.goto(sourceUrl.href);
  await page.getByRole('heading', { name: sourceMaterial.title, exact: true }).waitFor();
  pass('unit selection and cross-unit deep links load matching content');
  await page.locator('header').getByRole('link', { name: 'Ask Aita', exact: true }).click();
  await page.waitForURL('**/ask');
  await main.getByRole('button', { name: 'Speak', exact: true }).click();
  await page.evaluate(() => window.__speechTest.recognitions.at(-1).onresult({ results: [[{ transcript: 'Is my answer right?' }]] }));
  await page.getByText('refused_assessment', { exact: true }).waitFor();
  assert.equal(await page.locator('textarea').inputValue(), 'Is my answer right?');
  pass('voice transcript reaches MCP and assessment requests are refused');
  const unsupported = await api('ask', { question: 'How do I bake a chocolate cake?' });
  assert.equal(unsupported.grounding, 'abstain');
  assert.ok(!('prompt' in unsupported));
  for (const case_id of ['correct', 'incorrect']) {
    const result = await api('feedback', { case_id });
    assert.equal(result.marked_correct, case_id === 'correct');
    assert.ok(!('prompt' in result));
    assert.ok(!('system_prompt' in result));
    assert.match(result.demo_notice, /Demonstration only/);
  }
  const crossOrigin = await page.request.post(`${base}/api/aita`, { headers: { Origin: 'https://example.invalid' }, data: { action: 'units' } });
  assert.equal(crossOrigin.status(), 403);
  const invalid = await page.request.post(`${base}/api/aita`, { data: { action: 'feedback', case_id: 'arbitrary', marked_correct: true } });
  assert.equal(invalid.status(), 400);
  pass('unsupported fallback, controlled feedback cases and prompt exclusion');
  await page.goto(`${base}/assessment`);
  await page.getByRole('button', { name: 'Explain this case' }).click();
  await page.getByText(/Demonstration only: this case simulates/).waitFor();
  await page.getByLabel('Assessor decision').selectOption('incorrect');
  await page.getByText(/marking an answer incorrect/).waitFor();
  pass('both assessment demo cases render through the service');
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/learn', '/ask', '/assessment', '/profile']) {
      await page.goto(base + route);
      if (route === '/learn') await page.locator('article').waitFor();
      else await page.locator('main').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow at ${width} ${route}`);
      await page.screenshot({ path: `${output}/${width}-${route.slice(1) || 'home'}.png` });
    }
    pass(`five real-service routes fit ${width}px`);
  }
  assert.deepEqual(errors, []);
  pass('no browser page errors');
} finally {
  await writeFile(`${output}/browser.json`, JSON.stringify(checks, null, 2));
  await browser.close();
}
