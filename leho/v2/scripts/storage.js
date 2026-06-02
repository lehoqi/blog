(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../garage.js'));
  } else {
    root.V2Storage = factory(root.Garage);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Garage) {
  'use strict';

  const RECORDS_KEY = 'dino_math_records';
  const GARAGE_KEY = 'dino_math_garage';
  const NAMES_KEY = 'dino_math_names';
  const DEFAULT_NAMES = { lele: '乐乐', haohao: '昊昊' };

  function storeOf(store) {
    if (store) return store;
    if (typeof localStorage !== 'undefined') return localStorage;
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }

  function readJson(key, fallback, store) {
    try {
      const raw = storeOf(store).getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value, store) {
    storeOf(store).setItem(key, JSON.stringify(value));
  }

  function loadNames(store) {
    const raw = readJson(NAMES_KEY, {}, store);
    return { ...DEFAULT_NAMES, ...(raw && typeof raw === 'object' ? raw : {}) };
  }

  function loadRecords(store) {
    const records = readJson(RECORDS_KEY, [], store);
    return Array.isArray(records) ? records : [];
  }

  function saveRecord(record, store) {
    const records = loadRecords(store);
    records.push(record);
    writeJson(RECORDS_KEY, records, store);
    return records;
  }

  function recordsForPlayer(playerId, store) {
    return loadRecords(store).filter(record => record && record.player === playerId);
  }

  function loadGarageRaw(store) {
    const raw = readJson(GARAGE_KEY, {}, store);
    return raw && typeof raw === 'object' ? raw : {};
  }

  function saveGarageRaw(raw, store) {
    writeJson(GARAGE_KEY, raw, store);
  }

  function priorTotalScore(playerId, store) {
    return recordsForPlayer(playerId, store).reduce((sum, record) => sum + (Number(record.score) || 0), 0);
  }

  function getPlayerGarage(playerId, priorScore, store) {
    const raw = loadGarageRaw(store);
    const score = priorScore == null ? priorTotalScore(playerId, store) : priorScore;
    const normalized = Garage.normalize(raw[playerId], playerId, score);
    raw[playerId] = normalized;
    saveGarageRaw(raw, store);
    return normalized;
  }

  function setPlayerGarage(playerId, entry, store) {
    const raw = loadGarageRaw(store);
    raw[playerId] = Garage.normalize(entry, playerId, priorTotalScore(playerId, store));
    saveGarageRaw(raw, store);
    return raw[playerId];
  }

  function addCoins(playerId, amount, store) {
    const current = getPlayerGarage(playerId, null, store);
    const next = { ...current, coins: Math.max(0, current.coins + Math.floor(Number(amount) || 0)) };
    return setPlayerGarage(playerId, next, store);
  }

  return {
    RECORDS_KEY,
    GARAGE_KEY,
    NAMES_KEY,
    DEFAULT_NAMES,
    loadNames,
    loadRecords,
    saveRecord,
    recordsForPlayer,
    getPlayerGarage,
    setPlayerGarage,
    addCoins
  };
});
