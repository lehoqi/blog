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

function seededRand(seedValue) {
  let seed = seedValue;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return (seed % 1000) / 1000;
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
    story: '布鲁伊有 3 块积木，又拿来 4 块，',
    question: '还剩多少块？',
    readEquation: '三加四等于多少？',
    unit: '块',
    noun: '积木'
  };
  const result = StoryTemplates.validateQuestion(bad);
  assert.equal(result.ok, false);
});

test('validator rejects arithmetic answer mismatches', () => {
  const q = StoryTemplates.makeQuestionFromTemplate('addition', { a: 4, b: 5, templateIndex: 0 });
  const bad = { ...q, answer: 8 };
  const result = StoryTemplates.validateQuestion(bad);
  assert.equal(result.ok, false);
});

test('missing questions expose the unknown and preserve semantic intent', () => {
  const q = StoryTemplates.generateQuestion({
    type: 'missing',
    family: 'livingRoom',
    rand: fixedRand([0.1, 0.4, 0.7, 0.2, 0.8])
  });

  assert.equal(q.type, 'missing');
  assert.equal(StoryTemplates.validateQuestion(q).ok, true);
  assert.equal(q.equationParts.includes('?'), true);
  assert.match(q.question, /多少|几/);
  assert.match(q.readEquation, /几|多少/);
});

test('two step questions keep both operations in story, equation, and answer', () => {
  const q = StoryTemplates.generateQuestion({
    type: 'twoStep',
    family: 'backyard',
    rand: fixedRand([0.2, 0.5, 0.1, 0.8, 0.3])
  });

  assert.equal(q.type, 'twoStep');
  assert.equal(StoryTemplates.validateQuestion(q).ok, true);
  assert.equal(q.equationParts.filter(part => part === '+' || part === '-').length, 2);
  assert.match(q.story + q.question, /又|后来|再/);
  assert.match(q.readEquation, /再/);
});

test('generated questions stay within first-grade end arithmetic range', () => {
  const types = ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep'];
  for (const type of types) {
    for (let i = 0; i < 50; i += 1) {
      const q = StoryTemplates.generateQuestion({
        type,
        family: 'livingRoom',
        rand: seededRand(i * 37 + 11)
      });
      assert.equal(q.answer >= 0, true, `${type} answer should not be negative`);
      assert.equal(q.answer <= 20, true, `${type} answer should be within 20: ${q.answer}`);
    }
  }
});

test('two step add-subtract edge cases stay within 20', () => {
  const q = StoryTemplates.makeTwoStepQuestion({
    templateIndex: 0,
    a: 14,
    b: 8,
    c: 1
  });

  assert.equal(q.answer <= 20, true, `answer should be within 20: ${q.answer}`);
});

test('carryBorrow questions are real crossing-ten or borrowing problems', () => {
  const carry = StoryTemplates.generateQuestion({
    type: 'carryBorrow',
    family: 'livingRoom',
    rand: fixedRand([0.1, 0.2, 0.4, 0.1])
  });
  assert.equal(carry.op, '+');
  assert.equal(carry.a < 10 && carry.b < 10, true);
  assert.equal(carry.a + carry.b > 10, true);
  assert.equal(carry.answer <= 20, true);

  const borrow = StoryTemplates.generateQuestion({
    type: 'carryBorrow',
    family: 'livingRoom',
    rand: fixedRand([0.9, 0.2, 0.4, 0.1])
  });
  assert.equal(borrow.op, '-');
  assert.equal(borrow.a >= 11 && borrow.a <= 18, true);
  assert.equal(borrow.b > borrow.a % 10, true);
  assert.equal(borrow.answer >= 0 && borrow.answer <= 10, true);
});

test('generated wording is explicit for first-grade readers', () => {
  const types = ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep'];
  for (const type of types) {
    for (let i = 0; i < 40; i += 1) {
      const q = StoryTemplates.generateQuestion({
        type,
        family: 'livingRoom',
        rand: seededRand(i * 29 + 17)
      });
      const text = q.story + q.question;
      assert.match(q.question, /[？?]$/, `${type} question should end with a question mark`);
      assert.match(q.question, /多少|几|一共|还剩|多多少/, `${type} question should ask a clear quantity`);
      assert.equal(text.includes(q.unit), true, `${type} wording should include unit ${q.unit}: ${text}`);
      assert.equal(text.includes('还剩') && q.intent === 'total', false, `${type} total question should not use remaining wording`);
      assert.equal(text.includes('一共') && q.intent === 'remaining', false, `${type} remaining question should not use total wording`);
    }
  }
});

test('story contexts use action-adventure scenes', () => {
  const construction = StoryTemplates.makeQuestionFromTemplate('addition', { a: 4, b: 3, templateIndex: 0 });
  assert.match(construction.story + construction.question, /工程|工地|吊车|推土/);

  const dinoCompare = StoryTemplates.makeQuestionFromTemplate('compare', { a: 9, b: 5, templateIndex: 0 });
  assert.match(dinoCompare.story + dinoCompare.question, /恐龙|化石|脚印/);

  const robotMissing = StoryTemplates.makeMissingQuestion({ templateIndex: 1, a: 4, b: 6 });
  assert.match(robotMissing.story + robotMissing.question, /机器人|电池|能量/);

  const rocketTwoStep = StoryTemplates.makeTwoStepQuestion({ templateIndex: 1, a: 9, b: 4, c: 3 });
  assert.match(rocketTwoStep.story + rocketTwoStep.question, /火箭|燃料|太空|机器人|能量/);
});

test('family option prefers matching scene and keeps garage tag', () => {
  const construction = StoryTemplates.generateQuestion({
    type: 'basic',
    family: 'police',
    rand: fixedRand([0.1, 0.2, 0.3, 0.8])
  });
  assert.equal(construction.scene, 'livingRoom');
  assert.equal(construction.tag, 'police');

  const racing = StoryTemplates.generateQuestion({
    type: 'twoStep',
    family: 'ambulance',
    rand: fixedRand([0.2, 0.5, 0.1, 0.8])
  });
  assert.equal(racing.scene, 'backyard');
  assert.equal(racing.tag, 'ambulance');

  const racingSubtraction = StoryTemplates.generateQuestion({
    type: 'basic',
    family: 'ambulance',
    rand: fixedRand([0.9, 0.2, 0.3, 0.4])
  });
  assert.equal(racingSubtraction.mode, 'subtraction');
  assert.equal(racingSubtraction.scene, 'backyard');
  assert.equal(racingSubtraction.tag, 'ambulance');
});
