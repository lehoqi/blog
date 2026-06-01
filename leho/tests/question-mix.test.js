const test = require('node:test');
const assert = require('node:assert/strict');

const Q = require('../logic/question-mix.js');

test('weighted question mix keeps basic drills below carry/borrow practice', () => {
  const weights = Q.QUESTION_TYPE_WEIGHTS;
  assert.deepEqual(weights.map(item => item.type), [
    'basic',
    'carryBorrow',
    'missing',
    'compare',
    'twoStep'
  ]);

  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  const basic = weights.find(item => item.type === 'basic').weight;
  const carryBorrow = weights.find(item => item.type === 'carryBorrow').weight;
  const twoStep = weights.find(item => item.type === 'twoStep').weight;

  assert.ok(basic / total <= 0.2, 'basic questions should be a small warm-up share');
  assert.ok(carryBorrow > basic, 'carry/borrow practice should appear more than easy drills');
  assert.ok(twoStep < carryBorrow, 'two-step reasoning should stay occasional');
});

test('chooseQuestionType follows the configured weighted bands', () => {
  assert.equal(Q.chooseQuestionType(() => 0), 'basic');
  assert.equal(Q.chooseQuestionType(() => 0.19), 'carryBorrow');
  assert.equal(Q.chooseQuestionType(() => 0.56), 'missing');
  assert.equal(Q.chooseQuestionType(() => 0.75), 'compare');
  assert.equal(Q.chooseQuestionType(() => 0.93), 'twoStep');
});

test('round question type stats count total and correct answers independently', () => {
  const questions = [
    { type: 'basic' },
    { type: 'carryBorrow' },
    { type: 'missing' },
    { type: 'compare' },
    { type: 'twoStep' }
  ];

  const stats = Q.buildRoundTypeStats(questions, {
    0: true,
    1: false,
    2: true,
    3: true,
    4: false
  });

  assert.deepEqual(stats.basic, { total: 1, correct: 1 });
  assert.deepEqual(stats.carryBorrow, { total: 1, correct: 0 });
  assert.deepEqual(stats.missing, { total: 1, correct: 1 });
  assert.deepEqual(stats.compare, { total: 1, correct: 1 });
  assert.deepEqual(stats.twoStep, { total: 1, correct: 0 });
});

test('aggregateTypeStats ignores malformed records and preserves known type keys', () => {
  const stats = Q.aggregateTypeStats([
    { questionTypeStats: { missing: { total: 2, correct: 1 }, compare: { total: 1, correct: 1 } } },
    { questionTypeStats: { twoStep: { total: 1, correct: 1 }, bogus: { total: 99, correct: 99 } } },
    {},
    null
  ]);

  assert.deepEqual(stats.basic, { total: 0, correct: 0 });
  assert.deepEqual(stats.missing, { total: 2, correct: 1 });
  assert.deepEqual(stats.compare, { total: 1, correct: 1 });
  assert.deepEqual(stats.twoStep, { total: 1, correct: 1 });
  assert.equal(stats.bogus, undefined);
});

test('hasMixedPerfectRound requires full score and at least three question types', () => {
  assert.equal(Q.hasMixedPerfectRound({
    score: 5,
    total: 5,
    questionTypeStats: {
      basic: { total: 1, correct: 1 },
      carryBorrow: { total: 2, correct: 2 },
      missing: { total: 2, correct: 2 }
    }
  }), true);

  assert.equal(Q.hasMixedPerfectRound({
    score: 4,
    total: 5,
    questionTypeStats: {
      basic: { total: 1, correct: 1 },
      carryBorrow: { total: 2, correct: 2 },
      missing: { total: 2, correct: 1 }
    }
  }), false);

  assert.equal(Q.hasMixedPerfectRound({
    score: 5,
    total: 5,
    questionTypeStats: {
      basic: { total: 2, correct: 2 },
      carryBorrow: { total: 3, correct: 3 }
    }
  }), false);
});
