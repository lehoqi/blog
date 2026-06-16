'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const SpeechPlan = require('./speech-plan');

test('question speech starts with clear reminder and pause', () => {
  assert.deepEqual(SpeechPlan.question('3 加 4 等于多少？'), [
    '请听题。',
    { type: 'pause', pauseMs: 750 },
    '3 加 4 等于多少？'
  ]);
});

test('appendQuestion keeps story lines before reminder and pause', () => {
  assert.deepEqual(SpeechPlan.appendQuestion(['赛车准备！'], '5 减 2 等于多少？'), [
    '赛车准备！',
    '请听题。',
    { type: 'pause', pauseMs: 750 },
    '5 减 2 等于多少？'
  ]);
});

test('normalizeItems keeps pause items for speech queue draining', () => {
  assert.deepEqual(SpeechPlan.normalizeItems(['请听题。', SpeechPlan.pause(900), '题目来了'], 0.86), [
    { text: '请听题。', rate: 0.86 },
    { type: 'pause', pauseMs: 900 },
    { text: '题目来了', rate: 0.86 }
  ]);
});
