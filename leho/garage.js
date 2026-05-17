'use strict';

var CATALOG = [
  { id:'police',       kind:'vehicle', emoji:'🚓', name:'警车',   voiceName:'警车',   price:15 },
  { id:'ambulance',    kind:'vehicle', emoji:'🚑', name:'救护车', voiceName:'救护车', price:15 },
  { id:'fire',         kind:'vehicle', emoji:'🚒', name:'消防车', voiceName:'消防车', price:15 },
  { id:'schoolbus',    kind:'vehicle', emoji:'🚌', name:'校车',   voiceName:'校车',   price:15 },
  { id:'taxi',         kind:'vehicle', emoji:'🚕', name:'出租车', voiceName:'出租车', price:20 },
  { id:'race',         kind:'vehicle', emoji:'🏎️', name:'赛车',   voiceName:'赛车',   price:25 },
  { id:'tractor',      kind:'vehicle', emoji:'🚜', name:'拖拉机', voiceName:'拖拉机', price:25 },
  { id:'heli',         kind:'vehicle', emoji:'🚁', name:'直升机', voiceName:'直升机', price:30 },
  { id:'train',        kind:'vehicle', emoji:'🚂', name:'火车',   voiceName:'火车',   price:30 },
  { id:'rocket',       kind:'vehicle', emoji:'🚀', name:'火箭',   voiceName:'火箭',   price:40 },
  { id:'ufo',          kind:'vehicle', emoji:'🛸', name:'飞碟',   voiceName:'飞碟',   price:60 },
  { id:'brontosaurus', kind:'dino',    emoji:'🦕', name:'长脖子龙', voiceName:'长脖子龙', price:15 },
  { id:'trex',         kind:'dino',    emoji:'🦖', name:'霸王龙', voiceName:'霸王龙', price:15 },
  { id:'dragon',       kind:'dino',    emoji:'🐉', name:'巨龙',   voiceName:'巨龙',   price:35 }
];

var _byId = {};
CATALOG.forEach(function (it) { _byId[it.id] = it; });

function getItem(id) { return _byId[id]; }
function byKind(kind) { return CATALOG.filter(function (it) { return it.kind === kind; }); }

var DEFAULTS = {
  lele:   { vehicle:'police',    dino:'brontosaurus' },
  haohao: { vehicle:'ambulance', dino:'trex' }
};
var MIGRATION_CAP = 60;

function migrationCoins(priorTotalScore) {
  var n = Math.floor(Number(priorTotalScore) || 0);
  if (n < 0) n = 0;
  return Math.min(MIGRATION_CAP, n);
}

function initEntry(playerId, priorTotalScore) {
  var d = DEFAULTS[playerId] || DEFAULTS.lele;
  return {
    coins: migrationCoins(priorTotalScore),
    owned: [d.vehicle, d.dino],
    equippedVehicle: d.vehicle,
    equippedDino: d.dino,
    migrated: true
  };
}

function normalize(raw, playerId, priorTotalScore) {
  if (!raw || raw.migrated !== true) return initEntry(playerId, priorTotalScore);
  var d = DEFAULTS[playerId] || DEFAULTS.lele;
  var coins = Math.floor(Number(raw.coins) || 0);
  if (coins < 0) coins = 0;
  var owned = Array.isArray(raw.owned) ? raw.owned.filter(function (id) { return !!_byId[id]; }) : [];
  owned = owned.filter(function (id, i) { return owned.indexOf(id) === i; });
  if (owned.indexOf(d.vehicle) === -1) owned.push(d.vehicle);
  if (owned.indexOf(d.dino) === -1) owned.push(d.dino);
  function pick(id, fallback, kind) {
    var it = _byId[id];
    return (it && it.kind === kind && owned.indexOf(id) !== -1) ? id : fallback;
  }
  return {
    coins: coins,
    owned: owned,
    equippedVehicle: pick(raw.equippedVehicle, d.vehicle, 'vehicle'),
    equippedDino: pick(raw.equippedDino, d.dino, 'dino'),
    migrated: true
  };
}

var COIN_PER_CORRECT = 2;
var PERFECT_BONUS = 5;

function roundCoins(correct, total) {
  correct = Math.max(0, Math.floor(Number(correct) || 0));
  total = Math.max(0, Math.floor(Number(total) || 0));
  correct = Math.min(correct, total); // can't answer more correct than total
  if (total === 0) return 0;
  var c = correct * COIN_PER_CORRECT;
  if (correct === total) c += PERFECT_BONUS;
  return c;
}

function _clone(e) {
  return { coins:e.coins, owned:e.owned.slice(), equippedVehicle:e.equippedVehicle, equippedDino:e.equippedDino, migrated:true };
}
function owns(entry, id) { return entry.owned.indexOf(id) !== -1; }
function isEquipped(entry, id) {
  var it = _byId[id]; if (!it) return false;
  return it.kind === 'vehicle' ? entry.equippedVehicle === id : entry.equippedDino === id;
}
function canAfford(entry, id) {
  var it = _byId[id]; if (!it) return false;
  return entry.coins >= it.price;
}
function unlock(entry, id) {
  var it = _byId[id];
  if (!it || owns(entry, id) || entry.coins < it.price) return null;
  var n = _clone(entry);
  n.coins -= it.price;
  n.owned.push(id);
  return n;
}
function equip(entry, id) {
  var it = _byId[id];
  if (!it || !owns(entry, id)) return null;
  var n = _clone(entry);
  if (it.kind === 'vehicle') n.equippedVehicle = id; else n.equippedDino = id;
  return n;
}

function vEnterPlayer(leleName, leleCoins, haohaoName, haohaoCoins) {
  return ['谁来挑战？点击你的头像吧！',
          leleName + '有 ' + leleCoins + ' 个金币',
          haohaoName + '有 ' + haohaoCoins + ' 个金币'];
}
function vOpenGarage(name, coins) { return '这是' + name + '的车库，你有 ' + coins + ' 个金币，快来挑一辆车吧！'; }
function vInUse(vn)  { return '你正在开' + vn + '，真酷！'; }
function vOwned(vn)  { return '这是' + vn + '，点一下就能开它！'; }
function vAffordPrompt(vn, price) { return vn + '，要 ' + price + ' 个金币，你够啦，再点一下就解锁！'; }
function vNotAfford(vn, price, lack) { return vn + '要 ' + price + ' 个金币，你还差 ' + lack + ' 个，再答对几题就能买啦！'; }
function vUnlocked(vn)  { return '太棒了！' + vn + '是你的啦！'; }
function vEquipped(vn)  { return '换好啦！现在开' + vn + '！呜——'; }
function vResultCoins(n) { return '这一局你赚了 ' + n + ' 个金币！'; }

function lifetimeCoins(records) {
  if (!Array.isArray(records)) return 0;
  var sum = 0;
  for (var i = 0; i < records.length; i++) {
    var r = records[i] || {};
    sum += roundCoins(r.score, r.total);
  }
  return sum;
}

function ownedCount(owned, kind) {
  if (!Array.isArray(owned)) return 0;
  var n = 0;
  for (var i = 0; i < owned.length; i++) {
    var it = _byId[owned[i]];
    if (it && it.kind === kind) n++;
  }
  return n;
}

function ownsAll(owned, kind) {
  if (!Array.isArray(owned) || owned.length === 0) return false;
  var items = byKind(kind);
  for (var i = 0; i < items.length; i++) {
    if (owned.indexOf(items[i].id) === -1) return false;
  }
  return true;
}

var GarageAPI = {
  CATALOG: CATALOG,
  getItem: getItem,
  byKind: byKind,
  DEFAULTS: DEFAULTS,
  MIGRATION_CAP: MIGRATION_CAP,
  migrationCoins: migrationCoins,
  initEntry: initEntry,
  normalize: normalize,
  COIN_PER_CORRECT: COIN_PER_CORRECT,
  PERFECT_BONUS: PERFECT_BONUS,
  roundCoins: roundCoins,
  owns: owns,
  isEquipped: isEquipped,
  canAfford: canAfford,
  unlock: unlock,
  equip: equip,
  vEnterPlayer: vEnterPlayer,
  vOpenGarage: vOpenGarage,
  vInUse: vInUse,
  vOwned: vOwned,
  vAffordPrompt: vAffordPrompt,
  vNotAfford: vNotAfford,
  vUnlocked: vUnlocked,
  vEquipped: vEquipped,
  vResultCoins: vResultCoins,
  lifetimeCoins: lifetimeCoins,
  ownedCount: ownedCount,
  ownsAll: ownsAll,
};

if (typeof module !== 'undefined' && module.exports) module.exports = GarageAPI;
if (typeof window !== 'undefined') window.Garage = GarageAPI;
