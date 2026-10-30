import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechSession } from '../lib/speech-session.js';

const options = { language: 'en-AU', rate: 0.92, maxAlternatives: 1 };
function setup() {
  const events = [], utterances = [], recognitions = [];
  const environment = {
    speechSynthesis: {
      cancel() { events.push('cancel'); },
      speak(utterance) { events.push('speak'); utterances.push(utterance); }
    },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    SpeechRecognition: class {
      constructor() { recognitions.push(this); }
      start() { events.push('listen'); if (environment.failStart) throw Error('permission'); }
      abort() { events.push('abort'); this.onend?.(); }
    }
  };
  return { session: createSpeechSession(() => environment), environment, events, utterances, recognitions };
}
test('Speak stops Read across owners and Read aborts Speak', () => {
  const { session, events } = setup();
  session.speak('reader', 'material', 'Chapter one', options);
  session.listen('header', () => {}, () => {}, () => {}, options);
  assert.deepEqual(events.slice(-2), ['cancel', 'listen']);
  assert.equal(session.getSnapshot().owner, 'header');
  session.speak('reader', 'material', 'Chapter two', options);
  assert.deepEqual(events.slice(-3), ['abort', 'cancel', 'speak']);
  assert.equal(session.getSnapshot().listening, false);
});
test('rapid Stop cancels queued speech and late old completion cannot clear new speech', () => {
  const { session, utterances } = setup();
  session.toggleSpeech('reader', 'material', 'First', options);
  session.toggleSpeech('reader', 'material', 'First', options);
  assert.equal(session.getSnapshot().speechId, null);
  session.speak('reader', 'material', 'Second', options);
  utterances[0].onend();
  assert.equal(session.getSnapshot().speechId, 'material');
  utterances[1].onend();
  assert.equal(session.getSnapshot().speechId, null);
});
test('navigation cleanup cancels owned audio and invalidates delayed answers', () => {
  const { session, events } = setup();
  session.speak('page', 'answer', 'Answer', options);
  const version = session.getVersion();
  session.release('page');
  assert.equal(events.at(-1), 'cancel');
  assert.equal(session.getSnapshot().owner, null);
  assert.notEqual(session.getVersion(), version);
});
test('cancelled recognition never submits a late transcript', () => {
  const { session, recognitions } = setup();
  let submissions = 0;
  session.listen('page', () => submissions++, () => {}, () => {}, options);
  session.stopAll();
  recognitions[0].onresult({ results: [[{ transcript: 'stale question' }]] });
  assert.equal(submissions, 0);
});
test('only one microphone session survives switching between header and page', () => {
  const { session, recognitions } = setup();
  session.listen('header', () => {}, () => {}, () => {}, options);
  session.listen('page', () => {}, () => {}, () => {}, options);
  recognitions[0].onend();
  assert.equal(session.getSnapshot().owner, 'page');
  assert.equal(session.getSnapshot().listening, true);
});
test('transcript releases microphone before answer playback', () => {
  const { session, recognitions, events } = setup();
  session.listen('page', text => session.speak('page', 'answer', text, options), () => {}, () => {}, options);
  recognitions[0].onresult({ results: [[{ transcript: 'question' }]] });
  assert.deepEqual(events.slice(-3), ['abort', 'cancel', 'speak']);
  assert.equal(session.getSnapshot().speechId, 'answer');
});
test('recognition start errors and natural end restore idle', () => {
  const { session, environment, recognitions } = setup();
  let errors = 0;
  environment.failStart = true;
  session.listen('page', () => {}, () => {}, () => errors++, options);
  assert.equal(errors, 1);
  assert.equal(session.getSnapshot().listening, false);
  environment.failStart = false;
  session.listen('page', () => {}, () => {}, () => errors++, options);
  recognitions.at(-1).onend();
  assert.equal(session.getSnapshot().listening, false);
});
test('unsupported voice input still stops active playback', () => {
  const { session, environment } = setup();
  session.speak('page', 'material', 'Text', options);
  delete environment.SpeechRecognition;
  let unsupported = 0;
  session.listen('page', () => {}, () => unsupported++, () => {}, options);
  assert.equal(unsupported, 1);
  assert.equal(session.getSnapshot().speechId, null);
});

test('stopping playback pauses first and retries a cancellation that leaves audio active', () => {
  const { session, environment, events } = setup();
  const timers = [];
  environment.setTimeout = callback => timers.push(callback);
  const synth = environment.speechSynthesis;
  synth.pause = () => { synth.paused = true; events.push('pause'); };
  synth.resume = () => { synth.paused = false; events.push('resume'); };
  session.speak('reader', 'material', 'Old chapter', options);
  synth.speaking = true;
  session.stopAll();
  assert.deepEqual(events.slice(-2), ['pause', 'cancel']);
  assert.equal(session.getSnapshot().speechId, null);
  const count = events.length;
  timers.shift()();
  assert.deepEqual(events.slice(count), ['pause', 'cancel']);
});

test('late cancellation cannot stop a newly selected chapter and playback resumes', () => {
  const { session, environment, events, utterances } = setup();
  const timers = [];
  environment.setTimeout = callback => timers.push(callback);
  const synth = environment.speechSynthesis;
  synth.pause = () => { synth.paused = true; events.push('pause'); };
  synth.resume = () => { synth.paused = false; events.push('resume'); };
  session.speak('reader', 'material', 'Old chapter', options);
  synth.speaking = true;
  session.stopAll();
  session.speak('reader', 'material', 'New chapter', options);
  assert.deepEqual(events.slice(-2), ['resume', 'speak']);
  const count = events.length;
  timers.forEach(callback => callback());
  assert.equal(events.length, count);
  assert.equal(utterances.at(-1).text, 'New chapter');
  assert.equal(session.getSnapshot().speechId, 'material');
});
