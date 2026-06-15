(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuestionMix = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const QUESTION_TYPES = ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep'];
  const QUESTION_TYPE_WEIGHTS = [
    { type: 'basic', weight: 1 },
    { type: 'carryBorrow', weight: 2 },
    { type: 'missing', weight: 1 },
    { type: 'compare', weight: 1 },
    { type: 'twoStep', weight: 0.5 }
  ];

  const QUESTION_TYPE_LABELS = {
    basic: '热身题',
    carryBorrow: '进退位题',
    missing: '缺数题',
    compare: '比较题',
    twoStep: '两步题'
  };

  function isKnownType(type) {
    return QUESTION_TYPES.indexOf(type) !== -1;
  }

  function emptyTypeStats() {
    const stats = {};
    QUESTION_TYPES.forEach(type => {
      stats[type] = { total: 0, correct: 0 };
    });
    return stats;
  }

  function chooseQuestionType(rand) {
    const nextRandom = typeof rand === 'function' ? rand : Math.random;
    const totalWeight = QUESTION_TYPE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.max(0, Math.min(0.999999999, nextRandom())) * totalWeight;
    for (const item of QUESTION_TYPE_WEIGHTS) {
      if (roll < item.weight) return item.type;
      roll -= item.weight;
    }
    return QUESTION_TYPE_WEIGHTS[QUESTION_TYPE_WEIGHTS.length - 1].type;
  }

  function buildRoundTypeStats(questions, correctnessByIndex) {
    const stats = emptyTypeStats();
    if (!Array.isArray(questions)) return stats;
    questions.forEach((q, index) => {
      const type = q && isKnownType(q.type) ? q.type : 'basic';
      stats[type].total += 1;
      if (correctnessByIndex && correctnessByIndex[index]) stats[type].correct += 1;
    });
    return stats;
  }

  function aggregateTypeStats(records) {
    const stats = emptyTypeStats();
    if (!Array.isArray(records)) return stats;
    records.forEach(record => {
      const source = record && record.questionTypeStats;
      if (!source || typeof source !== 'object') return;
      QUESTION_TYPES.forEach(type => {
        const item = source[type] || {};
        stats[type].total += Math.max(0, Math.floor(Number(item.total) || 0));
        stats[type].correct += Math.max(0, Math.floor(Number(item.correct) || 0));
      });
    });
    return stats;
  }

  function hasMixedPerfectRound(record) {
    if (!record || record.score !== record.total || !record.questionTypeStats) return false;
    const usedTypeCount = QUESTION_TYPES.reduce((count, type) => {
      const item = record.questionTypeStats[type] || {};
      return count + (Number(item.total) > 0 ? 1 : 0);
    }, 0);
    return usedTypeCount >= 3;
  }

  return {
    QUESTION_TYPES,
    QUESTION_TYPE_WEIGHTS,
    QUESTION_TYPE_LABELS,
    chooseQuestionType,
    buildRoundTypeStats,
    aggregateTypeStats,
    hasMixedPerfectRound
  };
});
