'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StoryTemplates = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCENES = ['livingRoom', 'backyard', 'park', 'kitchen', 'bedroom'];

  const TEMPLATES = {
    addition: [
      {
        scene: 'livingRoom',
        noun: '积木',
        unit: '块',
        story: (a, b) => `蓝蓝先搭了 ${a} 块积木，橙橙又递来 ${b} 块，`,
        question: '现在一共有多少块积木？'
      },
      {
        scene: 'backyard',
        noun: '气球',
        unit: '个',
        story: (a, b) => `后院挂着 ${a} 个气球，爸爸又吹好 ${b} 个，`,
        question: '后院一共有多少个气球？'
      },
      {
        scene: 'kitchen',
        noun: '饼干',
        unit: '块',
        story: (a, b) => `盘子里有 ${a} 块饼干，妈妈又放上 ${b} 块，`,
        question: '盘子里现在有多少块饼干？'
      }
    ],
    subtraction: [
      {
        scene: 'livingRoom',
        noun: '积木',
        unit: '块',
        story: (a, b) => `蓝蓝有 ${a} 块积木，收进玩具箱 ${b} 块，`,
        question: '外面还剩多少块积木？'
      },
      {
        scene: 'kitchen',
        noun: '饼干',
        unit: '块',
        story: (a, b) => `盘子里有 ${a} 块饼干，橙橙吃掉 ${b} 块，`,
        question: '盘子里还剩多少块饼干？'
      },
      {
        scene: 'bedroom',
        noun: '星星贴纸',
        unit: '张',
        story: (a, b) => `床头有 ${a} 张星星贴纸，蓝蓝贴到本子上 ${b} 张，`,
        question: '床头还剩多少张星星贴纸？'
      }
    ],
    compare: [
      {
        scene: 'park',
        noun: '小石子',
        unit: '颗',
        story: (a, b) => `蓝蓝捡了 ${a} 颗小石子，橙橙捡了 ${b} 颗小石子，`,
        question: '蓝蓝比橙橙多多少颗小石子？'
      },
      {
        scene: 'bedroom',
        noun: '星星贴纸',
        unit: '张',
        story: (a, b) => `蓝蓝有 ${a} 张星星贴纸，橙橙有 ${b} 张星星贴纸，`,
        question: '蓝蓝比橙橙多多少张星星贴纸？'
      }
    ]
  };

  const MISSING_TEMPLATES = [
    {
      scene: 'livingRoom',
      noun: '积木',
      unit: '块',
      mode: 'missingAddend',
      build: (a, b) => {
        const total = a + b;
        return {
          answer: b,
          story: `蓝蓝先搭了 ${a} 块积木，橙橙又递来一些，合起来是 ${total} 块，`,
          question: '橙橙递来多少块积木？',
          equationParts: [a, '+', '?', '=', total],
          readEquation: `${spokenNumber(a)} 加几等于 ${spokenNumber(total)}？`,
          intent: 'missing-addend'
        };
      }
    },
    {
      scene: 'kitchen',
      noun: '饼干',
      unit: '块',
      mode: 'missingMinuend',
      build: (removed, left) => {
        const original = removed + left;
        return {
          answer: original,
          story: `盘子里原来有一些饼干，橙橙吃掉 ${removed} 块后，还剩 ${left} 块，`,
          question: '盘子里原来有多少块饼干？',
          equationParts: ['?', '-', removed, '=', left],
          readEquation: `几减 ${spokenNumber(removed)} 等于 ${spokenNumber(left)}？`,
          intent: 'missing-minuend'
        };
      }
    },
    {
      scene: 'bedroom',
      noun: '星星贴纸',
      unit: '张',
      mode: 'missingSubtrahend',
      build: (original, removed) => {
        const left = original - removed;
        return {
          answer: removed,
          story: `蓝蓝有 ${original} 张星星贴纸，贴到本子上一些后，还剩 ${left} 张，`,
          question: '蓝蓝贴到本子上多少张星星贴纸？',
          equationParts: [original, '-', '?', '=', left],
          readEquation: `${spokenNumber(original)} 减几等于 ${spokenNumber(left)}？`,
          intent: 'missing-subtrahend'
        };
      }
    }
  ];

  const TWO_STEP_TEMPLATES = [
    {
      scene: 'backyard',
      noun: '气球',
      unit: '个',
      mode: 'twoStepAddSubtract',
      build: (a, b, c) => ({
        answer: a + b - c,
        story: `后院先挂着 ${a} 个气球，爸爸又吹好 ${b} 个，后来飞走 ${c} 个，`,
        question: '后院现在还剩多少个气球？',
        equationParts: [a, '+', b, '-', c, '='],
        readEquation: `${spokenNumber(a)} 加 ${spokenNumber(b)} 再减 ${spokenNumber(c)} 等于多少？`,
        intent: 'two-step-result'
      })
    },
    {
      scene: 'kitchen',
      noun: '饼干',
      unit: '块',
      mode: 'twoStepSubtractAdd',
      build: (a, b, c) => ({
        answer: a - b + c,
        story: `盘子里有 ${a} 块饼干，橙橙吃掉 ${b} 块，妈妈又放上 ${c} 块，`,
        question: '盘子里现在有多少块饼干？',
        equationParts: [a, '-', b, '+', c, '='],
        readEquation: `${spokenNumber(a)} 减 ${spokenNumber(b)} 再加 ${spokenNumber(c)} 等于多少？`,
        intent: 'two-step-result'
      })
    }
  ];

  function randInt(min, max, rand) {
    const r = typeof rand === 'function' ? rand() : Math.random();
    return Math.floor(Math.max(0, Math.min(0.999999, r)) * (max - min + 1)) + min;
  }

  function pick(list, index) {
    return list[Math.max(0, Math.min(list.length - 1, index || 0))];
  }

  function spokenNumber(n) {
    return String(n);
  }

  function makeQuestionFromTemplate(mode, opts) {
    const options = opts || {};
    const list = TEMPLATES[mode];
    if (!list) throw new Error(`Unknown story mode: ${mode}`);
    const t = pick(list, options.templateIndex || 0);
    let a = Math.floor(Number(options.a) || 0);
    let b = Math.floor(Number(options.b) || 0);
    if ((mode === 'subtraction' || mode === 'compare') && b > a) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    const answer = mode === 'addition' ? a + b : a - b;
    const op = mode === 'addition' ? '+' : '-';
    const intent = mode === 'addition' ? 'total' : (mode === 'compare' ? 'difference' : 'remaining');
    const readOp = op === '+' ? '加' : '减';
    return {
      a,
      b,
      op,
      answer,
      type: mode === 'compare' ? 'compare' : 'basic',
      mode,
      intent,
      scene: t.scene,
      noun: t.noun,
      unit: t.unit,
      story: t.story(a, b),
      question: t.question,
      tag: t.scene,
      equationParts: [a, op, b, '='],
      readEquation: `${spokenNumber(a)} ${readOp} ${spokenNumber(b)} 等于多少？`
    };
  }

  function makeMissingQuestion(opts) {
    const options = opts || {};
    const t = pick(MISSING_TEMPLATES, options.templateIndex || 0);
    let a = Math.floor(Number(options.a) || 0);
    let b = Math.floor(Number(options.b) || 0);
    if (a < 1) a = 1;
    if (b < 1) b = 1;
    if (t.mode === 'missingSubtrahend' && b > a) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    const built = t.build(a, b);
    return {
      a,
      b,
      op: built.equationParts[1],
      type: 'missing',
      mode: t.mode,
      scene: t.scene,
      noun: t.noun,
      unit: t.unit,
      tag: t.scene,
      ...built
    };
  }

  function makeTwoStepQuestion(opts) {
    const options = opts || {};
    const t = pick(TWO_STEP_TEMPLATES, options.templateIndex || 0);
    let a = Math.floor(Number(options.a) || 0);
    let b = Math.floor(Number(options.b) || 0);
    let c = Math.floor(Number(options.c) || 0);
    if (a < 2) a = 2;
    if (b < 1) b = 1;
    if (c < 1) c = 1;
    if (t.mode === 'twoStepAddSubtract' && c >= a + b) c = Math.max(1, a + b - 1);
    if (t.mode === 'twoStepSubtractAdd' && b >= a) b = Math.max(1, a - 1);
    const built = t.build(a, b, c);
    return {
      a,
      b,
      c,
      op: t.mode === 'twoStepAddSubtract' ? '+-' : '-+',
      type: 'twoStep',
      mode: t.mode,
      scene: t.scene,
      noun: t.noun,
      unit: t.unit,
      tag: t.scene,
      ...built
    };
  }

  function expectedAnswer(q) {
    if (q.mode === 'addition') return q.a + q.b;
    if (q.mode === 'subtraction' || q.mode === 'compare') return q.a - q.b;
    if (q.mode === 'missingAddend') return q.equationParts[4] - q.equationParts[0];
    if (q.mode === 'missingMinuend') return q.equationParts[2] + q.equationParts[4];
    if (q.mode === 'missingSubtrahend') return q.equationParts[0] - q.equationParts[4];
    if (q.mode === 'twoStepAddSubtract') return q.a + q.b - q.c;
    if (q.mode === 'twoStepSubtractAdd') return q.a - q.b + q.c;
    return null;
  }

  function validateQuestion(q) {
    if (!q || typeof q !== 'object') return { ok: false, reason: 'missing-question' };
    if (!Number.isInteger(q.answer) || q.answer < 0) return { ok: false, reason: 'bad-answer' };
    if (!Array.isArray(q.equationParts) || q.equationParts.length < 4) return { ok: false, reason: 'bad-equation-parts' };
    if (!q.story || !q.question || !q.readEquation) return { ok: false, reason: 'missing-text' };
    if (!q.noun || !q.unit) return { ok: false, reason: 'missing-unit' };
    if (q.mode === 'addition' && q.intent !== 'total') return { ok: false, reason: 'addition-intent-mismatch' };
    if (q.mode === 'subtraction' && q.intent !== 'remaining') return { ok: false, reason: 'subtraction-intent-mismatch' };
    if (q.mode === 'compare' && q.intent !== 'difference') return { ok: false, reason: 'compare-intent-mismatch' };
    if (q.type === 'missing' && !q.equationParts.includes('?')) return { ok: false, reason: 'missing-question-without-unknown' };
    if (q.mode === 'missingAddend' && q.intent !== 'missing-addend') return { ok: false, reason: 'missing-addend-intent-mismatch' };
    if (q.mode === 'missingMinuend' && q.intent !== 'missing-minuend') return { ok: false, reason: 'missing-minuend-intent-mismatch' };
    if (q.mode === 'missingSubtrahend' && q.intent !== 'missing-subtrahend') return { ok: false, reason: 'missing-subtrahend-intent-mismatch' };
    if (q.type === 'twoStep' && q.equationParts.filter(part => part === '+' || part === '-').length !== 2) return { ok: false, reason: 'two-step-operation-count' };
    if ((q.mode === 'twoStepAddSubtract' || q.mode === 'twoStepSubtractAdd') && q.intent !== 'two-step-result') return { ok: false, reason: 'two-step-intent-mismatch' };
    const expected = expectedAnswer(q);
    if (expected !== null && q.answer !== expected) return { ok: false, reason: 'answer-mismatch' };
    return { ok: true };
  }

  function generateQuestion(options) {
    const opts = options || {};
    const rand = opts.rand || Math.random;
    const type = opts.type || 'basic';
    if (type === 'compare') {
      return makeQuestionFromTemplate('compare', {
        a: randInt(9, 20, rand),
        b: randInt(1, 8, rand),
        templateIndex: randInt(0, TEMPLATES.compare.length - 1, rand)
      });
    }
    if (type === 'missing') {
      return makeMissingQuestion({
        a: randInt(3, 9, rand),
        b: randInt(3, 9, rand),
        templateIndex: randInt(0, MISSING_TEMPLATES.length - 1, rand)
      });
    }
    if (type === 'twoStep') {
      return makeTwoStepQuestion({
        a: randInt(6, 14, rand),
        b: randInt(1, 8, rand),
        c: randInt(1, 7, rand),
        templateIndex: randInt(0, TWO_STEP_TEMPLATES.length - 1, rand)
      });
    }
    const mode = rand() < 0.55 ? 'addition' : 'subtraction';
    return makeQuestionFromTemplate(mode, {
      a: type === 'carryBorrow' ? randInt(6, 18, rand) : randInt(2, 10, rand),
      b: type === 'carryBorrow' ? randInt(2, 9, rand) : randInt(1, 9, rand),
      templateIndex: randInt(0, TEMPLATES[mode].length - 1, rand)
    });
  }

  return {
    SCENES,
    TEMPLATES,
    makeQuestionFromTemplate,
    makeMissingQuestion,
    makeTwoStepQuestion,
    validateQuestion,
    generateQuestion
  };
});
