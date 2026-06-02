const test = require('node:test');
const assert = require('node:assert/strict');
const QuestionMix = require('../../logic/question-mix.js');
const Questions = require('../scripts/questions.js');

function seq(values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

test('generateRound returns five mixed typed questions with stats-compatible types', () => {
  const round = Questions.generateRound({
    count: 5,
    family: 'police',
    rand: seq([0, 0.2, 0.6, 0.78, 0.94, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
  });
  assert.equal(round.length, 5);
  round.forEach(q => assert.ok(QuestionMix.QUESTION_TYPES.includes(q.type), q.type));
  const stats = QuestionMix.buildRoundTypeStats(round, { 0: true, 1: true });
  assert.equal(Object.keys(stats).length, 5);
});

test('missing question keeps unknown operand, answer, and readEquation aligned', () => {
  const q = Questions.generateMissingQuestion({ family: 'adventure', rand: seq([0, 0.4, 0.4]) });
  assert.equal(q.type, 'missing');
  assert.deepEqual(q.equationParts, ['?', '+', 5, '=', 10]);
  assert.equal(q.answer, 5);
  assert.equal(q.readEquation, '几加 5 等于 10？');
  assert.match(q.question, /一开始/);
});

test('compare question asks the same direction as its equation', () => {
  const q = Questions.generateCompareQuestion({ family: 'everyday', rand: seq([0.95, 0.1, 0.9]) });
  assert.equal(q.type, 'compare');
  assert.equal(q.answer, q.a - q.b);
  assert.match(q.story, /校车上有/);
  assert.match(q.question, /公交车比校车多多少位/);
  assert.deepEqual(q.equationParts, [q.a, '-', q.b, '=']);
});

test('two-step question preserves action order in equation and speech', () => {
  const q = Questions.generateTwoStepQuestion({ family: 'fire', rand: seq([0.8, 0.5, 0.5, 0.5]) });
  assert.equal(q.type, 'twoStep');
  assert.equal(q.answer, q.a - q.b + q.c);
  assert.deepEqual(q.equationParts, [q.a, '-', q.b, '+', q.c, '=']);
  assert.equal(q.readEquation, `${q.a} 减 ${q.b} 再加 ${q.c} 等于多少？`);
});

test('answerHintRange is not capped at old twenty question range', () => {
  assert.deepEqual(Questions.answerHintRange({ answer: 27 }), { min: 24, max: 30 });
  assert.deepEqual(Questions.answerHintRange({ answer: 1 }), { min: 0, max: 4 });
});
