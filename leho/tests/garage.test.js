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

test('economy constants', () => {
  assert.equal(G.COIN_PER_CORRECT, 2);
  assert.equal(G.PERFECT_BONUS, 5);
});

test('roundCoins: per-correct + perfect bonus only when all correct', () => {
  assert.equal(G.roundCoins(0, 5), 0);
  assert.equal(G.roundCoins(3, 5), 6);
  assert.equal(G.roundCoins(5, 5), 15);
  assert.equal(G.roundCoins(5, 0), 0);
  assert.equal(G.roundCoins(2, 2), 4 + 5);
});

test('roundCoins: impossible correct>total does not grant perfect bonus', () => {
  assert.equal(G.roundCoins(6, 5), 15);   // clamped to 5/5 -> 10 + 5
  assert.equal(G.roundCoins(9, 0), 0);    // zero-total still 0
});

function freshLele(coins) {
  const e = G.initEntry('lele', 0);
  e.coins = coins;
  return e;
}

test('owns / isEquipped', () => {
  const e = freshLele(0);
  assert.equal(G.owns(e, 'police'), true);
  assert.equal(G.owns(e, 'rocket'), false);
  assert.equal(G.isEquipped(e, 'police'), true);
  assert.equal(G.isEquipped(e, 'brontosaurus'), true);
  assert.equal(G.isEquipped(e, 'rocket'), false);
});

test('canAfford boundary: equal price counts as affordable', () => {
  assert.equal(G.canAfford(freshLele(39), 'rocket'), false);
  assert.equal(G.canAfford(freshLele(40), 'rocket'), true);
  assert.equal(G.canAfford(freshLele(99), 'rocket'), true);
});

test('unlock: returns NEW entry, deducts, adds owned; null on bad input', () => {
  const e = freshLele(40);
  const u = G.unlock(e, 'rocket');
  assert.equal(u.coins, 0);
  assert.ok(u.owned.includes('rocket'));
  assert.equal(e.coins, 40);
  assert.ok(!e.owned.includes('rocket'));
  assert.equal(G.unlock(freshLele(39), 'rocket'), null);
  assert.equal(G.unlock(freshLele(40), 'police'), null);
  assert.equal(G.unlock(freshLele(40), 'bogus'), null);
});

test('equip: sets slot by kind, requires owned, returns NEW entry; null otherwise', () => {
  let e = freshLele(40);
  e = G.unlock(e, 'rocket');
  const eq = G.equip(e, 'rocket');
  assert.equal(eq.equippedVehicle, 'rocket');
  assert.equal(eq.equippedDino, 'brontosaurus');
  assert.equal(e.equippedVehicle, 'police');
  assert.equal(G.equip(freshLele(0), 'rocket'), null);
  const ed = G.equip(freshLele(0), 'brontosaurus');
  assert.equal(ed.equippedDino, 'brontosaurus');
  assert.equal(G.equip(freshLele(0), 'bogus'), null);
});
