const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../garage.js');

test('CATALOG has unique ids and required fields', () => {
  const ids = new Set();
  for (const it of G.CATALOG) {
    assert.ok(it.id && !ids.has(it.id), `dup/missing id: ${it.id}`);
    ids.add(it.id);
    assert.ok(['vehicle', 'dino'].includes(it.kind), `bad kind: ${it.id}`);
    assert.ok(it.emoji && typeof it.emoji === 'string', `empty emoji: ${it.id}`);
    assert.ok(it.name && typeof it.name === 'string', `empty name: ${it.id}`);
    assert.ok(it.voiceName && typeof it.voiceName === 'string', `empty voiceName: ${it.id}`);
    assert.ok(Number.isInteger(it.price) && it.price > 0);
  }
});

test('CATALOG contents match spec §7', () => {
  assert.equal(G.CATALOG.length, 14);
  assert.equal(G.byKind('vehicle').length, 11);
  assert.equal(G.byKind('dino').length, 3);
  assert.equal(G.getItem('rocket').emoji, '🚀');
  assert.equal(G.getItem('rocket').price, 40);
  assert.equal(G.getItem('ufo').price, 60);
  assert.equal(G.getItem('police').emoji, '🚓');
  assert.equal(G.getItem('dragon').price, 35);
  assert.equal(G.getItem('nope'), undefined);
});

test('DEFAULTS per player', () => {
  assert.deepEqual(G.DEFAULTS.lele,   { vehicle:'police',    dino:'brontosaurus' });
  assert.deepEqual(G.DEFAULTS.haohao, { vehicle:'ambulance', dino:'trex' });
});

test('migrationCoins caps at 60, floors, never negative', () => {
  assert.equal(G.migrationCoins(0), 0);
  assert.equal(G.migrationCoins(12.9), 12);
  assert.equal(G.migrationCoins(100), 60);
  assert.equal(G.migrationCoins(undefined), 0);
  assert.equal(G.migrationCoins(-5), 0);
});

test('initEntry seeds defaults + migration coins + migrated flag', () => {
  const e = G.initEntry('lele', 30);
  assert.equal(e.coins, 30);
  assert.deepEqual(e.owned.sort(), ['brontosaurus', 'police']);
  assert.equal(e.equippedVehicle, 'police');
  assert.equal(e.equippedDino, 'brontosaurus');
  assert.equal(e.migrated, true);
});

test('normalize: missing/!migrated -> fresh init (migration once)', () => {
  assert.equal(G.normalize(null, 'haohao', 7).coins, 7);
  assert.equal(G.normalize(undefined, 'haohao', 7).equippedVehicle, 'ambulance');
  const kept = G.normalize({ coins:3, owned:['ambulance','trex'], equippedVehicle:'ambulance', equippedDino:'trex', migrated:true }, 'haohao', 999);
  assert.equal(kept.coins, 3);
});

test('normalize: repairs bad fields, keeps defaults owned, clamps coins', () => {
  const n = G.normalize({ coins:-9, owned:['rocket','bogus'], equippedVehicle:'rocket', equippedDino:'zzz', migrated:true }, 'lele', 0);
  assert.equal(n.coins, 0);
  assert.ok(n.owned.includes('police'));
  assert.ok(n.owned.includes('brontosaurus'));
  assert.ok(!n.owned.includes('bogus'));
  assert.equal(n.equippedVehicle, 'rocket');
  assert.equal(n.equippedDino, 'brontosaurus');
});

test('initEntry/normalize: unknown playerId falls back to lele defaults', () => {
  assert.equal(G.initEntry('nobody', 5).equippedVehicle, 'police');
  assert.equal(G.normalize({ migrated:true, coins:1, owned:['police'], equippedVehicle:'police', equippedDino:'brontosaurus' }, 'nobody', 0).equippedDino, 'brontosaurus');
});

test('normalize: non-object raw -> fresh init', () => {
  assert.equal(G.normalize([], 'haohao', 7).equippedVehicle, 'ambulance');
  assert.equal(G.normalize(42, 'haohao', 7).coins, 7);
});

test('normalize: dedupes corrupt duplicate owned ids', () => {
  const n = G.normalize({ migrated:true, coins:0, owned:['police','police','brontosaurus','brontosaurus'], equippedVehicle:'police', equippedDino:'brontosaurus' }, 'lele', 0);
  assert.equal(n.owned.filter(id => id === 'police').length, 1);
  assert.equal(n.owned.filter(id => id === 'brontosaurus').length, 1);
});
