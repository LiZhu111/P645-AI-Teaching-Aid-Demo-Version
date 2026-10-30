import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressKey, readProgress, saveSpeechSegment, startMaterial } from '../lib/progress.js';
const materials = [{id:'one'},{id:'two'},{id:'three'}];
test('new users and invalid saved records start with no progress',()=>{
 for(const raw of [null,'invalid','{}']) assert.deepEqual(readProgress(raw,materials),{startedMaterialIds:[],selectedMaterialId:null,speechSegment:0});
});
test('progress belongs to a learner and unit; guests do not share account records',()=>{
 assert.notEqual(progressKey('a@example.com','unit'),progressKey('b@example.com','unit'));
 assert.notEqual(progressKey(null,'unit'),progressKey('a@example.com','unit'));
 assert.notEqual(progressKey('a@example.com','unit'),progressKey('a@example.com','other'));
 assert.equal(progressKey(' A@Example.com ','unit'),progressKey('a@example.com','unit'));
});
test('opening the last chapter counts only that chapter and repeated visits do not increase progress',()=>{
 const first=startMaterial(null,materials,'three');
 assert.deepEqual(first,{startedMaterialIds:['three'],selectedMaterialId:'three',speechSegment:0});
 const second=startMaterial(JSON.stringify(first),materials,'three');
 assert.deepEqual(second,first);
 assert.equal(second.selectedMaterialId,'three');
});
test('unknown or duplicate chapter IDs cannot inflate progress',()=>{
 assert.deepEqual(readProgress(JSON.stringify({startedMaterialIds:['one','one','missing'],selectedMaterialId:'missing'}),materials),{startedMaterialIds:['one'],selectedMaterialId:null,speechSegment:0});
});

test('speech segment position is saved with the selected material',()=>{
 const progress=saveSpeechSegment(null,materials,'two',2);
 assert.deepEqual(progress,{startedMaterialIds:['two'],selectedMaterialId:'two',speechSegment:2});
});
