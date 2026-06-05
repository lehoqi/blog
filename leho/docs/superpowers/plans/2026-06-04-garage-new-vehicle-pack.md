# Garage New Vehicle Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add eight road/rail vehicles to the root garage while preserving the old 11-vehicle `车库大师` milestone and adding a new 19-vehicle top collection medal.

**Architecture:** The garage UI already renders from `Garage.CATALOG`, so this change stays data-first. `garage.js` owns catalog data and vehicle family mapping; `index.html` owns medal definitions; Node static tests lock down both contracts.

**Tech Stack:** Plain HTML/CSS/JavaScript, CommonJS module export for `garage.js`, Node built-in `node:test`, no build step.

---

## File Structure

- Modify `tests/garage.test.js`: update catalog count assertions, add representative assertions for the new vehicles, and extend `vehicleFamily()` expectations.
- Modify `garage.js`: add eight `kind: 'vehicle'` catalog rows and extend `VEHICLE_FAMILY` for those ids.
- Modify `tests/index-adventure-flow.test.js`: add static assertions for legacy and expanded garage collection medals.
- Modify `index.html`: revise `garage_master` to preserve the old 11-vehicle milestone and add `mega_garage_master` for all 19 vehicles.

No new storage keys, UI pages, CSS, or schema migrations are needed.

---

### Task 1: Garage Catalog Tests

**Files:**
- Modify: `tests/garage.test.js`
- Test: `tests/garage.test.js`

- [ ] **Step 1: Update the catalog contents test**

In `tests/garage.test.js`, replace the existing `test('CATALOG contents match spec §7', ... )` block with:

```js
test('CATALOG contents match expanded vehicle pack spec', () => {
  assert.equal(G.CATALOG.length, 22);
  assert.equal(G.byKind('vehicle').length, 19);
  assert.equal(G.byKind('dino').length, 3);

  assert.equal(G.getItem('rocket').emoji, '🚀');
  assert.equal(G.getItem('rocket').price, 40);
  assert.equal(G.getItem('ufo').price, 60);
  assert.equal(G.getItem('police').emoji, '🚓');
  assert.equal(G.getItem('dragon').price, 35);

  assert.equal(G.getItem('car').emoji, '🚗');
  assert.equal(G.getItem('car').price, 18);
  assert.equal(G.getItem('suv').emoji, '🚙');
  assert.equal(G.getItem('suv').price, 22);
  assert.equal(G.getItem('minibus').emoji, '🚐');
  assert.equal(G.getItem('minibus').price, 24);
  assert.equal(G.getItem('pickup').emoji, '🛻');
  assert.equal(G.getItem('pickup').price, 28);
  assert.equal(G.getItem('truck').emoji, '🚚');
  assert.equal(G.getItem('truck').price, 30);
  assert.equal(G.getItem('motorcycle').emoji, '🏍️');
  assert.equal(G.getItem('motorcycle').price, 35);
  assert.equal(G.getItem('tram').emoji, '🚋');
  assert.equal(G.getItem('tram').price, 40);
  assert.equal(G.getItem('bullettrain').emoji, '🚄');
  assert.equal(G.getItem('bullettrain').price, 45);

  assert.equal(G.getItem('nope'), undefined);
});
```

- [ ] **Step 2: Update the vehicle family test**

In `tests/garage.test.js`, replace the existing `test('vehicleFamily maps all 11 vehicles to a family; unknown/garbage -> general', ... )` block with:

```js
test('vehicleFamily maps all 19 vehicles to a family; unknown/garbage -> general', () => {
  assert.equal(G.vehicleFamily('police'), 'police');
  assert.equal(G.vehicleFamily('ambulance'), 'ambulance');
  assert.equal(G.vehicleFamily('fire'), 'fire');
  assert.equal(G.vehicleFamily('schoolbus'), 'everyday');
  assert.equal(G.vehicleFamily('taxi'), 'everyday');
  assert.equal(G.vehicleFamily('train'), 'everyday');
  assert.equal(G.vehicleFamily('tractor'), 'everyday');
  assert.equal(G.vehicleFamily('race'), 'adventure');
  assert.equal(G.vehicleFamily('heli'), 'adventure');
  assert.equal(G.vehicleFamily('rocket'), 'adventure');
  assert.equal(G.vehicleFamily('ufo'), 'adventure');

  assert.equal(G.vehicleFamily('car'), 'everyday');
  assert.equal(G.vehicleFamily('suv'), 'everyday');
  assert.equal(G.vehicleFamily('minibus'), 'everyday');
  assert.equal(G.vehicleFamily('pickup'), 'everyday');
  assert.equal(G.vehicleFamily('truck'), 'everyday');
  assert.equal(G.vehicleFamily('motorcycle'), 'everyday');
  assert.equal(G.vehicleFamily('tram'), 'everyday');
  assert.equal(G.vehicleFamily('bullettrain'), 'everyday');

  assert.equal(G.vehicleFamily('bogus'), 'general');
  assert.equal(G.vehicleFamily(undefined), 'general');
  assert.equal(G.vehicleFamily(42), 'general');
  G.byKind('vehicle').forEach(it => {
    assert.notEqual(G.vehicleFamily(it.id), 'general', 'vehicle ' + it.id + ' must map to a real family');
  });
});
```

- [ ] **Step 3: Run garage tests and verify they fail**

Run:

```bash
node --test tests/garage.test.js
```

Expected: FAIL. The failures should include the old `G.CATALOG.length` / `G.byKind('vehicle').length` values and missing new item lookups or family mappings.

---

### Task 2: Garage Catalog Implementation

**Files:**
- Modify: `garage.js`
- Test: `tests/garage.test.js`

- [ ] **Step 1: Add the new catalog vehicles**

In `garage.js`, insert these rows after the existing `taxi` row and before the existing `race` row in `CATALOG`:

```js
  { id:'car',          kind:'vehicle', emoji:'🚗', name:'小汽车', voiceName:'小汽车', price:18 },
  { id:'suv',          kind:'vehicle', emoji:'🚙', name:'越野车', voiceName:'越野车', price:22 },
  { id:'minibus',      kind:'vehicle', emoji:'🚐', name:'面包车', voiceName:'面包车', price:24 },
  { id:'pickup',       kind:'vehicle', emoji:'🛻', name:'皮卡车', voiceName:'皮卡车', price:28 },
  { id:'truck',        kind:'vehicle', emoji:'🚚', name:'货车',   voiceName:'货车',   price:30 },
  { id:'motorcycle',   kind:'vehicle', emoji:'🏍️', name:'摩托车', voiceName:'摩托车', price:35 },
  { id:'tram',         kind:'vehicle', emoji:'🚋', name:'电车',   voiceName:'电车',   price:40 },
  { id:'bullettrain',  kind:'vehicle', emoji:'🚄', name:'高铁',   voiceName:'高铁',   price:45 },
```

The catalog must contain exactly one `truck` id.

- [ ] **Step 2: Extend `VEHICLE_FAMILY`**

In `garage.js`, replace the current `everyday` line inside `VEHICLE_FAMILY`:

```js
  schoolbus: 'everyday', taxi: 'everyday', train: 'everyday', tractor: 'everyday',
```

with:

```js
  schoolbus: 'everyday', taxi: 'everyday', train: 'everyday', tractor: 'everyday',
  car: 'everyday', suv: 'everyday', minibus: 'everyday', pickup: 'everyday',
  truck: 'everyday', motorcycle: 'everyday', tram: 'everyday', bullettrain: 'everyday',
```

- [ ] **Step 3: Run garage tests and verify they pass**

Run:

```bash
node --test tests/garage.test.js
```

Expected: PASS. All `garage.js` catalog, ownership, unlock, and family mapping tests should pass.

- [ ] **Step 4: Commit catalog changes**

Run:

```bash
git add garage.js tests/garage.test.js
git commit -m "feat: expand garage vehicle catalog"
```

Expected: commit succeeds with only `garage.js` and `tests/garage.test.js` staged.

---

### Task 3: Medal Definition Tests

**Files:**
- Modify: `tests/index-adventure-flow.test.js`
- Test: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add a static medal test**

In `tests/index-adventure-flow.test.js`, add this test after `test('results persist per-question-type stats and ability trophies', ... )` and before `test('player previews surface unlocked trophies as the child-facing reward', ... )`:

```js
test('garage collection medals preserve legacy completion and add expanded completion', () => {
  const medalBlock = between('const ALL_MEDALS = [', '\n];\n\nfunction topTrophiesForPlayer');
  assert.match(
    medalBlock,
    /id: 'garage_master'[\s\S]*label: '车库大师'[\s\S]*ownedVehicleCount >= 11/,
    'garage_master should remain the legacy 11-vehicle completion medal'
  );
  assert.match(
    medalBlock,
    /id: 'mega_garage_master'[\s\S]*label: '超级车库大师'[\s\S]*ownsAllVehicles === true/,
    'mega_garage_master should represent expanded full garage completion'
  );
});
```

- [ ] **Step 2: Run index static tests and verify they fail**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL. The failure should mention `garage_master should remain the legacy 11-vehicle completion medal` because current `garage_master` still uses `ownsAllVehicles === true`.

---

### Task 4: Medal Definition Implementation

**Files:**
- Modify: `index.html`
- Test: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Update the medal definitions**

In `index.html`, find these adjacent medal rows:

```js
  { id: 'collector_5',  icon: '🚙', label: '小小收藏家',  check: st => st.ownedVehicleCount >= 5 },
  { id: 'garage_master',icon: '🏰', label: '车库大师',    check: st => st.ownsAllVehicles === true },
  { id: 'dragon_rider', icon: '🐲', label: '驯龙高手',    check: st => st.ownsDragon === true },
```

Replace them with:

```js
  { id: 'collector_5',  icon: '🚙', label: '小小收藏家',  check: st => st.ownedVehicleCount >= 5 },
  { id: 'garage_master',icon: '🏰', label: '车库大师',    check: st => st.ownedVehicleCount >= 11 },
  { id: 'mega_garage_master', icon: '🏁', label: '超级车库大师', check: st => st.ownsAllVehicles === true },
  { id: 'dragon_rider', icon: '🐲', label: '驯龙高手',    check: st => st.ownsDragon === true },
```

- [ ] **Step 2: Run index static tests and verify they pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS. The new static medal test and existing adventure flow tests should pass.

- [ ] **Step 3: Commit medal changes**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: preserve legacy garage master medal"
```

Expected: commit succeeds with only `index.html` and `tests/index-adventure-flow.test.js` staged.

---

### Task 5: Full Verification

**Files:**
- Verify: `garage.js`
- Verify: `index.html`
- Verify: `tests/garage.test.js`
- Verify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test tests/garage.test.js tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
node --test tests/*.test.js
```

Expected: PASS.

- [ ] **Step 3: Inspect unstaged changes**

Run:

```bash
git status --short
```

Expected: no unstaged changes from this feature. If `../.DS_Store` is still listed, leave it untouched because it predates this work.

- [ ] **Step 4: Manual browser smoke check**

Run a local server:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/index.html` and verify:

- The root garage vehicle grid includes 19 vehicle cells.
- New items show locked prices until purchased.
- A purchased new vehicle can be equipped.
- Equipping a new vehicle uses the existing everyday route theme rather than the space route theme.
- The leaderboard medal cabinet includes both `车库大师` and `超级车库大师`.

Stop the server after verification.

---

## Self-Review

- Spec coverage: the plan covers catalog additions, family mapping, preserved old collection medal, new expanded collection medal, tests, and verification. The spec's non-goals are respected because no storage schema, coin logic, default ownership, or garage layout changes are planned.
- Placeholder scan: no placeholder steps are present.
- Type consistency: the ids `car`, `suv`, `minibus`, `pickup`, `truck`, `motorcycle`, `tram`, `bullettrain`, and `mega_garage_master` are used consistently across tests, implementation snippets, and verification.
