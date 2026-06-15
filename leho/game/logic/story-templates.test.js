'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const StoryTemplates = require('./story-templates');

function fixedRand(values) {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i += 1;
    return value;
  };
}

test('generateQuestion returns valid arithmetic for every known type', () => {
  const types = ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep'];
  for (const type of types) {
    for (let i = 0; i < 30; i += 1) {
      const q = StoryTemplates.generateQuestion({
        type,
        family: 'livingRoom',
        rand: fixedRand([0.13, 0.62, 0.29, 0.81, 0.45])
      });
      const result = StoryTemplates.validateQuestion(q);
      assert.equal(result.ok, true, `${type} should validate: ${result.reason || ''}`);
      assert.equal(Number.isInteger(q.answer), true);
      assert.equal(q.answer >= 0, true);
      assert.equal(typeof q.story, 'string');
      assert.equal(typeof q.question, 'string');
      assert.equal(typeof q.readEquation, 'string');
      assert.equal(Array.isArray(q.equationParts), true);
    }
  }
});

test('semantic intent matches operation mode', () => {
  const addition = StoryTemplates.makeQuestionFromTemplate('addition', { a: 4, b: 5, templateIndex: 0 });
  assert.equal(addition.intent, 'total');
  assert.equal(addition.answer, 9);
  assert.match(addition.question, /一共|总共|现在有/);

  const subtraction = StoryTemplates.makeQuestionFromTemplate('subtraction', { a: 9, b: 3, templateIndex: 0 });
  assert.equal(subtraction.intent, 'remaining');
  assert.equal(subtraction.answer, 6);
  assert.match(subtraction.question, /还剩/);

  const compare = StoryTemplates.makeQuestionFromTemplate('compare', { a: 13, b: 8, templateIndex: 0 });
  assert.equal(compare.intent, 'difference');
  assert.equal(compare.answer, 5);
  assert.match(compare.question, /多多少/);
});

test('validator rejects mismatched story semantics', () => {
  const bad = {
    type: 'basic',
    mode: 'addition',
    intent: 'remaining',
    answer: 7,
    equationParts: [3, '+', 4, '='],
    story: '蓝蓝有 3 块积木，又拿来 4 块，',
    question: '还剩多少块？',
    readEquation: '三加四等于多少？',
    unit: '块',
    noun: '积木'
  };
  const result = StoryTemplates.validateQuestion(bad);
  assert.equal(result.ok, false);
});
