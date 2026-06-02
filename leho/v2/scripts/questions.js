(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../logic/question-mix.js'));
  } else {
    root.V2Questions = factory(root.QuestionMix);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (QuestionMix) {
  'use strict';

  function rngOf(rand) { return typeof rand === 'function' ? rand : Math.random; }
  function randInt(min, max, rand) {
    const r = Math.max(0, Math.min(0.999999999, rngOf(rand)()));
    return Math.floor(r * (max - min + 1)) + min;
  }

  const ADD_STORIES = [
    (a, b) => ({ tag: 'police', text: `警车找到 ${a} 个线索，又找到 ${b} 个线索，`, q: '一共有多少个线索？' }),
    (a, b) => ({ tag: 'ambulance', text: `救护车带来 ${a} 个急救包，又补充 ${b} 个，`, q: '现在有多少个急救包？' }),
    (a, b) => ({ tag: 'fire', text: `消防车接好 ${a} 根水管，又接好 ${b} 根，`, q: '一共接好多少根水管？' }),
    (a, b) => ({ tag: 'everyday', text: `车站来了 ${a} 位小朋友，又来了 ${b} 位，`, q: '现在有多少位小朋友？' }),
    (a, b) => ({ tag: 'adventure', text: `火箭收集 ${a} 颗星星，又收集 ${b} 颗，`, q: '一共有多少颗星星？' })
  ];

  const SUB_STORIES = [
    (a, b) => ({ tag: 'police', text: `警车有 ${a} 个路障，清理了 ${b} 个，`, q: '还剩多少个路障？' }),
    (a, b) => ({ tag: 'ambulance', text: `救护车有 ${a} 个急救包，用掉 ${b} 个，`, q: '还剩多少个急救包？' }),
    (a, b) => ({ tag: 'fire', text: `火场有 ${a} 处火苗，扑灭了 ${b} 处，`, q: '还剩多少处火苗？' }),
    (a, b) => ({ tag: 'everyday', text: `公交车上有 ${a} 位小朋友，下车 ${b} 位，`, q: '车上还剩多少位？' }),
    (a, b) => ({ tag: 'adventure', text: `火箭有 ${a} 桶燃料，用掉 ${b} 桶，`, q: '还剩多少桶燃料？' })
  ];

  function pickStory(pool, family) {
    const preferred = pool.find(fn => fn(1, 1).tag === family);
    return preferred || pool[pool.length - 1];
  }

  function attachEquation(q, equationParts, readEquation) {
    return { ...q, equationParts, readEquation };
  }

  function makeStoryQuestion(a, b, op, type, family) {
    if (op === '+') {
      const story = pickStory(ADD_STORIES, family)(a, b);
      return attachEquation(
        { a, b, op, answer: a + b, story: story.text, question: story.q, tag: story.tag, type },
        [a, '+', b, '='],
        `${a} 加 ${b} 等于多少？`
      );
    }
    const story = pickStory(SUB_STORIES, family)(a, b);
    return attachEquation(
      { a, b, op, answer: a - b, story: story.text, question: story.q, tag: story.tag, type },
      [a, '-', b, '='],
      `${a} 减 ${b} 等于多少？`
    );
  }

  function generateBasicQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    if (rand() < 0.55) {
      const a = randInt(1, 9, rand);
      const b = randInt(1, Math.max(1, 10 - a), rand);
      return makeStoryQuestion(a, b, '+', 'basic', family);
    }
    const a = randInt(2, 10, rand);
    const b = randInt(1, a, rand);
    return makeStoryQuestion(a, b, '-', 'basic', family);
  }

  function generateCarryBorrowQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    if (rand() < 0.55) {
      const a = randInt(6, 9, rand);
      const b = randInt(11 - a, 9, rand);
      return makeStoryQuestion(a, b, '+', 'carryBorrow', family);
    }
    const a = randInt(11, 18, rand);
    const b = randInt((a % 10) + 1, 9, rand);
    return makeStoryQuestion(a, b, '-', 'carryBorrow', family);
  }

  function generateMissingQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    const mode = randInt(0, 3, rand);
    if (mode === 0) {
      const a = randInt(3, 9, rand), b = randInt(3, 9, rand), total = a + b;
      return attachEquation(
        { a, b, op: '+', answer: a, story: `小恐龙先有一些星星，又找到 ${b} 颗，合起来是 ${total} 颗，`, question: '它一开始有多少颗？', tag: family, type: 'missing' },
        ['?', '+', b, '=', total],
        `几加 ${b} 等于 ${total}？`
      );
    }
    if (mode === 1) {
      const a = randInt(3, 9, rand), b = randInt(3, 9, rand), total = a + b;
      return attachEquation(
        { a, b, op: '+', answer: b, story: `小恐龙先有 ${a} 颗星星，又找到一些，合起来是 ${total} 颗，`, question: '后来又找到多少颗？', tag: family, type: 'missing' },
        [a, '+', '?', '=', total],
        `${a} 加几等于 ${total}？`
      );
    }
    if (mode === 2) {
      const a = randInt(11, 20, rand), b = randInt(2, 9, rand), left = a - b;
      return attachEquation(
        { a, b, op: '-', answer: a, story: `救援车上原来有一些急救包，用掉 ${b} 个后还剩 ${left} 个，`, question: '原来有多少个急救包？', tag: family, type: 'missing' },
        ['?', '-', b, '=', left],
        `几减 ${b} 等于 ${left}？`
      );
    }
    const a = randInt(11, 20, rand), answer = randInt(2, 9, rand), left = a - answer;
    return attachEquation(
      { a, b: answer, op: '-', answer, story: `小恐龙有 ${a} 颗星星，送出去一些后还剩 ${left} 颗，`, question: '它送出去了多少颗？', tag: family, type: 'missing' },
      [a, '-', '?', '=', left],
      `${a} 减几等于 ${left}？`
    );
  }

  function generateCompareQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    const high = randInt(9, 20, rand);
    const low = randInt(1, high - 1, rand);
    const askMore = rand() < 0.75;
    if (askMore) {
      return attachEquation(
        { a: high, b: low, op: '-', answer: high - low, story: `小恐龙有 ${high} 颗星星，小伙伴有 ${low} 颗，`, question: '小恐龙比小伙伴多多少颗？', tag: family, type: 'compare' },
        [high, '-', low, '='],
        `${high} 减 ${low} 等于多少？`
      );
    }
    return attachEquation(
      { a: high, b: low, op: '-', answer: high - low, story: `校车上有 ${low} 位小朋友，公交车上有 ${high} 位小朋友，`, question: '公交车比校车多多少位？', tag: family, type: 'compare' },
      [high, '-', low, '='],
      `${high} 减 ${low} 等于多少？`
    );
  }

  function generateTwoStepQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    if (rand() < 0.5) {
      const a = randInt(6, 14, rand);
      const b = randInt(2, Math.min(8, 20 - a), rand);
      const c = randInt(1, Math.min(9, a + b - 1), rand);
      return attachEquation(
        { a, b, c, op: '+-', answer: a + b - c, story: `小恐龙先收集 ${a} 颗星星，又收集 ${b} 颗，后来送给朋友 ${c} 颗，`, question: '现在还剩多少颗？', tag: family, type: 'twoStep' },
        [a, '+', b, '-', c, '='],
        `${a} 加 ${b} 再减 ${c} 等于多少？`
      );
    }
    const a = randInt(10, 20, rand);
    const b = randInt(1, Math.min(9, a - 1), rand);
    const c = randInt(1, Math.min(9, 30 - (a - b)), rand);
    return attachEquation(
      { a, b, c, op: '-+', answer: a - b + c, story: `火箭带了 ${a} 桶燃料，飞行用掉 ${b} 桶，又补充 ${c} 桶，`, question: '现在有多少桶燃料？', tag: family, type: 'twoStep' },
      [a, '-', b, '+', c, '='],
      `${a} 减 ${b} 再加 ${c} 等于多少？`
    );
  }

  function generateQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const type = options.type || QuestionMix.chooseQuestionType(rand);
    const nextOptions = { ...options, rand };
    if (type === 'basic') return generateBasicQuestion(nextOptions);
    if (type === 'carryBorrow') return generateCarryBorrowQuestion(nextOptions);
    if (type === 'missing') return generateMissingQuestion(nextOptions);
    if (type === 'compare') return generateCompareQuestion(nextOptions);
    if (type === 'twoStep') return generateTwoStepQuestion(nextOptions);
    return generateCarryBorrowQuestion(nextOptions);
  }

  function generateRound(options = {}) {
    const count = Math.max(1, Math.floor(Number(options.count) || 5));
    const rand = rngOf(options.rand);
    return Array.from({ length: count }, () => generateQuestion({ ...options, rand }));
  }

  function answerHintRange(q) {
    const answer = Math.max(0, Math.floor(Number(q && q.answer) || 0));
    return { min: Math.max(0, answer - 3), max: answer + 3 };
  }

  return {
    randInt,
    generateRound,
    generateQuestion,
    generateBasicQuestion,
    generateCarryBorrowQuestion,
    generateMissingQuestion,
    generateCompareQuestion,
    generateTwoStepQuestion,
    answerHintRange
  };
});
