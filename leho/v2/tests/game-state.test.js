const test = require('node:test');
const assert = require('node:assert/strict');
const GameState = require('../scripts/game-state.js');

const questions = [
  { answer: 3, type: 'basic' },
  { answer: 11, type: 'carryBorrow' },
  { answer: 6, type: 'missing' },
  { answer: 4, type: 'compare' },
  { answer: 12, type: 'twoStep' }
];

test('createRound initializes five-question playable state', () => {
  const state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  assert.equal(state.playerId, 'lele');
  assert.equal(state.currentIndex, 0);
  assert.equal(state.score, 0);
  assert.equal(state.correctStreak, 0);
  assert.equal(state.status, 'playing');
  assert.equal(state.questions.length, 5);
});

test('correct submit advances score and locks question once', () => {
  let state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  const result = GameState.submitAnswer(state, '3');
  assert.equal(result.kind, 'correct');
  state = result.state;
  assert.equal(state.score, 1);
  assert.equal(state.correctByIndex[0], true);
  assert.equal(state.correctStreak, 1);
  assert.equal(state.tagScores.general, 1);
  const duplicate = GameState.submitAnswer(state, '3');
  assert.equal(duplicate.kind, 'already-settled');
});

test('wrong submits reset streak but keep round playable', () => {
  let state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  let result = GameState.submitAnswer(state, '2');
  assert.equal(result.kind, 'wrong');
  assert.equal(result.state.wrongCounts[0], 1);
  assert.equal(result.message, '再想想！');
  result = GameState.submitAnswer(result.state, '1');
  assert.equal(result.kind, 'wrong');
  assert.match(result.message, /答案在 0 到 6 之间/);
  result = GameState.submitAnswer(result.state, '9');
  assert.equal(result.kind, 'wrong');
  assert.match(result.message, /正确答案是 3/);
});

test('advance moves to completed after final settled question', () => {
  let state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  for (const answer of ['3', '11', '6', '4', '12']) {
    const result = GameState.submitAnswer(state, answer);
    state = GameState.advanceAfterCorrect(result.state);
  }
  assert.equal(state.status, 'completed');
  assert.equal(state.currentIndex, 5);
  assert.equal(state.score, 5);
});
