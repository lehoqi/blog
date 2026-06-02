const test = require('node:test');
const assert = require('node:assert/strict');
const Garage = require('../../garage.js');
const Storage = require('../scripts/storage.js');

function memoryStore() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

test('records use the legacy dino_math_records key and preserve records', () => {
  const store = memoryStore();
  const record = { player: 'lele', score: 5, total: 5, stars: 5, tagScores: { police: 2 } };
  Storage.saveRecord(record, store);
  assert.deepEqual(Storage.loadRecords(store), [record]);
  assert.deepEqual(Storage.recordsForPlayer('lele', store), [record]);
  assert.deepEqual(Storage.recordsForPlayer('haohao', store), []);
});

test('garage state uses Garage.normalize and persists coins', () => {
  const store = memoryStore();
  const initial = Storage.getPlayerGarage('lele', 12, store);
  assert.equal(initial.coins, 12);
  assert.equal(initial.equippedVehicle, 'police');
  const updated = Storage.addCoins('lele', 8, store);
  assert.equal(updated.coins, 20);
  assert.equal(Storage.getPlayerGarage('lele', 999, store).coins, 20);
});

test('garage unlock and equip persist through legacy garage key', () => {
  const store = memoryStore();
  let garage = Storage.getPlayerGarage('lele', 60, store);
  garage = Garage.unlock(garage, 'rocket');
  Storage.setPlayerGarage('lele', garage, store);
  garage = Garage.equip(Storage.getPlayerGarage('lele', 0, store), 'rocket');
  Storage.setPlayerGarage('lele', garage, store);
  const loaded = Storage.getPlayerGarage('lele', 0, store);
  assert.equal(loaded.equippedVehicle, 'rocket');
  assert.ok(loaded.owned.includes('rocket'));
});
