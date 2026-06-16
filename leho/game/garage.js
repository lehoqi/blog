'use strict';

var CATALOG = [
  { id:'police',       kind:'vehicle', emoji:'🚜', name:'工程推土机', voiceName:'工程推土机', price:15 },
  { id:'ambulance',    kind:'vehicle', emoji:'🏎️', name:'闪电赛车',   voiceName:'闪电赛车',   price:15 },
  { id:'fire',         kind:'vehicle', emoji:'🤖', name:'能量机器人', voiceName:'能量机器人', price:15 },
  { id:'schoolbus',    kind:'vehicle', emoji:'🦖', name:'霸王龙伙伴', voiceName:'霸王龙伙伴', price:15 },
  { id:'taxi',         kind:'vehicle', emoji:'🏁', name:'冲线旗',     voiceName:'冲线旗',     price:20 },
  { id:'car',          kind:'vehicle', emoji:'🧱', name:'大砖墙',     voiceName:'大砖墙',     price:18 },
  { id:'suv',          kind:'vehicle', emoji:'🚧', name:'工地路障',   voiceName:'工地路障',   price:22 },
  { id:'minibus',      kind:'vehicle', emoji:'🦴', name:'恐龙化石',   voiceName:'恐龙化石',   price:24 },
  { id:'pickup',       kind:'vehicle', emoji:'🔋', name:'能量电池',   voiceName:'能量电池',   price:28 },
  { id:'truck',        kind:'vehicle', emoji:'⚙️', name:'机器齿轮',   voiceName:'机器齿轮',   price:30 },
  { id:'motorcycle',   kind:'vehicle', emoji:'🛴', name:'越野滑板车', voiceName:'越野滑板车', price:35 },
  { id:'tram',         kind:'vehicle', emoji:'🛰️', name:'小卫星',     voiceName:'小卫星',     price:40 },
  { id:'bullettrain',  kind:'vehicle', emoji:'⭐', name:'太空星标',   voiceName:'太空星标',   price:45 },
  { id:'race',         kind:'vehicle', emoji:'🏎️', name:'冠军赛车',   voiceName:'冠军赛车',   price:25 },
  { id:'tractor',      kind:'vehicle', emoji:'🏗️', name:'工程吊车',   voiceName:'工程吊车',   price:25 },
  { id:'heli',         kind:'vehicle', emoji:'⛏️', name:'化石小镐',   voiceName:'化石小镐',   price:30 },
  { id:'train',        kind:'vehicle', emoji:'🪐', name:'太空行星',   voiceName:'太空行星',   price:30 },
  { id:'rocket',       kind:'vehicle', emoji:'🚀', name:'太空火箭',   voiceName:'太空火箭',   price:40 },
  { id:'ufo',          kind:'vehicle', emoji:'🛸', name:'神秘飞碟',   voiceName:'神秘飞碟',   price:60 },
  { id:'brontosaurus', kind:'dino',    emoji:'🐶', name:'布鲁伊小狗装', voiceName:'布鲁伊小狗装', price:15 },
  { id:'trex',         kind:'dino',    emoji:'🧡', name:'宾果小狗装', voiceName:'宾果小狗装', price:15 },
  { id:'dragon',       kind:'dino',    emoji:'🌟', name:'星星披风',   voiceName:'星星披风',   price:35 }
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
  return ['谁来玩数学游戏？点一下你的角色吧！',
          leleName + '有 ' + leleCoins + ' 个金币',
          haohaoName + '有 ' + haohaoCoins + ' 个金币'];
}
function vOpenGarage(name, coins) { return '这是' + name + '的游戏柜，你有 ' + coins + ' 个金币，快来挑一个道具或装扮吧！'; }
function vInUse(vn)  { return '你正在用' + vn + '，真棒！'; }
function vOwned(vn)  { return '这是' + vn + '，点一下就能换上！'; }
function vAffordPrompt(vn, price) { return vn + '，要 ' + price + ' 个金币，你够啦，再点一下就解锁！'; }
function vNotAfford(vn, price, lack) { return vn + '要 ' + price + ' 个金币，你还差 ' + lack + ' 个，再答对几题就能买啦！'; }
function vUnlocked(vn)  { return '太棒了！' + vn + '是你的啦！'; }
function vEquipped(vn)  { return '换好啦！现在用' + vn + '玩游戏！'; }
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

var VEHICLE_FAMILY = {
  police: 'police',
  ambulance: 'ambulance',
  fire: 'fire',
  car: 'police', suv: 'police', tractor: 'police',
  taxi: 'ambulance', race: 'ambulance',
  pickup: 'fire', truck: 'fire',
  schoolbus: 'everyday', minibus: 'everyday', motorcycle: 'everyday', heli: 'everyday',
  tram: 'adventure', bullettrain: 'adventure', train: 'adventure', rocket: 'adventure', ufo: 'adventure'
};
function vehicleFamily(vehicleId) {
  return VEHICLE_FAMILY[vehicleId] || 'general';
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
  vehicleFamily: vehicleFamily,
};

if (typeof module !== 'undefined' && module.exports) module.exports = GarageAPI;
if (typeof window !== 'undefined') window.Garage = GarageAPI;
