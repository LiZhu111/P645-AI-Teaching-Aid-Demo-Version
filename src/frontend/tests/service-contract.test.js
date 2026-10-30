import test from 'node:test';
import assert from 'node:assert/strict';
import { materialForView, explanationForView } from '../lib/aita-service.js';

test('real material preserves stable IDs and speech segments', () => {
  const item = materialForView({ item_id: 'DEMO101:PC:8', unit_code: 'DEMO101', sequence: 8, title: 'PPE', speech_segments: ['One.', 'Two.'], next_item_id: 'next' });
  assert.equal(item.id, 'DEMO101:PC:8');
  assert.deepEqual(item.text, ['One.', 'Two.']);
  assert.equal(item.nextItemId, 'next');
  assert.throws(() => materialForView({}));
});
test('no-model and outage results never claim a generated answer', () => {
  const view = explanationForView({ answer: null, model_error: 'no_model_configured', sources: ['PPE source'], prompt: 'PRIVATE' });
  assert.equal(view.canSpeak, false);
  assert.match(view.body, /no AI explanation/);
  assert.equal(view.source, 'PPE source');
  assert.ok(!JSON.stringify(view).includes('PRIVATE'));
  assert.equal(explanationForView({ answer: null, model_error: 'timeout', sources: [] }).status, 'Model unavailable');
  assert.throws(() => explanationForView({ answer: null, sources: [] }));
});
test('refusals and generated explanations preserve source and status', () => {
  const refusal = explanationForView({ answer: 'A human assessor must mark your answer.', grounding: 'refused_assessment', sources: [] });
  assert.equal(refusal.status, 'refused_assessment');
  assert.equal(refusal.canSpeak, true);
  assert.equal(explanationForView({ answer: 'Wear suitable PPE.', grounding: 'grounded', sources: ['Course'] }).source, 'Course');
});

test('source links preserve exact material identities and deduplicate passages', () => {
  const source = { item_id: 'DEMO101:PC:8', unit_code: 'DEMO101', title: 'PPE' };
  const view = explanationForView({ answer: null, model_error: 'no_model_configured', sources: ['PPE'], source_materials: [source, source] });
  assert.equal(view.sourceLinks.length, 1);
  const url = new URL(view.sourceLinks[0].href, 'http://localhost');
  assert.equal(url.pathname, '/learn');
  assert.equal(url.searchParams.get('item'), source.item_id);
  assert.equal(url.searchParams.get('unit'), source.unit_code);
});
