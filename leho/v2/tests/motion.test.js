const test = require('node:test');
const assert = require('node:assert/strict');
const Motion = require('../scripts/motion.js');

test('motion budgets match design time limits', () => {
  assert.equal(Motion.MOTION_BUDGETS.start.maxMs, 900);
  assert.equal(Motion.MOTION_BUDGETS.wrong.maxMs, 600);
  assert.equal(Motion.MOTION_BUDGETS.correct.minMs, 900);
  assert.equal(Motion.MOTION_BUDGETS.correct.maxMs, 1500);
  assert.equal(Motion.MOTION_BUDGETS.combo.maxMs, 1800);
  assert.equal(Motion.MOTION_BUDGETS.finisher.maxMs, 2200);
  assert.equal(Motion.MOTION_BUDGETS.perfect.maxMs, 2800);
});

test('particle limits are capped for phone and desktop', () => {
  assert.equal(Motion.particleLimit({ width: 390, height: 844 }), 35);
  assert.equal(Motion.particleLimit({ width: 1280, height: 720 }), 80);
});

test('combo tier maps visible escalation levels', () => {
  assert.equal(Motion.comboTier(1), 1);
  assert.equal(Motion.comboTier(2), 2);
  assert.equal(Motion.comboTier(3), 3);
  assert.equal(Motion.comboTier(4), 4);
  assert.equal(Motion.comboTier(5), 5);
  assert.equal(Motion.comboTier(99), 5);
});

test('question feedback classes distinguish math abilities without balance wording', () => {
  assert.equal(Motion.feedbackClassForQuestion({ type: 'carryBorrow' }), 'feedback-carryBorrow');
  assert.equal(Motion.feedbackClassForQuestion({ type: 'missing' }), 'feedback-missing');
  assert.equal(Motion.feedbackClassForQuestion({ type: 'compare' }), 'feedback-compare');
  assert.equal(Motion.feedbackClassForQuestion({ type: 'twoStep' }), 'feedback-twoStep');
  assert.notEqual(Motion.feedbackClassForQuestion({ type: 'compare' }), 'feedback-balance');
});

test('durationFor uses reduced motion budget when requested', () => {
  assert.equal(Motion.durationFor('correct', false), 1500);
  assert.equal(Motion.durationFor('correct', true), 400);
});
