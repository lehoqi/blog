(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./questions.js'));
  } else {
    root.V2GameState = factory(root.V2Questions);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Questions) {
  'use strict';

  function createRound(input) {
    const questions = Array.isArray(input.questions) ? input.questions.slice() : [];
    return {
      playerId: input.playerId || 'lele',
      family: input.family || 'adventure',
      questions,
      currentIndex: 0,
      score: 0,
      correctStreak: 0,
      correctByIndex: {},
      wrongCounts: {},
      settledByIndex: {},
      tagScores: { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 },
      status: 'playing'
    };
  }

  function clone(state) {
    return {
      ...state,
      questions: state.questions.slice(),
      correctByIndex: { ...state.correctByIndex },
      wrongCounts: { ...state.wrongCounts },
      settledByIndex: { ...state.settledByIndex },
      tagScores: { ...state.tagScores }
    };
  }

  function currentQuestion(state) {
    return state.questions[state.currentIndex] || null;
  }

  function submitAnswer(state, answerText) {
    if (!state || state.status !== 'playing') return { kind: 'not-playing', state };
    const index = state.currentIndex;
    if (state.settledByIndex[index]) return { kind: 'already-settled', state };
    const question = currentQuestion(state);
    if (!question) return { kind: 'missing-question', state };
    const value = parseInt(answerText, 10);
    const next = clone(state);
    if (value === question.answer) {
      next.score += 1;
      next.correctStreak += 1;
      next.correctByIndex[index] = true;
      next.settledByIndex[index] = true;
      const tag = question.tag || 'general';
      next.tagScores[tag] = (next.tagScores[tag] || 0) + 1;
      return { kind: 'correct', state: next, question, streak: next.correctStreak };
    }
    const wrong = (next.wrongCounts[index] || 0) + 1;
    next.wrongCounts[index] = wrong;
    next.correctStreak = 0;
    let message = '再想想！';
    if (wrong === 2) {
      const range = Questions.answerHintRange(question);
      message = `答案在 ${range.min} 到 ${range.max} 之间哦！`;
    }
    if (wrong >= 3) message = `正确答案是 ${question.answer}，再试一次！`;
    return { kind: 'wrong', state: next, question, message };
  }

  function advanceAfterCorrect(state) {
    const next = clone(state);
    next.currentIndex += 1;
    if (next.currentIndex >= next.questions.length) next.status = 'completed';
    return next;
  }

  return { createRound, currentQuestion, submitAnswer, advanceAfterCorrect };
});
