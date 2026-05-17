const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../garage.js');

test('CATALOG has unique ids and required fields', () => {
  const ids = new Set();
  for (const it of G.CATALOG) {
    assert.ok(it.id && !ids.has(it.id), `dup/missing id: ${it.id}`);
    ids.add(it.id);
    assert.ok(['vehicle', 'dino'].includes(it.kind), `bad kind: ${it.id}`);
    assert.equal(typeof it.emoji, 'string');
    assert.equal(typeof it.name, 'string');
    assert.equal(typeof it.voiceName, 'string');
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
