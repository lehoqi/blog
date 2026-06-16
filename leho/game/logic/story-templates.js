'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StoryTemplates = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCENES = ['livingRoom', 'backyard', 'park', 'kitchen', 'bedroom'];
  const FAMILY_SCENES = {
    police: 'livingRoom',
    ambulance: 'backyard',
    fire: 'kitchen',
    everyday: 'park',
    adventure: 'bedroom',
    livingRoom: 'livingRoom',
    backyard: 'backyard',
    park: 'park',
    kitchen: 'kitchen',
    bedroom: 'bedroom'
  };

  const TEMPLATES = {
    addition: [
      {
        scene: 'livingRoom',
        noun: '工程砖',
        unit: '块',
        story: (a, b) => `工地上先有 ${a} 块工程砖，吊车又吊来 ${b} 块，`,
        question: '工地现在一共有多少块工程砖？'
      },
      {
        scene: 'backyard',
        noun: '赛车小旗',
        unit: '面',
        story: (a, b) => `赛车道边先插了 ${a} 面赛车小旗，宾果又插上 ${b} 面，`,
        question: '赛道边现在一共有多少面赛车小旗？'
      },
      {
        scene: 'kitchen',
        noun: '能量电池',
        unit: '节',
        story: (a, b) => `机器人能量站有 ${a} 节能量电池，布鲁伊又装上 ${b} 节，`,
        question: '机器人能量站现在有多少节能量电池？'
      },
      {
        scene: 'park',
        noun: '化石碎片',
        unit: '块',
        story: (a, b) => `恐龙化石坑里有 ${a} 块化石碎片，宾果又挖出 ${b} 块，`,
        question: '恐龙化石坑里一共有多少块化石碎片？'
      },
      {
        scene: 'bedroom',
        noun: '燃料星',
        unit: '颗',
        story: (a, b) => `火箭基地点亮 ${a} 颗燃料星，布鲁伊又点亮 ${b} 颗，`,
        question: '火箭基地一共有多少颗燃料星？'
      }
    ],
    subtraction: [
      {
        scene: 'livingRoom',
        noun: '工程砖',
        unit: '块',
        story: (a, b) => `工地上有 ${a} 块工程砖，推土机运走 ${b} 块，`,
        question: '工地还剩多少块工程砖？'
      },
      {
        scene: 'backyard',
        noun: '赛车小旗',
        unit: '面',
        story: (a, b) => `赛道边有 ${a} 面赛车小旗，比赛后收走 ${b} 面，`,
        question: '赛道边还剩多少面赛车小旗？'
      },
      {
        scene: 'kitchen',
        noun: '能量电池',
        unit: '节',
        story: (a, b) => `机器人能量站有 ${a} 节能量电池，机器人用掉 ${b} 节，`,
        question: '能量站还剩多少节能量电池？'
      },
      {
        scene: 'park',
        noun: '恐龙脚印',
        unit: '颗',
        story: (a, b) => `恐龙草地上有 ${a} 颗恐龙脚印，被沙土盖住 ${b} 颗，`,
        question: '恐龙草地上还剩多少颗恐龙脚印？'
      },
      {
        scene: 'bedroom',
        noun: '燃料星',
        unit: '颗',
        story: (a, b) => `火箭基地亮着 ${a} 颗燃料星，发射前关闭 ${b} 颗，`,
        question: '火箭基地还剩多少颗燃料星？'
      }
    ],
    compare: [
      {
        scene: 'park',
        noun: '恐龙脚印',
        unit: '颗',
        story: (a, b) => `布鲁伊发现 ${a} 颗恐龙脚印，宾果发现 ${b} 颗恐龙脚印，`,
        question: '布鲁伊比宾果多多少颗恐龙脚印？'
      },
      {
        scene: 'bedroom',
        noun: '火箭徽章',
        unit: '枚',
        story: (a, b) => `布鲁伊拿到 ${a} 枚火箭徽章，宾果拿到 ${b} 枚火箭徽章，`,
        question: '布鲁伊比宾果多多少枚火箭徽章？'
      }
    ]
  };

  const MISSING_TEMPLATES = [
    {
      scene: 'livingRoom',
      noun: '工程砖',
      unit: '块',
      mode: 'missingAddend',
      build: (a, b) => {
        const total = a + b;
        return {
          answer: b,
          story: `工程车先运来 ${a} 块工程砖，吊车又吊来一些，合起来是 ${total} 块，`,
          question: '吊车又吊来多少块工程砖？',
          equationParts: [a, '+', '?', '=', total],
          readEquation: `${spokenNumber(a)} 加几等于 ${spokenNumber(total)}？`,
          intent: 'missing-addend'
        };
      }
    },
    {
      scene: 'kitchen',
      noun: '能量电池',
      unit: '节',
      mode: 'missingMinuend',
      build: (removed, left) => {
        const original = removed + left;
        return {
          answer: original,
          story: `机器人能量站原来有一些能量电池，机器人用掉 ${removed} 节后，还剩 ${left} 节，`,
          question: '能量站原来有多少节能量电池？',
          equationParts: ['?', '-', removed, '=', left],
          readEquation: `几减 ${spokenNumber(removed)} 等于 ${spokenNumber(left)}？`,
          intent: 'missing-minuend'
        };
      }
    },
    {
      scene: 'bedroom',
      noun: '燃料星',
      unit: '颗',
      mode: 'missingSubtrahend',
      build: (original, removed) => {
        const left = original - removed;
        return {
          answer: removed,
          story: `火箭基地有 ${original} 颗燃料星，发射前用掉一些后，还剩 ${left} 颗，`,
          question: '火箭发射前用掉多少颗燃料星？',
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
      noun: '赛车小旗',
      unit: '面',
      mode: 'twoStepAddSubtract',
      build: (a, b, c) => ({
        answer: a + b - c,
        story: `赛道边先有 ${a} 面赛车小旗，布鲁伊又插上 ${b} 面，后来收走 ${c} 面，`,
        question: '赛道边现在还剩多少面赛车小旗？',
        equationParts: [a, '+', b, '-', c, '='],
        readEquation: `${spokenNumber(a)} 加 ${spokenNumber(b)} 再减 ${spokenNumber(c)} 等于多少？`,
        intent: 'two-step-result'
      })
    },
    {
      scene: 'kitchen',
      noun: '能量电池',
      unit: '节',
      mode: 'twoStepSubtractAdd',
      build: (a, b, c) => ({
        answer: a - b + c,
        story: `机器人能量站有 ${a} 节能量电池，机器人用掉 ${b} 节，布鲁伊又装上 ${c} 节，`,
        question: '机器人能量站现在有多少节能量电池？',
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

  function sceneForFamily(family) {
    return FAMILY_SCENES[family] || null;
  }

  function tagForFamily(family, scene) {
    if (family && FAMILY_SCENES[family] && SCENES.indexOf(family) === -1) return family;
    return scene;
  }

  function templateIndexForScene(list, scene, rand) {
    if (!scene) return randInt(0, list.length - 1, rand);
    const matches = [];
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].scene === scene) matches.push(i);
    }
    if (!matches.length) return randInt(0, list.length - 1, rand);
    return matches[randInt(0, matches.length - 1, rand)];
  }

  function withFamilyTag(q, family) {
    return { ...q, tag: tagForFamily(family, q.scene) };
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
    if (t.mode === 'twoStepAddSubtract' && a + b - c > 20) c = a + b - 20;
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
    const preferredScene = sceneForFamily(opts.family);
    if (type === 'compare') {
      return withFamilyTag(makeQuestionFromTemplate('compare', {
        a: randInt(9, 20, rand),
        b: randInt(1, 8, rand),
        templateIndex: templateIndexForScene(TEMPLATES.compare, preferredScene, rand)
      }), opts.family);
    }
    if (type === 'missing') {
      return withFamilyTag(makeMissingQuestion({
        a: randInt(3, 9, rand),
        b: randInt(3, 9, rand),
        templateIndex: templateIndexForScene(MISSING_TEMPLATES, preferredScene, rand)
      }), opts.family);
    }
    if (type === 'twoStep') {
      return withFamilyTag(makeTwoStepQuestion({
        a: randInt(6, 14, rand),
        b: randInt(1, 8, rand),
        c: randInt(1, 7, rand),
        templateIndex: templateIndexForScene(TWO_STEP_TEMPLATES, preferredScene, rand)
      }), opts.family);
    }
    const mode = rand() < 0.55 ? 'addition' : 'subtraction';
    if (type === 'carryBorrow') {
      if (mode === 'addition') {
        const a = randInt(6, 9, rand);
        return withFamilyTag(makeQuestionFromTemplate('addition', {
          a,
          b: randInt(11 - a, 9, rand),
          templateIndex: templateIndexForScene(TEMPLATES.addition, preferredScene, rand)
        }), opts.family);
      }
      const a = randInt(11, 18, rand);
      return withFamilyTag(makeQuestionFromTemplate('subtraction', {
        a,
        b: randInt((a % 10) + 1, 9, rand),
        templateIndex: templateIndexForScene(TEMPLATES.subtraction, preferredScene, rand)
      }), opts.family);
    }
    return withFamilyTag(makeQuestionFromTemplate(mode, {
      a: randInt(2, 10, rand),
      b: randInt(1, 9, rand),
      templateIndex: templateIndexForScene(TEMPLATES[mode], preferredScene, rand)
    }), opts.family);
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
