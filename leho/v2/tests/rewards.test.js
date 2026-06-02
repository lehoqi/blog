const test = require('node:test');
const assert = require('node:assert/strict');
const Garage = require('../../garage.js');
const Rewards = require('../scripts/rewards.js');

test('scoreToStars matches existing star thresholds for five-question rounds', () => {
  assert.equal(Rewards.scoreToStars(5, 5), 5);
  assert.equal(Rewards.scoreToStars(4, 5), 4);
  assert.equal(Rewards.scoreToStars(3, 5), 3);
  assert.equal(Rewards.scoreToStars(2, 5), 2);
  assert.equal(Rewards.scoreToStars(1, 5), 1);
  assert.equal(Rewards.scoreToStars(0, 5), 1);
});

test('round settlement uses Garage.roundCoins as the authority', () => {
  const settlement = Rewards.calculateRoundSettlement({
    playerId: 'lele',
    score: 5,
    total: 5,
    questions: [{ type: 'carryBorrow' }, { type: 'missing' }],
    correctByIndex: { 0: true, 1: true },
    previousRecords: []
  });
  assert.equal(settlement.coins, Garage.roundCoins(5, 5));
  assert.equal(settlement.stars, 5);
});

test('ability trophies sort before regular medals', () => {
  const awards = Rewards.sortUnlockedAwards([
    { id: 'stars_10', kind: 'medal', label: '10颗星星' },
    { id: 'trophy_compare', kind: 'trophy', label: '比较奖杯', source: 'round' },
    { id: 'first_unlock', kind: 'medal', label: '第一次解锁' },
    { id: 'trophy_mixed_perfect', kind: 'trophy', label: '全能奖杯', source: 'round' }
  ]);
  assert.deepEqual(awards.map(a => a.id), [
    'trophy_compare',
    'trophy_mixed_perfect',
    'first_unlock',
    'stars_10'
  ]);
});

test('ability highlights summarize current round strengths', () => {
  const highlights = Rewards.buildAbilityHighlights({
    carryBorrow: { total: 2, correct: 2 },
    missing: { total: 1, correct: 1 },
    compare: { total: 1, correct: 0 },
    twoStep: { total: 1, correct: 1 },
    basic: { total: 0, correct: 0 }
  });
  assert.deepEqual(highlights, ['进退位题全对', '缺数题全对', '完成两步题']);
});
