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

var GarageAPI = {
  CATALOG: CATALOG,
  getItem: getItem,
  byKind: byKind
};

if (typeof module !== 'undefined' && module.exports) module.exports = GarageAPI;
if (typeof window !== 'undefined') window.Garage = GarageAPI;
