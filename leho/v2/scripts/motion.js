(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.V2Motion = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MOTION_BUDGETS = {
    start: { maxMs: 900, reducedMaxMs: 300 },
    wrong: { maxMs: 600, reducedMaxMs: 250 },
    correct: { minMs: 900, maxMs: 1500, reducedMaxMs: 400 },
    combo: { minMs: 1200, maxMs: 1800, reducedMaxMs: 500 },
    finisher: { maxMs: 2200, reducedMaxMs: 700 },
    perfect: { infoMs: 500, maxMs: 2800, reducedMaxMs: 700 },
    shake: { maxMs: 180 }
  };

  function prefersReducedMotion() {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function particleLimit(viewport) {
    const width = viewport && Number(viewport.width) || 390;
    return width < 700 ? 35 : 80;
  }

  function comboTier(streak) {
    return Math.max(1, Math.min(5, Math.floor(Number(streak) || 1)));
  }

  function durationFor(name, reduced) {
    const budget = MOTION_BUDGETS[name] || MOTION_BUDGETS.correct;
    if (reduced && budget.reducedMaxMs) return budget.reducedMaxMs;
    return budget.maxMs || budget.minMs || 1;
  }

  function feedbackClassForQuestion(question) {
    const type = question && question.type;
    if (type === 'carryBorrow') return 'feedback-carryBorrow';
    if (type === 'missing') return 'feedback-missing';
    if (type === 'compare') return 'feedback-compare';
    if (type === 'twoStep') return 'feedback-twoStep';
    return 'feedback-basic';
  }

  function applyMotionClass(element, className, duration) {
    if (!element) return Promise.resolve();
    element.classList.add(className);
    const ms = Math.max(1, Math.floor(Number(duration) || 1));
    return new Promise(resolve => {
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, ms);
    });
  }

  return { MOTION_BUDGETS, prefersReducedMotion, particleLimit, comboTier, durationFor, feedbackClassForQuestion, applyMotionClass };
});
