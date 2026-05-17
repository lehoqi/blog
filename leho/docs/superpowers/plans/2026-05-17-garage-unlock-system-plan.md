# Garage Unlock System (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-player dual-currency (⭐ untouched + 🪙 coins) garage that earns coins on correct answers and spends them to unlock & equip cosmetic vehicles/dinos, with a collection (图鉴) view, full voice narration, and flashy animations — for a 5yo non-reader.

**Architecture:** Extract all bug-prone *pure* logic (catalog, garage state model, coin economy, unlock/equip transitions, voice-line strings) into a new browser-and-Node file `garage.js`, strictly TDD'd with Node's built-in test runner (zero dependencies). `index.html` keeps all DOM/animation/voice and only *wires* the pure logic in. This satisfies spec §15 (testable seams) and the user's hard "no bugs" requirement by unit-testing exactly the parts the deep review flagged.

**Tech Stack:** Single static `index.html` (inline HTML/CSS/JS, no build), new sibling classic script `garage.js` (UMD-lite: `window.Garage` + `module.exports`), Node `node:test`/`node:assert` for unit tests, chrome-devtools MCP for deterministic integration assertions on `localStorage`/DOM.

**Spec:** `docs/superpowers/specs/2026-05-17-garage-unlock-system-design.md` (read it before starting).

---

## Conventions

- Work on branch `feature/game-enhancements` (already checked out).
- `garage.js` is a **classic script** (no ES modules — file:// must work). Tail:
  ```js
  if (typeof module !== 'undefined' && module.exports) module.exports = GarageAPI;
  if (typeof window !== 'undefined') window.Garage = GarageAPI;
  ```
- All public API names below are FINAL — later tasks depend on these exact names/signatures.
- In `index.html`, locate edit anchors by the **quoted code snippet** (line numbers drift as you edit). Each modify-step shows exact old → new.
- `garage.js` functions are **pure** (no DOM, no `localStorage`, no `Date`): callers inject data. This is what makes them Node-testable.
- Entry object shape (the per-player record): `{ coins:int, owned:string[], equippedVehicle:string, equippedDino:string, migrated:true }`.
- Commit after every task.

---

## File Structure

- **Create `garage.js`** — pure: `CATALOG`, lookups, economy constants/math, `initEntry`/`normalize`/migration, `canAfford`/`owns`/`isEquipped`/`unlock`/`equip`, voice-line builders. No browser/Node-only APIs.
- **Create `tests/garage.test.js`** — `node --test` unit tests for every `garage.js` function.
- **Modify `index.html`** — load `garage.js`; storage adapter; `comboAvatar` + 3 bypass points; parametrize `showVehicleRush`; `speakQueue`; player-select coins+button; new `#garage-page`; garage interactions; coin hooks; animations; clear-data reset.

---

### Task 1: Scaffold `garage.js` + test harness with CATALOG

**Files:**
- Create: `garage.js`
- Create: `tests/garage.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/garage.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `Cannot find module '../garage.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `garage.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/garage.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(garage): catalog + node test harness"
```

---

### Task 2: Defaults, migration coins, init & normalize entry

**Files:**
- Modify: `garage.js`
- Modify: `tests/garage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/garage.test.js`:

```js
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
  // already migrated: do NOT re-grant migration coins
  const kept = G.normalize({ coins:3, owned:['ambulance','trex'], equippedVehicle:'ambulance', equippedDino:'trex', migrated:true }, 'haohao', 999);
  assert.equal(kept.coins, 3);
});

test('normalize: repairs bad fields, keeps defaults owned, clamps coins', () => {
  const n = G.normalize({ coins:-9, owned:['rocket','bogus'], equippedVehicle:'rocket', equippedDino:'zzz', migrated:true }, 'lele', 0);
  assert.equal(n.coins, 0);                       // clamped >=0 int
  assert.ok(n.owned.includes('police'));          // default re-added
  assert.ok(n.owned.includes('brontosaurus'));
  assert.ok(!n.owned.includes('bogus'));          // unknown id dropped
  assert.equal(n.equippedVehicle, 'rocket');      // owned -> kept
  assert.equal(n.equippedDino, 'brontosaurus');   // not owned -> default
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `G.DEFAULTS` / `G.migrationCoins` undefined.

- [ ] **Step 3: Write minimal implementation**

In `garage.js`, before the `var GarageAPI = {` line, add:

```js
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
```

Then extend the `GarageAPI` object literal to include:

```js
  DEFAULTS: DEFAULTS,
  MIGRATION_CAP: MIGRATION_CAP,
  migrationCoins: migrationCoins,
  initEntry: initEntry,
  normalize: normalize,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/garage.test.js`
Expected: PASS (all tests, incl. Task 1).

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(garage): defaults, migration coins, init/normalize"
```

---

### Task 3: Coin economy math (idempotent-by-design)

**Files:**
- Modify: `garage.js`
- Modify: `tests/garage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/garage.test.js`:

```js
test('economy constants', () => {
  assert.equal(G.COIN_PER_CORRECT, 2);
  assert.equal(G.PERFECT_BONUS, 5);
});

test('roundCoins: per-correct + perfect bonus only when all correct', () => {
  assert.equal(G.roundCoins(0, 5), 0);
  assert.equal(G.roundCoins(3, 5), 6);            // 3*2, not perfect
  assert.equal(G.roundCoins(5, 5), 15);           // 5*2 + 5 bonus
  assert.equal(G.roundCoins(5, 0), 0);            // no questions -> no bonus
  assert.equal(G.roundCoins(2, 2), 4 + 5);        // perfect short round
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `G.COIN_PER_CORRECT` undefined.

- [ ] **Step 3: Write minimal implementation**

In `garage.js` add before `var GarageAPI`:

```js
var COIN_PER_CORRECT = 2;
var PERFECT_BONUS = 5;

function roundCoins(correct, total) {
  correct = Math.max(0, Math.floor(Number(correct) || 0));
  total = Math.max(0, Math.floor(Number(total) || 0));
  correct = Math.min(correct, total); // can't answer more correct than total
  if (total === 0) return 0;          // degenerate: no questions -> no coins
  var c = correct * COIN_PER_CORRECT;
  if (correct === total) c += PERFECT_BONUS;
  return c;
}
```

Extend `GarageAPI`:

```js
  COIN_PER_CORRECT: COIN_PER_CORRECT,
  PERFECT_BONUS: PERFECT_BONUS,
  roundCoins: roundCoins,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/garage.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(garage): coin economy math"
```

---

### Task 4: Pure transitions — canAfford / owns / isEquipped / unlock / equip

**Files:**
- Modify: `garage.js`
- Modify: `tests/garage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/garage.test.js`:

```js
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
  assert.equal(G.canAfford(freshLele(40), 'rocket'), true);   // == price
  assert.equal(G.canAfford(freshLele(99), 'rocket'), true);
});

test('unlock: returns NEW entry, deducts, adds owned; null on bad input', () => {
  const e = freshLele(40);
  const u = G.unlock(e, 'rocket');
  assert.equal(u.coins, 0);
  assert.ok(u.owned.includes('rocket'));
  assert.equal(e.coins, 40);                 // original NOT mutated
  assert.ok(!e.owned.includes('rocket'));
  assert.equal(G.unlock(freshLele(39), 'rocket'), null);   // cannot afford
  assert.equal(G.unlock(freshLele(40), 'police'), null);   // already owned
  assert.equal(G.unlock(freshLele(40), 'bogus'), null);    // unknown id
});

test('equip: sets slot by kind, requires owned, returns NEW entry; null otherwise', () => {
  let e = freshLele(40);
  e = G.unlock(e, 'rocket');
  const eq = G.equip(e, 'rocket');
  assert.equal(eq.equippedVehicle, 'rocket');
  assert.equal(eq.equippedDino, 'brontosaurus');     // unchanged
  assert.equal(e.equippedVehicle, 'police');         // original NOT mutated
  assert.equal(G.equip(freshLele(0), 'rocket'), null); // not owned
  const ed = G.equip(freshLele(0), 'brontosaurus');
  assert.equal(ed.equippedDino, 'brontosaurus');
  assert.equal(G.equip(freshLele(0), 'bogus'), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `G.owns` undefined.

- [ ] **Step 3: Write minimal implementation**

In `garage.js` add before `var GarageAPI`:

```js
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
```

Extend `GarageAPI`:

```js
  owns: owns,
  isEquipped: isEquipped,
  canAfford: canAfford,
  unlock: unlock,
  equip: equip,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/garage.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(garage): pure unlock/equip/afford transitions"
```

---

### Task 5: Voice-line builders (exact strings)

**Files:**
- Modify: `garage.js`
- Modify: `tests/garage.test.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/garage.test.js`:

```js
test('voice-line builders produce exact spec §10.2 strings', () => {
  assert.deepEqual(
    G.vEnterPlayer('乐乐', 24, '昊昊', 18),
    ['谁来挑战？点击你的头像吧！', '乐乐有 24 个金币', '昊昊有 18 个金币']
  );
  assert.equal(G.vOpenGarage('乐乐', 24), '这是乐乐的车库，你有 24 个金币，快来挑一辆车吧！');
  assert.equal(G.vInUse('消防车'), '你正在开消防车，真酷！');
  assert.equal(G.vOwned('赛车'), '这是赛车，点一下就能开它！');
  assert.equal(G.vAffordPrompt('火箭', 40), '火箭，要 40 个金币，你够啦，再点一下就解锁！');
  assert.equal(G.vNotAfford('火箭', 40, 16), '火箭要 40 个金币，你还差 16 个，再答对几题就能买啦！');
  assert.equal(G.vUnlocked('火箭'), '太棒了！火箭是你的啦！');
  assert.equal(G.vEquipped('火箭'), '换好啦！现在开火箭！呜——');
  assert.equal(G.vResultCoins(8), '这一局你赚了 8 个金币！');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `G.vEnterPlayer` undefined.

- [ ] **Step 3: Write minimal implementation**

In `garage.js` add before `var GarageAPI`:

```js
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
```

Extend `GarageAPI`:

```js
  vEnterPlayer: vEnterPlayer, vOpenGarage: vOpenGarage, vInUse: vInUse,
  vOwned: vOwned, vAffordPrompt: vAffordPrompt, vNotAfford: vNotAfford,
  vUnlocked: vUnlocked, vEquipped: vEquipped, vResultCoins: vResultCoins,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/garage.test.js`
Expected: PASS — full `garage.js` logic now covered.

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(garage): voice-line builders"
```

---

### Task 6: Load garage.js + localStorage adapter in index.html

**Files:**
- Modify: `index.html` (load script; add storage adapter near `STORAGE_KEY`)

- [ ] **Step 1: Add a failing integration assertion**

Manual fail-first check (deterministic). In a terminal-driven browser via chrome-devtools MCP:
- `navigate_page` to `file:///Users/ip/dev/code/blog/leho/index.html`
- `evaluate_script`: `() => typeof window.getPlayerGarage`
- Expected now: `"undefined"` (proves not yet wired → "fails").

- [ ] **Step 2: Load garage.js**

In `index.html`, find:

```html
<script>
const $ = id => document.getElementById(id);
```

Change the line immediately before it (the opening of the main inline script) so the external script loads first. Replace:

```html
<script>
const $ = id => document.getElementById(id);
```

with:

```html
<script src="garage.js"></script>
<script>
const $ = id => document.getElementById(id);
```

- [ ] **Step 3: Add the storage adapter**

In `index.html`, find:

```js
const STORAGE_KEY = 'dino_math_records';
```

Immediately AFTER the `clearRecords` / `getPlayerStats` block (find the line `function scoreToStarCount(score, total) {` and insert ABOVE it) add:

```js
// ── 车库数据（localStorage 适配，纯逻辑在 Garage） ──
const GARAGE_KEY = 'dino_math_garage';
function _loadGarageRaw() {
  try { return JSON.parse(localStorage.getItem(GARAGE_KEY)) || {}; } catch { return {}; }
}
function _saveGarageRaw(obj) { localStorage.setItem(GARAGE_KEY, JSON.stringify(obj)); }
// Single source of truth: every read goes through this. Guarantees a
// normalized, migrated entry and persists it back if it changed/initialized.
function getPlayerGarage(playerId) {
  const all = _loadGarageRaw();
  const prior = getPlayerStats(playerId).totalScore;
  const norm = Garage.normalize(all[playerId], playerId, prior);
  all[playerId] = norm;
  _saveGarageRaw(all);
  return norm;
}
function setPlayerGarage(playerId, entry) {
  const all = _loadGarageRaw();
  all[playerId] = entry;
  _saveGarageRaw(all);
}
function clearGarage() { localStorage.removeItem(GARAGE_KEY); }
window.getPlayerGarage = getPlayerGarage; // test/debug hook
```

- [ ] **Step 4: Verify it passes**

Via chrome-devtools MCP, `navigate_page` to the file URL, then `evaluate_script`:

```js
() => { const g = window.getPlayerGarage('lele');
  return [typeof window.getPlayerGarage, g.equippedVehicle, g.migrated, Array.isArray(g.owned)]; }
```

Expected: `["function","police",true,true]`.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(garage): wire garage.js + localStorage adapter"
```

---

### Task 7: comboAvatar → equipped, 3 bypass points, parametrize showVehicleRush

**Files:**
- Modify: `index.html` (`comboAvatar`, `renderQuestion` progress-dino, `submitAnswer` rush emoji + wrong-feedback dino, `showVehicleRush` signature)

- [ ] **Step 1: Fail-first check**

chrome-devtools MCP `evaluate_script` after navigating to the file:

```js
() => { const all = JSON.parse(localStorage.getItem('dino_math_garage')||'{}');
  all.lele = { coins:0, owned:['police','brontosaurus','rocket'], equippedVehicle:'rocket', equippedDino:'brontosaurus', migrated:true };
  localStorage.setItem('dino_math_garage', JSON.stringify(all));
  return window.comboAvatar ? window.comboAvatar('lele') : 'no-comboAvatar'; }
```

Expected NOW: contains `🚓` (old behavior reads `PLAYERS.vehicle`) — i.e. equipped `rocket` is ignored → "fails".

- [ ] **Step 2: Rewrite comboAvatar to read equipped**

Find:

```js
function comboAvatar(playerId) {
  const p = PLAYERS[playerId];
  if (!p) return '🚗';
  return `<span class="combo-avatar"><span>${p.vehicle}</span><span class="dino-badge">${p.avatar}</span></span>`;
}
```

Replace with:

```js
function equippedEmojis(playerId) {
  const p = PLAYERS[playerId];
  const fb = { vehicle: p ? p.vehicle : '🚗', dino: p ? p.avatar : '🦕' };
  try {
    const g = getPlayerGarage(playerId);
    const v = Garage.getItem(g.equippedVehicle), d = Garage.getItem(g.equippedDino);
    return { vehicle: v ? v.emoji : fb.vehicle, dino: d ? d.emoji : fb.dino };
  } catch (e) { return fb; }
}
function comboAvatar(playerId) {
  if (!PLAYERS[playerId]) return '🚗';
  const e = equippedEmojis(playerId);
  return `<span class="combo-avatar"><span>${e.vehicle}</span><span class="dino-badge">${e.dino}</span></span>`;
}
window.comboAvatar = comboAvatar; // test/debug hook
```

- [ ] **Step 3: Fix bypass point 1 — progress-dino**

Find (inside `renderQuestion`):

```js
    $('quiz-dino').innerHTML = comboAvatar(currentPlayer);
    $('progress-dino').textContent = p.vehicle;
```

Replace with:

```js
    $('quiz-dino').innerHTML = comboAvatar(currentPlayer);
    $('progress-dino').textContent = equippedEmojis(currentPlayer).vehicle;
```

- [ ] **Step 4: Fix bypass point 2 — showVehicleRush emoji + parametrize signature**

Find:

```js
function showVehicleRush(vehicleEmoji, type, combo, onDone) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (onDone) onDone();
    return;
  }

  if (type === 'police') playPoliceSiren();
  else playAmbulanceSiren();
```

Replace with:

```js
function showVehicleRush(vehicleEmoji, type, combo, onDone, opts) {
  opts = opts || {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (onDone) onDone();
    return;
  }

  if (typeof opts.sound === 'function') opts.sound();
  else if (type === 'police') playPoliceSiren();
  else playAmbulanceSiren();
```

Then find:

```js
  const rushText = type === 'police' ? '🚓 破案成功！' : '🚑 急救成功！';
```

Replace with:

```js
  const rushText = opts.text || (type === 'police' ? '🚓 破案成功！' : '🚑 急救成功！');
```

Then find the call site in `submitAnswer`:

```js
        if (isThemeMatch) {
          const vType = q.tag;
          const vEmoji = vType === 'police' ? '🚓' : '🚑';
          showVehicleRush(vEmoji, vType, correctStreak, goNext);
        } else {
```

Replace with:

```js
        if (isThemeMatch) {
          const vType = q.tag;
          const vEmoji = equippedEmojis(currentPlayer).vehicle;
          showVehicleRush(vEmoji, vType, correctStreak, goNext);
        } else {
```

- [ ] **Step 5: Fix bypass point 3 — wrong-answer feedback dino**

Find:

```js
    const pName = currentPlayer ? PLAYERS[currentPlayer].avatar : '🦕';
```

Replace with:

```js
    const pName = currentPlayer ? equippedEmojis(currentPlayer).dino : '🦕';
```

- [ ] **Step 6: Verify pass + zero regression**

chrome-devtools MCP `evaluate_script` (after same localStorage seed as Step 1):

```js
() => window.comboAvatar('lele')
```

Expected: now contains `🚀` (equipped rocket), NOT `🚓`.

Zero-regression visual smoke: reload, play one full round as 乐乐 with default garage (no unlocks). Confirm: avatar shows 🚓+🦕, theme-match rush still shows 🚓 with police siren + "🚓 破案成功！" (defaults preserved because `opts` empty).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat(garage): equipped-driven avatars + parametrized showVehicleRush"
```

---

### Task 8: speakQueue (anti-truncation) + migrate multi-line speak sites

**Files:**
- Modify: `index.html` (add `speakQueue` near `speak`; migrate player-select & result speak)

- [ ] **Step 1: Fail-first check**

chrome-devtools MCP after navigate: `evaluate_script`: `() => typeof window.speakQueue` → expected `"undefined"`.

- [ ] **Step 2: Add speakQueue**

Find:

```js
function stopSpeech() {
  clearTimeout(speakTimer);
  window.speechSynthesis && window.speechSynthesis.cancel();
}
```

Insert immediately AFTER it:

```js
// 串行语音队列：onend 推进 + 超时兜底，避免连续 speak() 互相掐断（spec A1）
let _spkSeq = 0;
function speakQueue(lines, rate = 0.9) {
  if (voiceMuted || !window.speechSynthesis || !lines || !lines.length) return;
  const seq = ++_spkSeq;
  clearTimeout(speakTimer);
  window.speechSynthesis.cancel();
  let i = 0;
  const next = () => {
    if (seq !== _spkSeq || i >= lines.length) return;
    const txt = String(lines[i++]);
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'zh-CN'; u.rate = rate; u.pitch = 1.1;
    let advanced = false;
    const go = () => { if (advanced || seq !== _spkSeq) return; advanced = true; next(); };
    u.onend = go;
    u.onerror = go;
    setTimeout(go, Math.max(1400, txt.length * 240)); // fallback if onend never fires
    window.speechSynthesis.speak(u);
  };
  setTimeout(next, 80);
}
window.speakQueue = speakQueue; // test/debug hook
```

Note: any user-initiated `speak()`/`speakQueue()` bumps `_spkSeq`/cancels, so a tap always supersedes a running queue (spec §10.1).

- [ ] **Step 3: Migrate player-select entry to queue**

Find:

```js
$('btn-start').addEventListener('click', () => {
  playStart();
  updatePlayerPreview();
  showPage('player-page');
  speak('谁来挑战？点击你的头像吧！');
});
```

Replace the `speak(...)` line with:

```js
  const lg = getPlayerGarage('lele'), hg = getPlayerGarage('haohao');
  speakQueue(Garage.vEnterPlayer(PLAYERS.lele.name, lg.coins, PLAYERS.haohao.name, hg.coins));
```

- [ ] **Step 4: Migrate result speak to queue (incl. coin line placeholder)**

Find (end of `showResult`):

```js
  setTimeout(() => speak(resultRead), 600);
}
```

Replace with:

```js
  setTimeout(() => speakQueue([resultRead, Garage.vResultCoins(window.__roundCoins || 0)]), 600);
}
```

(`window.__roundCoins` is set in Task 12; defaults to 0 here so this is safe to land now.)

- [ ] **Step 5: Verify**

Reload, click 开始冒险. Confirm (audibly, or via chrome-devtools `list_console_messages` after adding a temporary log if needed) that "谁来挑战" plays fully, THEN "乐乐有 N 个金币", THEN "昊昊有 N 个金币" — no truncation. Finish a round: result sentence completes before the coin sentence.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(garage): serial speakQueue, migrate multi-line voice sites"
```

---

### Task 9: Player-select page — coins display + 我的车库 button

**Files:**
- Modify: `index.html` (player-card markup; `updatePlayerPreview`; CSS; button handlers)

- [ ] **Step 1: Add coins + button to both player cards**

Find:

```html
        <div class="player-total-stars" id="lele-preview-stars">⭐ 0</div>
        <div class="player-rank-badge" id="lele-preview-title">警车新手</div>
      </div>
```

Replace with:

```html
        <div class="player-total-stars" id="lele-preview-stars">⭐ 0</div>
        <div class="player-coins" id="lele-preview-coins">🪙 0</div>
        <div class="player-rank-badge" id="lele-preview-title">警车新手</div>
        <button class="btn-garage" id="btn-garage-lele" type="button">🔧 我的车库</button>
      </div>
```

Find:

```html
        <div class="player-total-stars" id="haohao-preview-stars">⭐ 0</div>
        <div class="player-rank-badge" id="haohao-preview-title">急救新手</div>
      </div>
```

Replace with:

```html
        <div class="player-total-stars" id="haohao-preview-stars">⭐ 0</div>
        <div class="player-coins" id="haohao-preview-coins">🪙 0</div>
        <div class="player-rank-badge" id="haohao-preview-title">急救新手</div>
        <button class="btn-garage" id="btn-garage-haohao" type="button">🔧 我的车库</button>
      </div>
```

- [ ] **Step 2: CSS for coins + garage button**

Find `</style>` and insert immediately BEFORE it:

```css
    .player-coins { font-size: 1rem; color: #c2410c; font-weight: 800; margin-top: 2px; }
    .btn-garage {
      margin-top: 10px; border: none; border-radius: 18px;
      background: linear-gradient(135deg, #ffb74d, #fb8c00);
      color: #fff; font-weight: 900; font-size: 0.95rem;
      padding: 8px 16px; cursor: pointer; box-shadow: 0 4px 0 #e65100;
      transition: transform 0.12s;
    }
    .btn-garage:active { transform: translateY(3px); box-shadow: 0 1px 0 #e65100; }
```

- [ ] **Step 3: Populate coins in updatePlayerPreview**

Find:

```js
function updatePlayerPreview() {
  for (const pid of ['lele', 'haohao']) {
    const stats = getPlayerStats(pid);
    $(`${pid}-name`).textContent = PLAYERS[pid].name;
    $(`${pid}-preview-stars`).textContent = `⭐ ${stats.totalStars}`;
    $(`${pid}-preview-title`).textContent = getTitle(stats, pid);
  }
}
```

Replace with:

```js
function updatePlayerPreview() {
  for (const pid of ['lele', 'haohao']) {
    const stats = getPlayerStats(pid);
    const g = getPlayerGarage(pid);
    $(`${pid}-name`).textContent = PLAYERS[pid].name;
    $(`${pid}-preview-stars`).textContent = `⭐ ${stats.totalStars}`;
    $(`${pid}-preview-coins`).textContent = `🪙 ${g.coins}`;
    $(`${pid}-preview-title`).textContent = getTitle(stats, pid);
  }
}
```

- [ ] **Step 4: Wire garage buttons (stop card click; open garage)**

Find:

```js
$('edit-lele').addEventListener('click', e => {
  e.stopPropagation();
  editPlayerName('lele');
});
```

Insert immediately BEFORE it:

```js
$('btn-garage-lele').addEventListener('click', e => { e.stopPropagation(); playClick(); openGarage('lele'); });
$('btn-garage-haohao').addEventListener('click', e => { e.stopPropagation(); playClick(); openGarage('haohao'); });
```

(`openGarage` is defined in Task 10. Landing this handler now is safe — buttons exist; clicking before Task 10 would throw, which is fine mid-plan and fixed in the next task.)

- [ ] **Step 5: Verify**

Reload → 开始冒险. Each card shows `🪙 N` and a 🔧 我的车库 button. Clicking the button does NOT start a game (card click suppressed).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(garage): player-select coins + garage entry button"
```

---

### Task 10: #garage-page markup + render (3-state, no-voice-operable colors)

**Files:**
- Modify: `index.html` (new page markup; CSS; `openGarage`/`renderGarage`; back nav)

- [ ] **Step 1: Add the page markup**

Find:

```html
  <!-- 排行榜页 -->
  <div class="page" id="leaderboard-page">
```

Insert immediately BEFORE it:

```html
  <!-- 车库页 -->
  <div class="page" id="garage-page">
    <div class="garage-head">
      <span class="garage-avatar" id="garage-avatar">🦕🚓</span>
      <div class="garage-title"><span id="garage-name">乐乐</span>的车库</div>
      <div class="garage-coins">🪙 <span id="garage-coins">0</span></div>
    </div>
    <div class="garage-section-title">🚗 座驾</div>
    <div class="garage-grid" id="garage-grid-vehicle"></div>
    <div class="garage-section-title">🦕 恐龙</div>
    <div class="garage-grid" id="garage-grid-dino"></div>
    <button class="btn-back-home" id="btn-back-garage" style="margin-top:14px;">🏠 返回</button>
  </div>
```

- [ ] **Step 2: CSS**

Insert immediately BEFORE `</style>`:

```css
    #garage-page { gap: 14px; width: 100%; }
    .garage-head {
      width:100%; background:var(--card); border-radius:24px; padding:16px;
      box-shadow:var(--shadow); text-align:center;
    }
    .garage-avatar { font-size:48px; display:block; }
    .garage-title { font-size:1.4rem; font-weight:900; color:var(--text); margin-top:4px; }
    .garage-coins { font-size:1.3rem; font-weight:900; color:#c2410c; margin-top:2px; }
    .garage-section-title {
      align-self:flex-start; font-size:1.1rem; font-weight:900; color:#558b2f; margin-left:4px;
    }
    .garage-grid {
      width:100%; display:grid; grid-template-columns:repeat(4,1fr); gap:10px;
    }
    .garage-cell {
      background:var(--card); border-radius:18px; padding:12px 4px 8px;
      text-align:center; border:3px solid #eee; cursor:pointer; position:relative;
      transition:transform 0.12s;
    }
    .garage-cell:active { transform:scale(0.95); }
    .garage-cell .gc-emoji { font-size:34px; display:block; line-height:1; }
    .garage-cell .gc-state { font-size:0.7rem; font-weight:800; margin-top:4px; }
    .garage-cell.owned { border-color:#a5d6a7; }
    .garage-cell.equipped {
      border-color:#43a047;
      box-shadow:0 0 0 3px #66bb6a, 0 0 18px rgba(76,175,80,0.55);
    }
    .garage-cell.equipped .gc-state { color:#2e7d32; }
    .garage-cell.locked .gc-emoji { filter:grayscale(100%); opacity:0.45; }
    .garage-cell .gc-lock { position:absolute; top:6px; right:8px; font-size:0.8rem; }
    .garage-cell .gc-price-afford   { color:#2e7d32; font-weight:900; }
    .garage-cell .gc-price-noafford { color:#e53935; font-weight:900; }
    .garage-cell.confirm {
      border-color:#fb8c00;
      box-shadow:0 0 0 3px #ffb74d, 0 0 18px rgba(255,152,0,0.6);
      animation:gcPulse 0.7s ease-in-out infinite;
    }
    @keyframes gcPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
    @media (max-width:420px){ .garage-grid{grid-template-columns:repeat(3,1fr);} }
```

- [ ] **Step 3: openGarage + renderGarage**

Find:

```js
function openLeaderboard() {
```

Insert immediately BEFORE it:

```js
let currentGaragePlayer = null;
let garageConfirmId = null; // id awaiting 2nd-tap unlock confirm

function renderGarage() {
  const pid = currentGaragePlayer;
  const g = getPlayerGarage(pid);
  $('garage-avatar').innerHTML = comboAvatar(pid);
  $('garage-name').textContent = PLAYERS[pid].name;
  $('garage-coins').textContent = g.coins;

  function cell(it) {
    const owned = Garage.owns(g, it.id);
    const equipped = Garage.isEquipped(g, it.id);
    const afford = Garage.canAfford(g, it.id);
    let cls = 'garage-cell', state, lock = '';
    if (equipped) { cls += ' owned equipped'; state = '✓ 正在开'; }
    else if (owned) { cls += ' owned'; state = '点我换上'; }
    else {
      cls += ' locked';
      lock = '<span class="gc-lock">🔒</span>';
      const c = afford ? 'gc-price-afford' : 'gc-price-noafford';
      state = `<span class="${c}">🪙 ${it.price}</span>`;
    }
    if (!owned && afford) cls += ' afford'; // breathing hook (Task 13)
    if (it.id === garageConfirmId) cls += ' confirm';
    return `<div class="${cls}" data-id="${it.id}">${lock}
      <span class="gc-emoji">${it.emoji}</span>
      <span class="gc-state">${state}</span></div>`;
  }
  $('garage-grid-vehicle').innerHTML = Garage.byKind('vehicle').map(cell).join('');
  $('garage-grid-dino').innerHTML = Garage.byKind('dino').map(cell).join('');
  // delegate clicks (Task 11 fills handler body)
  [$('garage-grid-vehicle'), $('garage-grid-dino')].forEach(grid => {
    grid.onclick = ev => {
      const c = ev.target.closest('.garage-cell');
      if (c) handleGarageCellTap(c.dataset.id);
    };
  });
}

function openGarage(pid) {
  currentGaragePlayer = pid;
  garageConfirmId = null;
  renderGarage();
  showPage('garage-page');
  const g = getPlayerGarage(pid);
  speak(Garage.vOpenGarage(PLAYERS[pid].name, g.coins));
}

function handleGarageCellTap(id) { /* implemented in Task 11 */ }
```

- [ ] **Step 4: Back navigation**

Find:

```js
$('btn-back-lb').addEventListener('click', () => {
  updatePlayerPreview();
  showPage('player-page');
});
```

Insert immediately AFTER it:

```js
$('btn-back-garage').addEventListener('click', () => {
  playClick(); garageConfirmId = null;
  updatePlayerPreview();
  showPage('player-page');
});
```

- [ ] **Step 5: Verify**

Reload → 开始冒险 → click 乐乐's 🔧 我的车库. Garage page shows: header avatar/name/coins; vehicle grid (police = ✓ 正在开 highlighted; others locked with 🔒 + price, green if affordable else red); dino grid (brontosaurus equipped). 返回 goes back to player-select. Voice says the open-garage line.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(garage): garage page markup + render (3-state, color cues)"
```

---

### Task 11: Garage interactions — equip (1-tap), unlock (2-tap confirm), not-afford

**Files:**
- Modify: `index.html` (`handleGarageCellTap` body)

- [ ] **Step 1: Fail-first**

On the garage page, tapping a locked-affordable cell currently does nothing (empty handler). That is the failing state.

- [ ] **Step 2: Implement handleGarageCellTap**

Find:

```js
function handleGarageCellTap(id) { /* implemented in Task 11 */ }
```

Replace with:

```js
function handleGarageCellTap(id) {
  const pid = currentGaragePlayer;
  const it = Garage.getItem(id);
  if (!it) return;
  let g = getPlayerGarage(pid);

  if (Garage.isEquipped(g, id)) {            // tapping the in-use one
    garageConfirmId = null;
    speak(Garage.vInUse(it.voiceName));
    renderGarage();
    return;
  }
  if (Garage.owns(g, id)) {                  // owned -> equip (1 tap, reversible)
    garageConfirmId = null;
    const ng = Garage.equip(g, id);
    if (!ng) return;
    setPlayerGarage(pid, ng);
    animateEquip(id, () => { renderGarage(); });   // Task 13
    speak(Garage.vEquipped(it.voiceName));
    return;
  }
  // locked
  if (!Garage.canAfford(g, id)) {            // not enough
    garageConfirmId = null;
    speak(Garage.vNotAfford(it.voiceName, it.price, it.price - g.coins));
    renderGarage();
    return;
  }
  if (garageConfirmId !== id) {              // 1st tap: arm confirm
    garageConfirmId = id;
    speak(Garage.vAffordPrompt(it.voiceName, it.price));
    renderGarage();
    return;
  }
  // 2nd tap on same locked-affordable cell: COMMIT immediately (spec A6)
  const ng = Garage.unlock(g, id);
  garageConfirmId = null;
  if (!ng) { renderGarage(); return; }
  setPlayerGarage(pid, ng);                  // state persisted before animation
  renderGarage();                            // reflects new coins/owned now
  speak(Garage.vUnlocked(it.voiceName));
  animateUnlock(id);                          // Task 13 — pure decoration
}
```

- [ ] **Step 3: Temporary stubs so it runs before Task 13**

Find:

```js
function handleGarageCellTap(id) {
```

Insert immediately BEFORE it:

```js
function animateEquip(id, done) { if (done) done(); }   // replaced in Task 13
function animateUnlock(id) {}                            // replaced in Task 13
```

- [ ] **Step 4: Verify (deterministic, via chrome-devtools MCP)**

Seed coins then drive UI:

```js
() => { const a=JSON.parse(localStorage.getItem('dino_math_garage')||'{}');
  a.lele={coins:40,owned:['police','brontosaurus'],equippedVehicle:'police',equippedDino:'brontosaurus',migrated:true};
  localStorage.setItem('dino_math_garage',JSON.stringify(a)); return 'seeded'; }
```

Reload, open 乐乐 garage. Tap 🚀 (rocket, price 40) → cell shows orange "confirm" pulse, voice prompt. Tap 🚀 again → assert via `evaluate_script`:

```js
() => { const e=JSON.parse(localStorage.getItem('dino_math_garage')).lele;
  return [e.coins, e.owned.includes('rocket')]; }
```

Expected: `[0, true]`. Tap 🚀 once more → equips; assert `equippedVehicle === 'rocket'`. Tap a too-expensive locked item → no state change, voice "还差 N". Tap police (now not equipped, owned) → re-equips police.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(garage): equip/unlock interactions with 2-tap confirm"
```

---

### Task 12: Coin earning hooks + result coin line + 去车库

**Files:**
- Modify: `index.html` (`startGame` reset; `submitAnswer` accrue + fly-coins; `showResult` idempotent finalize; result page markup/CSS; restart handler)

- [ ] **Step 1: Add round state + reset**

Find:

```js
function startGame() {
  questions     = generateQuestions(5);
  currentIdx    = 0;
  score         = 0;
  correctStreak = 0;
  tagScores     = { police: 0, ambulance: 0, general: 0 };
```

Replace with:

```js
function startGame() {
  questions     = generateQuestions(5);
  currentIdx    = 0;
  score         = 0;
  correctStreak = 0;
  tagScores     = { police: 0, ambulance: 0, general: 0 };
  window.__roundCoins = 0;
  window.__roundFinalized = false;
```

- [ ] **Step 2: Accrue coins on correct + fly-coins animation**

Find (in `submitAnswer`, correct branch):

```js
  if (userAns === q.answer) {
    score++;
    correctStreak++;
    const qTag = q.tag || 'general';
    tagScores[qTag] = (tagScores[qTag] || 0) + 1;
    const total = questions.length;
```

Replace with:

```js
  if (userAns === q.answer) {
    score++;
    correctStreak++;
    const qTag = q.tag || 'general';
    tagScores[qTag] = (tagScores[qTag] || 0) + 1;
    window.__roundCoins = (window.__roundCoins || 0) + Garage.COIN_PER_CORRECT;
    flyCoins($('question-card'), $('score-badge'), Garage.COIN_PER_CORRECT);
    const total = questions.length;
```

- [ ] **Step 3: Add flyCoins (B1) animation**

Find:

```js
// ── 检测新解锁勋章 ──
```

Insert immediately BEFORE it:

```js
// B1 飞币：题卡 → 角标，二次贝塞尔 + 拖尾，落点弹跳 + 金色 star 粒子
function flyCoins(fromEl, toEl, n) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = fromEl.getBoundingClientRect(), t = toEl.getBoundingClientRect();
  const sx = f.left + f.width / 2, sy = f.top + f.height / 2;
  const ex = t.left + t.width / 2, ey = t.top + t.height / 2;
  const cx = (sx + ex) / 2 + (Math.random() - 0.5) * 160, cy = Math.min(sy, ey) - 120;
  const count = Math.max(5, Math.min(8, n * 3));
  for (let k = 0; k < count; k++) {
    const s = document.createElement('div');
    s.textContent = '🪙';
    s.style.cssText = 'position:fixed;left:0;top:0;font-size:26px;z-index:9998;pointer-events:none;will-change:transform;';
    document.body.appendChild(s);
    const dur = 620 + Math.random() * 220, delay = k * 55;
    const frames = [];
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const x = (1-p)*(1-p)*sx + 2*(1-p)*p*cx + p*p*ex;
      const y = (1-p)*(1-p)*sy + 2*(1-p)*p*cy + p*p*ey;
      frames.push({ transform:`translate(${x}px,${y}px) rotate(${p*540}deg) scale(${1.1-0.4*p})`,
                    opacity: p > 0.85 ? 0 : 1 });
    }
    s.animate(frames, { duration:dur, delay, easing:'cubic-bezier(.4,0,.5,1)', fill:'forwards' })
      .finished.then(() => s.remove()).catch(() => s.remove());
  }
  setTimeout(() => {
    toEl.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],
      { duration:360, easing:'cubic-bezier(.34,1.56,.64,1)' });
    const r = toEl.getBoundingClientRect();
    for (let j=0;j<10;j++) particles.push(new Particle(r.left+r.width/2, r.top+r.height/2, '#ffd600', 'star'));
    if (!fwAnimId) fwLoop();
  }, 620);
}
```

- [ ] **Step 4: Idempotent finalize in showResult**

Find:

```js
  let beforeSet = new Set();
  if (currentPlayer) {
    const pre = detectNewMedals(currentPlayer);
    beforeSet = pre.beforeSet;
    saveRecord(currentPlayer, score, totalQ, { ...tagScores });
  }
```

Replace with:

```js
  let beforeSet = new Set();
  if (currentPlayer) {
    const pre = detectNewMedals(currentPlayer);
    beforeSet = pre.beforeSet;
    saveRecord(currentPlayer, score, totalQ, { ...tagScores });
    if (!window.__roundFinalized) {
      window.__roundFinalized = true;
      window.__roundCoins = Garage.roundCoins(score, totalQ); // authoritative (incl. perfect bonus)
      const g = getPlayerGarage(currentPlayer);
      setPlayerGarage(currentPlayer, { ...g, coins: g.coins + window.__roundCoins });
    }
  }
```

- [ ] **Step 5: Result page coin line + 去车库 button markup**

Find:

```html
      <div class="result-msg" id="result-msg"></div>
```

Insert immediately AFTER it:

```html
      <div class="result-coins" id="result-coins">本局 +<span id="result-coins-n">0</span> 🪙</div>
```

Find:

```html
      <button class="btn-leaderboard" id="btn-lb-result">🏆 排行榜</button>
```

Insert immediately AFTER it:

```html
      <button class="btn-garage" id="btn-garage-result" type="button">🔧 去车库</button>
```

Insert before `</style>`:

```css
    .result-coins { font-size:1.4rem; font-weight:900; color:#c2410c; margin-top:8px; }
```

- [ ] **Step 6: Count-up + coin-rain in showResult + wire button**

Find:

```js
  $('result-msg').textContent = msg;
  if (starCount >= 4) setTimeout(startFireworks, 400);
```

Replace with:

```js
  $('result-msg').textContent = msg;
  const earned = window.__roundCoins || 0;
  const cn = $('result-coins-n'); let cv = 0;
  cn.textContent = '0';
  const tick = setInterval(() => {
    cv = Math.min(earned, cv + Math.max(1, Math.ceil(earned / 18)));
    cn.textContent = cv;
    if (cv >= earned) clearInterval(tick);
  }, 45);
  if (earned > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let j = 0; j < 18; j++) {
      const c = document.createElement('div');
      c.textContent = '🪙';
      c.style.cssText = `position:fixed;top:-40px;left:${5+Math.random()*90}vw;font-size:${20+Math.random()*16}px;z-index:90;pointer-events:none;`;
      document.body.appendChild(c);
      c.animate([{transform:'translateY(0) rotate(0)'},{transform:`translateY(${window.innerHeight+80}px) rotate(${360+Math.random()*360}deg)`}],
        { duration:1600+Math.random()*1200, delay:j*60, easing:'cubic-bezier(.3,.1,.5,1)', fill:'forwards' })
        .finished.then(()=>c.remove()).catch(()=>c.remove());
    }
  }
  if (starCount >= 4) setTimeout(startFireworks, 400);
```

Find:

```js
$('btn-lb-result').addEventListener('click', openLeaderboard);
```

Insert immediately AFTER it:

```js
$('btn-garage-result').addEventListener('click', () => {
  playClick();
  if (currentPlayer) openGarage(currentPlayer);
});
```

- [ ] **Step 7: Verify (deterministic)**

Fresh data (clear records). Play a full 5-question round as 乐乐 answering all correctly. On result: "本局 +15 🪙" counts up, coin rain falls, result voice then coin voice. Then `evaluate_script`:

```js
() => JSON.parse(localStorage.getItem('dino_math_garage')).lele.coins
```

Expected: migration(0)=0 + 15 = `15`. Re-enter result via no double path (finish only once) — coins must not double. Click 🔧 去车库 → opens 乐乐 garage with 🪙 15.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat(garage): coin earning, fly-coins, result coin line + 去车库"
```

---

### Task 13: Flashy animations — unlock 4-act (B2) + equip shockwave (B3) + breathing (B4)

**Files:**
- Modify: `index.html` (replace `animateUnlock`/`animateEquip` stubs; add CSS for breathing & rays)

- [ ] **Step 1: Replace the stubs**

Find:

```js
function animateEquip(id, done) { if (done) done(); }   // replaced in Task 13
function animateUnlock(id) {}                            // replaced in Task 13
```

Replace with:

```js
function _cellEl(id) { return document.querySelector(`.garage-cell[data-id="${id}"]`); }

// B3 装备：旧缩出→新冲击波环爆入 + 火花，格子常驻光环由 .equipped CSS 提供
function animateEquip(id, done) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  playClick();
  if (reduce) { if (done) done(); return; }
  const cell = _cellEl(id);
  if (!cell) { if (done) done(); return; }
  const r = cell.getBoundingClientRect();
  const ring = document.createElement('div');
  ring.style.cssText = `position:fixed;left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;width:10px;height:10px;border:4px solid #66bb6a;border-radius:50%;transform:translate(-50%,-50%);z-index:9998;pointer-events:none;`;
  document.body.appendChild(ring);
  ring.animate([{width:'10px',height:'10px',opacity:1},{width:'180px',height:'180px',opacity:0}],
    {duration:520,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).finished.then(()=>ring.remove()).catch(()=>ring.remove());
  for (let j=0;j<14;j++) particles.push(new Particle(r.left+r.width/2, r.top+r.height/2, '#ffd600','star'));
  if (!fwAnimId) fwLoop();
  playTone(880,'sine',0.12,0.2); playTone(1320,'sine',0.12,0.18,0.08);
  if (done) setTimeout(done, 260);
}

// B2 解锁四幕：锁碎 → 聚光登场 → 凯旋驶过(参数化 showVehicleRush) → 烟花收尾
function animateUnlock(id) {
  const it = Garage.getItem(id);
  if (!it) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { startFireworks(1200); return; }

  const ov = $('celebrate-overlay');
  const dino = $('celebrate-dino'), txt = $('celebrate-text'), st = $('celebrate-stars');
  // 幕1 锁碎
  const cell = _cellEl(id);
  if (cell) {
    const r = cell.getBoundingClientRect();
    for (let k=0;k<10;k++){
      const sh=document.createElement('div'); sh.textContent='🔒';
      sh.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.top+8}px;font-size:16px;z-index:9998;pointer-events:none;`;
      document.body.appendChild(sh);
      const ang=Math.random()*Math.PI*2, d=60+Math.random()*90;
      sh.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},
        {transform:`translate(${Math.cos(ang)*d-50}%,${Math.sin(ang)*d-50}%) scale(0.2) rotate(${(Math.random()-0.5)*720}deg)`,opacity:0}],
        {duration:520,easing:'ease-out',fill:'forwards'}).finished.then(()=>sh.remove()).catch(()=>sh.remove());
    }
  }
  playTone(180,'sawtooth',0.18,0.3);
  // 幕2 聚光登场
  setTimeout(() => {
    txt.textContent = it.voiceName;
    st.textContent = '🎉';
    dino.textContent = it.emoji;
    dino.classList.add('garage-spotlight');
    ov.classList.add('show');
    dino.animate([{transform:'scale(0.1) rotate(-25deg)',opacity:0},
      {transform:'scale(1.25) rotate(8deg)',opacity:1,offset:0.7},
      {transform:'scale(1) rotate(0)',opacity:1}],{duration:560,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'forwards'});
  }, 360);
  // 幕3 凯旋驶过
  setTimeout(() => {
    ov.classList.remove('show');
    dino.classList.remove('garage-spotlight');
    const type = it.id === 'police' ? 'police' : (it.id === 'ambulance' ? 'ambulance' : 'police');
    showVehicleRush(it.emoji, type, 5, () => startFireworks(1400), {
      text: it.voiceName + '是你的啦！',
      sound: () => { [523,659,784,1047,1319].forEach((f,i)=>playTone(f,'sine',0.22,0.34,i*0.09)); }
    });
  }, 1260);
}
```

- [ ] **Step 2: CSS — spotlight rays + B4 breathing**

Insert before `</style>`:

```css
    .garage-spotlight { position:relative; }
    .garage-spotlight::before {
      content:''; position:absolute; inset:-80px; z-index:-1; border-radius:50%;
      background:conic-gradient(from 0deg, rgba(255,214,0,0.55), transparent 40deg,
        rgba(255,214,0,0.55) 80deg, transparent 120deg, rgba(255,214,0,0.55) 160deg,
        transparent 200deg, rgba(255,214,0,0.55) 240deg, transparent 280deg,
        rgba(255,214,0,0.55) 320deg, transparent 360deg);
      animation:spinRays 3s linear infinite;
    }
    @keyframes spinRays { to { transform:rotate(360deg); } }
    .garage-cell.afford:not(.equipped):not(.confirm) {
      animation:affordBreathe 1.8s ease-in-out infinite;
    }
    @keyframes affordBreathe {
      0%,100% { box-shadow:0 0 0 0 rgba(255,179,0,0); }
      50%     { box-shadow:0 0 0 3px rgba(255,179,0,0.55), 0 0 16px rgba(255,179,0,0.5); }
    }
```

- [ ] **Step 3: Verify**

Seed `lele` coins=60. Open garage. Affordable locked cells visibly breathe gold. Tap 🚀 twice → 4-act plays: 🔒 shards scatter → emoji spotlights with rotating gold rays under dim overlay → rocket rushes across screen with "火箭是你的啦！" + jingle (NOT siren) → fireworks → voice "太棒了！火箭是你的啦！". After it, garage shows 🚀 owned, coins 20. Tap 🚀 → equip: green shockwave ring + sparks + chime, cell gets persistent green glow, voice "换好啦！现在开火箭！呜——". Re-test with DevTools emulate `prefers-reduced-motion: reduce`: unlock still grants (coins/owned change) with only brief fireworks, no crash.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(garage): unlock 4-act, equip shockwave, affordable breathing"
```

---

### Task 14: Clear-data also resets garage

**Files:**
- Modify: `index.html` (`btn-clear-data` handler)

- [ ] **Step 1: Fail-first**

Unlock something, then use 清除所有记录. `evaluate_script`: `() => localStorage.getItem('dino_math_garage')` → currently still present (non-null) = bug.

- [ ] **Step 2: Add garage reset**

Find:

```js
  if (confirm('确定要清除所有记录吗？这个操作不能撤回哦！')) {
    clearRecords();
    localStorage.removeItem(NAMES_KEY);
    PLAYERS.lele.name = DEFAULT_NAMES.lele;
    PLAYERS.haohao.name = DEFAULT_NAMES.haohao;
    renderLeaderboard();
    updatePlayerPreview();
  }
```

Replace with:

```js
  if (confirm('确定要清除所有记录吗？这个操作不能撤回哦！')) {
    clearRecords();
    clearGarage();
    localStorage.removeItem(NAMES_KEY);
    PLAYERS.lele.name = DEFAULT_NAMES.lele;
    PLAYERS.haohao.name = DEFAULT_NAMES.haohao;
    renderLeaderboard();
    updatePlayerPreview();
  }
```

- [ ] **Step 3: Verify**

Unlock rocket for 乐乐 → 清除所有记录 → `evaluate_script`: `() => localStorage.getItem('dino_math_garage')` → `null`. Reopen 乐乐 garage: only default police/brontosaurus owned, coins 0.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(garage): clear-data resets garage"
```

---

### Task 15: Full acceptance pass vs spec §13

**Files:** none (verification only) — produce `docs/superpowers/plans/2026-05-17-acceptance-checklist.md` recording pass/fail.

- [ ] **Step 1: Run unit suite**

Run: `node --test tests/garage.test.js`
Expected: ALL PASS (Tasks 1–5 logic).

- [ ] **Step 2: Walk spec §13 acceptance criteria**

For each, record result in the checklist doc:
1. Every new-UI string voiced; multi-line via queue not truncated (player-select entry, result); muted → silent (toggle 🔇).
2. Coin/unlock/equip animations present & on-brand; with `prefers-reduced-motion` they degrade and **state still correct** (coins/owned change).
3. C3 zero-regression: with default garage, ⭐/星星塔/称号/排行榜identical; theme-match still 🚓+police siren+"🚓 破案成功！" (showVehicleRush defaults).
4. Per-player isolation: unlock for 乐乐 doesn't change 昊昊; coins credited exactly once per round (finish a round, confirm only +roundCoins once).
5. Equip any vehicle → avatar updates everywhere (player-select / quiz / progress-dino / celebrate / vehicle-rush / leaderboard); stories & siren still by `preferTag`.
6. CATALOG single source: emulate by checking owned/equipped are ids in localStorage; no emoji-equality bug (race 🏎️ unlock+equip works).
7. **C4 no-voice operable:** mute (🔇) AND DevTools-block speech → can still see affordable (green) vs not (red), unlock & equip purely by emoji/number/color/lock/check.
8. localStorage offline; old-player migration once (seed records, first garage open grants capped coins, second open unchanged); clear-data resets garage.

- [ ] **Step 3: Commit checklist**

```bash
git add docs/superpowers/plans/2026-05-17-acceptance-checklist.md
git commit -m "test(garage): phase-1 acceptance pass vs spec §13"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** §4 dual currency → T3/T12; §5 id model+migration → T2/T6; §6 economy+idempotent → T3/T12; §7 catalog → T1; §8 equipped single-source+3 bypass+parametrized rush → T7; §9 player-select+garage page+result → T9/T10/T12; §10 speakQueue+lines → T5/T8; §11 animations B1/B2/B3/B4+result → T12/T13; §12 edges → T2/T11/T13; §13 acceptance → T15; §15 testability → T1–T5 node tests + chrome-devtools assertions. No uncovered section.
- **Placeholder scan:** the only intentionally-empty bodies (`handleGarageCellTap`, `animateEquip`/`animateUnlock`) are explicitly created as runnable stubs and replaced in a named later task with full code shown — not placeholders.
- **Type consistency:** API names fixed in Conventions and reused verbatim: `getItem/byKind/DEFAULTS/migrationCoins/initEntry/normalize/COIN_PER_CORRECT/PERFECT_BONUS/roundCoins/owns/isEquipped/canAfford/unlock/equip/v*`; index.html bridges `getPlayerGarage/setPlayerGarage/clearGarage/equippedEmojis/speakQueue/openGarage/renderGarage/handleGarageCellTap/flyCoins/animateEquip/animateUnlock`; round globals `window.__roundCoins/__roundFinalized` set in T12, read in T8 (safe default 0). Consistent across tasks.
