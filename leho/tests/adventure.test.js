const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../adventure.js');

test('themes cover every vehicle family with required non-text gameplay fields', () => {
  const ids = ['police', 'ambulance', 'fire', 'everyday', 'adventure'];
  assert.deepEqual(Object.keys(A.THEMES).sort(), ids.sort());
  for (const id of ids) {
    const t = A.getTheme(id);
    assert.equal(t.id, id);
    assert.ok(t.name);
    assert.ok(t.mapEmoji);
    assert.ok(t.bossEmoji);
    assert.ok(t.bossName);
    assert.ok(Array.isArray(t.introLines) && t.introLines.length >= 1);
    assert.ok(Array.isArray(t.stepLines) && t.stepLines.length >= 4);
    assert.ok(t.bossLine);
    assert.ok(t.victoryLine);
    assert.ok(t.fallbackColor);
  }
});

test('getTheme falls back safely for unknown values', () => {
  assert.equal(A.getTheme('bogus').id, 'adventure');
  assert.equal(A.getTheme(undefined).id, 'adventure');
  assert.equal(A.getTheme(null).id, 'adventure');
});

test('createRun initializes five unsettled questions', () => {
  const run = A.createRun('fire', 5);
  assert.equal(run.family, 'fire');
  assert.equal(run.step, 0);
  assert.equal(run.bossShown, false);
  assert.equal(run.completed, false);
  assert.equal(run.advancing, false);
  assert.deepEqual(run.settledQuestions, [false, false, false, false, false]);
});

test('beginSettle locks a question exactly once', () => {
  const run = A.createRun('police', 5);
  const first = A.beginSettle(run, 0);
  assert.equal(first.ok, true);
  assert.equal(first.run.advancing, true);
  assert.equal(first.run.settledQuestions[0], true);
  const second = A.beginSettle(first.run, 0);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'already-settled');
});

test('finishStep advances through normal steps and final completion', () => {
  let run = A.createRun('ambulance', 5);
  let locked = A.beginSettle(run, 0).run;
  run = A.finishStep(locked, 0);
  assert.equal(run.step, 1);
  assert.equal(run.advancing, false);
  assert.equal(run.completed, false);

  locked = A.beginSettle(run, 4).run;
  run = A.finishStep(locked, 4);
  assert.equal(run.step, 5);
  assert.equal(run.advancing, false);
  assert.equal(run.completed, true);
});

test('shouldShowBoss returns true only once for final question', () => {
  let run = A.createRun('fire', 5);
  assert.equal(A.shouldShowBoss(run, 3), false);
  assert.equal(A.shouldShowBoss(run, 4), true);
  run = A.markBossShown(run);
  assert.equal(run.bossShown, true);
  assert.equal(A.shouldShowBoss(run, 4), false);
});
