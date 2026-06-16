'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const QuestionMix = require('./question-mix');

test('five-question rounds cover first-grade end core question types', () => {
  const types = QuestionMix.buildRoundTypes(5);
  assert.deepEqual(types, ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep']);
});

test('shorter rounds keep the progression from easier to harder types', () => {
  assert.deepEqual(QuestionMix.buildRoundTypes(3), ['basic', 'carryBorrow', 'missing']);
});
