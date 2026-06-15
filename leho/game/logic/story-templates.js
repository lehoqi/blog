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

  function validateQuestion(q) {
    if (!q || typeof q !== 'object') return { ok: false, reason: 'missing-question' };
    if (!Number.isInteger(q.answer) || q.answer < 0) return { ok: false, reason: 'bad-answer' };
    if (!Array.isArray(q.equationParts) || q.equationParts.length < 4) return { ok: false, reason: 'bad-equation-parts' };
    if (!q.story || !q.question || !q.readEquation) return { ok: false, reason: 'missing-text' };
    if (!q.noun || !q.unit) return { ok: false, reason: 'missing-unit' };
    if (q.mode === 'addition' && q.intent !== 'total') return { ok: false, reason: 'addition-intent-mismatch' };
    if (q.mode === 'subtraction' && q.intent !== 'remaining') return { ok: false, reason: 'subtraction-intent-mismatch' };
    if (q.mode === 'compare' && q.intent !== 'difference') return { ok: false, reason: 'compare-intent-mismatch' };
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
      return makeQuestionFromTemplate('addition', {
        a: randInt(3, 9, rand),
        b: randInt(3, 9, rand),
        templateIndex: randInt(0, TEMPLATES.addition.length - 1, rand)
      });
    }
    if (type === 'twoStep') {
      return makeQuestionFromTemplate('subtraction', {
        a: randInt(10, 20, rand),
        b: randInt(1, 9, rand),
        templateIndex: randInt(0, TEMPLATES.subtraction.length - 1, rand)
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
    validateQuestion,
    generateQuestion
  };
});
