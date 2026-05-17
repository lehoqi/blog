# Medal Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 12 new medals (16 → 28) — higher-tier milestones + garage/collection-themed — driven by a unified `medalStats` (existing stats + garage-derived, monotonic), with in-garage celebration on unlock/equip, and zero regression to existing medals and the result-page flow.

**Architecture:** Pure garage-derived helpers (`lifetimeCoins`, `ownedCount`, `ownsAll`) go in `garage.js` (node-tested). `index.html` adds `medalStats(pid)` (spreads `getPlayerStats` + garage fields) and swaps the 4 medal-path `getPlayerStats` calls to it (old medals read old fields untouched → zero regression). 12 medal entries append to `ALL_MEDALS`. A reusable `celebrateNewMedalsIfAny(pid, beforeSet)` (built on the existing `findNewlyUnlocked`) fires the concise celebration; `animateUnlock` gains an optional `onDone` so the medal celebration sequences cleanly after the unlock cinematic. Result-page `new-medal-box` path is unchanged except its stats source.

**Tech Stack:** Single static `index.html` (inline JS), sibling `garage.js` (UMD-lite ES5), Node `node:test`, chrome-devtools MCP for browser verification.

**Spec:** `docs/superpowers/specs/2026-05-17-medal-expansion-design.md` (read before starting).

---

## Conventions

- Branch `feature/game-enhancements` (already checked out).
- `garage.js` stays pure ES5 (no DOM/IO/Date/random), UMD-lite tail intact; extend the `GarageAPI` object literal (keep all 25 existing members).
- Locate `index.html` edit anchors by the quoted snippet (line numbers drift). If an anchor does not match exactly, STOP and report — do not guess.
- Final API names (used across tasks): `Garage.lifetimeCoins(records)`, `Garage.ownedCount(owned, kind)`, `Garage.ownsAll(owned, kind)`; index.html `medalStats(pid)`, `snapshotMedals(pid)`, `celebrateNewMedalsIfAny(pid, beforeSet)`; `animateUnlock(id, onDone)`.
- Run pure tests with `node --test tests/garage.test.js`.
- Commit after every task.

---

## File Structure

- **Modify `garage.js`** — add 3 pure derivation helpers + expose on `GarageAPI`.
- **Modify `tests/garage.test.js`** — node tests for the 3 helpers.
- **Modify `index.html`** — `medalStats`/`snapshotMedals`; swap 4 medal-path stats sources; append 12 medals; fix static placeholder; `celebrateNewMedalsIfAny` + `animateUnlock(id,onDone)`; wire garage celebration.

---

### Task 1: garage.js pure derivations + node tests

**Files:** Modify `garage.js`, Modify `tests/garage.test.js`

- [ ] **Step 1: Append failing tests** to `tests/garage.test.js`:

```js
test('lifetimeCoins sums roundCoins over records (monotonic, ignores garbage)', () => {
  assert.equal(G.lifetimeCoins([]), 0);
  assert.equal(G.lifetimeCoins(undefined), 0);
  // one perfect 5/5 round = roundCoins(5,5)=15; a 3/5 = 6  -> 21
  assert.equal(G.lifetimeCoins([{score:5,total:5},{score:3,total:5}]), 21);
  // bad entries contribute 0, not NaN
  assert.equal(G.lifetimeCoins([{score:5,total:5},{},{score:'x',total:'y'}]), 15);
});

test('ownedCount counts owned ids by catalog kind', () => {
  assert.equal(G.ownedCount(['police','brontosaurus'], 'vehicle'), 1);
  assert.equal(G.ownedCount(['police','brontosaurus'], 'dino'), 1);
  assert.equal(G.ownedCount(['police','rocket','ufo','brontosaurus','dragon'], 'vehicle'), 3);
  assert.equal(G.ownedCount(['police','bogus'], 'vehicle'), 1); // unknown id ignored
  assert.equal(G.ownedCount(null, 'vehicle'), 0);
});

test('ownsAll true only when every catalog item of kind is owned', () => {
  const allV = G.byKind('vehicle').map(it => it.id);
  assert.equal(G.ownsAll(allV, 'vehicle'), true);
  assert.equal(G.ownsAll(allV.slice(1), 'vehicle'), false);
  assert.equal(G.ownsAll(['brontosaurus','trex','dragon'], 'dino'), true);
  assert.equal(G.ownsAll(['brontosaurus','trex'], 'dino'), false);
  assert.equal(G.ownsAll([], 'vehicle'), false);
  assert.equal(G.ownsAll(null, 'dino'), false);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `G.lifetimeCoins is not a function`.

- [ ] **Step 3: Implement in `garage.js`** — add BEFORE the `var GarageAPI = {` line:

```js
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
```

Then extend the `GarageAPI` object literal (keep all existing members), adding:

```js
  lifetimeCoins: lifetimeCoins,
  ownedCount: ownedCount,
  ownsAll: ownsAll,
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test tests/garage.test.js`
Expected: PASS (all prior + 3 new).

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(medals): garage pure derivations (lifetimeCoins/ownedCount/ownsAll)"
```

---

### Task 2: medalStats + snapshotMedals; swap medal-path stats source (zero-regression)

**Files:** Modify `index.html`

- [ ] **Step 1: Fail-first check**

chrome-devtools MCP: navigate `file:///Users/ip/dev/code/blog/leho/index.html`; `evaluate_script`: `() => typeof window.medalStats` → expect `"undefined"`.

- [ ] **Step 2: Add `medalStats` + `snapshotMedals`**

Find:

```js
function detectNewMedals(playerId) {
  if (!playerId) return [];
  const statsBefore = getPlayerStats(playerId);
  const beforeSet = new Set(ALL_MEDALS.filter(m => m.check(statsBefore)).map(m => m.id));
  return { beforeSet };
}
function findNewlyUnlocked(playerId, beforeSet) {
  if (!playerId) return [];
  const statsAfter = getPlayerStats(playerId);
  return ALL_MEDALS.filter(m => !beforeSet.has(m.id) && m.check(statsAfter));
}
```

Replace with:

```js
// 统一勋章数据源：老字段透传 + 车库派生（单调字段，见 spec §3/§4）
function medalStats(playerId) {
  const s = getPlayerStats(playerId);
  let g;
  try { g = getPlayerGarage(playerId); } catch (e) { g = { coins: 0, owned: [] }; }
  const owned = Array.isArray(g.owned) ? g.owned : [];
  return {
    ...s,
    coinsNow: g.coins || 0,
    lifetimeCoins: Garage.lifetimeCoins(s.records),
    ownedVehicleCount: Garage.ownedCount(owned, 'vehicle'),
    ownedDinoCount: Garage.ownedCount(owned, 'dino'),
    ownedTotal: owned.length,
    ownsAllVehicles: Garage.ownsAll(owned, 'vehicle'),
    ownsDragon: owned.indexOf('dragon') !== -1
  };
}
function snapshotMedals(playerId) {
  if (!playerId) return new Set();
  const st = medalStats(playerId);
  return new Set(ALL_MEDALS.filter(m => m.check(st)).map(m => m.id));
}
function detectNewMedals(playerId) {
  if (!playerId) return [];
  return { beforeSet: snapshotMedals(playerId) };
}
function findNewlyUnlocked(playerId, beforeSet) {
  if (!playerId) return [];
  const statsAfter = medalStats(playerId);
  return ALL_MEDALS.filter(m => !beforeSet.has(m.id) && m.check(statsAfter));
}
window.medalStats = medalStats; // test/debug hook
```

- [ ] **Step 3: Swap renderLeaderboard's medal stats source**

Find (these two lines begin `renderLeaderboard` — confirm the surrounding function is `renderLeaderboard`, the one that builds the medal cabinet, NOT `renderResultPK`):

```js
  const leleStats = getPlayerStats('lele');
  const haohaoStats = getPlayerStats('haohao');
  const leleLeading = leleStats.totalStars > haohaoStats.totalStars;
  const haohaoLeading = haohaoStats.totalStars > leleStats.totalStars;
  const maxStars = Math.max(leleStats.totalStars, haohaoStats.totalStars, 1);
```

Replace with:

```js
  const leleStats = medalStats('lele');
  const haohaoStats = medalStats('haohao');
  const leleLeading = leleStats.totalStars > haohaoStats.totalStars;
  const haohaoLeading = haohaoStats.totalStars > leleStats.totalStars;
  const maxStars = Math.max(leleStats.totalStars, haohaoStats.totalStars, 1);
```

(Note: `medalStats` spreads all `getPlayerStats` fields, so star-tower/titles/medal checks all keep working; this only ADDS garage fields. Do NOT touch `renderResultPK`'s separate `getPlayerStats('lele')` block.)

- [ ] **Step 4: Verify pass + zero-regression**

chrome-devtools MCP, navigate fresh:
- `() => { localStorage.clear(); return 'cleared'; }`, reload.
- `() => { const m = window.medalStats('lele'); return [typeof window.medalStats, m.games, m.totalStars, m.lifetimeCoins, m.ownedTotal, m.ownsDragon]; }`
  Expected: `["function",0,0,0,2,false]` (fresh: no games, default garage owns 2, no dragon).
- Zero-regression: seed a finished record + open leaderboard, confirm existing medals still compute. `() => { localStorage.setItem('dino_math_records', JSON.stringify([{player:'lele',score:5,total:5,stars:5,date:new Date().toISOString(),tagScores:{police:5}}])); return 's'; }`, reload, `() => { const m=window.medalStats('lele'); return [m.games, m.perfectGames, m.totalStars]; }` → expect `[1,1,5]` (old fields intact through medalStats).
- node sanity: `cd /Users/ip/dev/code/blog/leho && node --test tests/garage.test.js` → all pass.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(medals): unified medalStats + snapshotMedals, swap medal stats source"
```

---

### Task 3: Append 12 medals + fix static placeholder

**Files:** Modify `index.html`

- [ ] **Step 1: Append the 12 medals**

Find:

```js
  { id: 'ambulance_30', icon: '🏥', label: '金牌医生',    check: st => st.totalTagScores && st.totalTagScores.ambulance >= 30 },
];
```

Replace with:

```js
  { id: 'ambulance_30', icon: '🏥', label: '金牌医生',    check: st => st.totalTagScores && st.totalTagScores.ambulance >= 30 },
  { id: 'fifty_games',  icon: '🏅', label: '五十次挑战',  check: st => st.games >= 50 },
  { id: 'stars_200',    icon: '💫', label: '200颗星星',   check: st => st.totalStars >= 200 },
  { id: 'perfect_10',   icon: '👑', label: '满分十次',    check: st => st.perfectGames >= 10 },
  { id: 'streak7',      icon: '☄️', label: '七连满分',    check: st => st.streak >= 7 },
  { id: 'police_50',    icon: '🎖️', label: '警界传奇',    check: st => st.totalTagScores && st.totalTagScores.police >= 50 },
  { id: 'ambulance_50', icon: '🏆', label: '急救传奇',    check: st => st.totalTagScores && st.totalTagScores.ambulance >= 50 },
  { id: 'first_unlock', icon: '🔓', label: '第一次解锁',  check: st => st.ownedTotal > 2 },
  { id: 'collector_5',  icon: '🚙', label: '小小收藏家',  check: st => st.ownedVehicleCount >= 5 },
  { id: 'garage_master',icon: '🏰', label: '车库大师',    check: st => st.ownsAllVehicles === true },
  { id: 'dragon_rider', icon: '🐲', label: '驯龙高手',    check: st => st.ownsDragon === true },
  { id: 'coin_saver_50',icon: '🪙', label: '小财主',      check: st => st.lifetimeCoins >= 50 },
  { id: 'coin_saver_150',icon:'💰', label: '大富翁',      check: st => st.lifetimeCoins >= 150 },
];
```

- [ ] **Step 2: Fix static placeholder**

Find:

```html
        <div class="medal-progress">已解锁 0 / 12 枚勋章</div>
```

Replace with:

```html
        <div class="medal-progress">已解锁 0 / 28 枚勋章</div>
```

- [ ] **Step 3: Verify (chrome-devtools MCP)**

- navigate fresh; `() => { localStorage.clear(); return 'c'; }`; reload.
- `() => { const ids = (window.medalStats, null); return null; }` — instead read ALL_MEDALS length indirectly: open leaderboard and read progress. Click 开始冒险 then 排行榜 (`() => document.getElementById('btn-start').click()`, `() => document.getElementById('btn-lb-player').click()`), then `() => document.querySelector('.medal-progress').textContent` → expect contains `/ 28`.
- Garage-medal unlock check: seed an owned-rich garage, open leaderboard, assert `garage_master`/`dragon_rider`/`collector_5` show unlocked. `() => { const all=JSON.parse(localStorage.getItem('dino_math_garage')||'{}'); const allV=window.Garage.byKind('vehicle').map(i=>i.id); all.lele={coins:0,owned:allV.concat(['brontosaurus','dragon']),equippedVehicle:'police',equippedDino:'brontosaurus',migrated:true}; localStorage.setItem('dino_math_garage',JSON.stringify(all)); return 'seeded'; }`, reload, open leaderboard, then count unlocked medal cells: `() => document.querySelectorAll('#medal-grid .medal-item.unlocked').length` → expect ≥ 4 (first_unlock, collector_5, garage_master, dragon_rider all satisfied for lele).
- node sanity: `node --test tests/garage.test.js` → all pass.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(medals): add 12 medals (higher-tier + garage/collection) + fix progress placeholder"
```

---

### Task 4: In-garage medal celebration + animateUnlock(id, onDone)

**Files:** Modify `index.html`

- [ ] **Step 1: Add `celebrateNewMedalsIfAny`**

Find:

```js
function snapshotMedals(playerId) {
```

Insert IMMEDIATELY BEFORE it:

```js
// 简洁勋章庆祝（车库内用）：图标放大弹入 + 金色粒子 + speakQueue 语音；纯装饰
function celebrateNewMedalsIfAny(playerId, beforeSet) {
  const nm = findNewlyUnlocked(playerId, beforeSet);
  if (!nm.length) return;
  speakQueue(nm.map(m => '获得新勋章！' + m.label));
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  nm.forEach((m, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.textContent = m.icon;
      el.style.cssText = 'position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);font-size:96px;z-index:9998;pointer-events:none;filter:drop-shadow(0 8px 24px rgba(0,0,0,.4));';
      document.body.appendChild(el);
      el.animate([
        { transform:'translate(-50%,-50%) scale(0.1) rotate(-25deg)', opacity:0 },
        { transform:'translate(-50%,-50%) scale(1.25) rotate(8deg)',  opacity:1, offset:0.6 },
        { transform:'translate(-50%,-50%) scale(1) rotate(0)',        opacity:1, offset:0.8 },
        { transform:'translate(-50%,-50%) scale(1) rotate(0)',        opacity:0 }
      ], { duration:1600, easing:'cubic-bezier(.34,1.56,.64,1)', fill:'forwards' })
        .finished.then(() => el.remove()).catch(() => el.remove());
      const cx = window.innerWidth/2, cy = window.innerHeight*0.38;
      for (let j=0;j<16;j++) particles.push(new Particle(cx, cy, '#ffd600', 'star'));
      if (!fwAnimId) fwLoop();
    }, i * 1500);
  });
}
```

- [ ] **Step 2: Give `animateUnlock` an optional `onDone`**

Find:

```js
function animateUnlock(id) {
  const it = Garage.getItem(id);
  if (!it) return;
  if (_unlockCleanup) { _unlockCleanup(); _unlockCleanup = null; }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { startFireworks(1200); return; }
```

Replace with:

```js
function animateUnlock(id, onDone) {
  const it = Garage.getItem(id);
  if (!it) { if (onDone) onDone(); return; }
  if (_unlockCleanup) { _unlockCleanup(); _unlockCleanup = null; }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { startFireworks(1200); if (onDone) onDone(); return; }
```

Then find (the 幕3 fireworks-finale callback inside `animateUnlock`):

```js
    showVehicleRush(it.emoji, type, 5, () => startFireworks(1400), {
      text: it.voiceName + '是你的啦！',
      sound: () => { [523,659,784,1047,1319].forEach((f,i)=>playTone(f,'sine',0.22,0.34,i*0.09)); }
    });
```

Replace with:

```js
    showVehicleRush(it.emoji, type, 5, () => { startFireworks(1400); if (onDone) onDone(); }, {
      text: it.voiceName + '是你的啦！',
      sound: () => { [523,659,784,1047,1319].forEach((f,i)=>playTone(f,'sine',0.22,0.34,i*0.09)); }
    });
```

- [ ] **Step 3: Wire celebration into `handleGarageCellTap`**

Find:

```js
function handleGarageCellTap(id) {
  const pid = currentGaragePlayer;
  const it = Garage.getItem(id);
  if (!it) return;
  const g = getPlayerGarage(pid);
```

Replace with:

```js
function handleGarageCellTap(id) {
  const pid = currentGaragePlayer;
  const it = Garage.getItem(id);
  if (!it) return;
  const _medalBefore = snapshotMedals(pid);
  const g = getPlayerGarage(pid);
```

Then find the equip branch:

```js
    setPlayerGarage(pid, ng);
    animateEquip(id, () => { renderGarage(); });   // Task 13
    speak(Garage.vEquipped(it.voiceName));
    return;
```

Replace with:

```js
    setPlayerGarage(pid, ng);
    animateEquip(id, () => { renderGarage(); celebrateNewMedalsIfAny(pid, _medalBefore); });
    speak(Garage.vEquipped(it.voiceName));
    return;
```

Then find the unlock commit tail:

```js
  setPlayerGarage(pid, ng);                  // state persisted before animation
  renderGarage();                            // reflects new coins/owned now
  speak(Garage.vUnlocked(it.voiceName));
  animateUnlock(id);                          // Task 13 — pure decoration
}
```

Replace with:

```js
  setPlayerGarage(pid, ng);                  // state persisted before animation
  renderGarage();                            // reflects new coins/owned now
  speak(Garage.vUnlocked(it.voiceName));
  animateUnlock(id, () => celebrateNewMedalsIfAny(pid, _medalBefore)); // medal pop sequenced after cinematic
}
```

- [ ] **Step 4: Verify (chrome-devtools MCP)**

- navigate fresh; clear: `() => { localStorage.clear(); return 'c'; }`; reload.
- Seed lele with coins 60 and default owned (so first unlock crosses `ownedTotal>2` → `first_unlock`): `() => { const a=JSON.parse(localStorage.getItem('dino_math_garage')||'{}'); a.lele={coins:60,owned:['police','brontosaurus'],equippedVehicle:'police',equippedDino:'brontosaurus',migrated:true}; localStorage.setItem('dino_math_garage',JSON.stringify(a)); return 's'; }`, reload.
- Open lele garage: `() => document.getElementById('btn-start').click()`, `() => document.getElementById('btn-garage-lele').click()`.
- Stub speech to record: `() => { window.__spoken=[]; const SS=window.speechSynthesis; SS.speak=u=>{window.__spoken.push(u.text); setTimeout(()=>u.onend&&u.onend(),5);}; SS.cancel=()=>{}; return 'stub'; }`.
- Unlock rocket (tap twice): `() => { const q='#garage-grid-vehicle .garage-cell[data-id="rocket"]'; document.querySelector(q).click(); document.querySelector(q).click(); return 'tapped'; }`. Wait ~6500ms for the unlock cinematic + onDone, then `() => window.__spoken` → expect array to include `"获得新勋章！第一次解锁"` (first_unlock triggered: ownedTotal went 2→3).
- State intact: `() => { const e=JSON.parse(localStorage.getItem('dino_math_garage')).lele; return [e.coins, e.owned.includes('rocket')]; }` → `[20, true]`.
- Equip-path celebration (re-seed so an equip crosses a medal — equip alone doesn't change owned, so use it to confirm NO false medal & no crash): tap rocket once (now owned→equip): `() => { document.querySelector('#garage-grid-vehicle .garage-cell[data-id="rocket"]').click(); return 'equip'; }`, wait ~600ms, `() => JSON.parse(localStorage.getItem('dino_math_garage')).lele.equippedVehicle` → `"rocket"`; no console errors (`list_console_messages`).
- Reduced-motion: monkey-patch `window.matchMedia` to force reduce; re-seed coins 60 default owned; reload; open garage; unlock heli twice; wait ~1500ms; `() => [JSON.parse(localStorage.getItem('dino_math_garage')).lele.owned.includes('heli'), window.__spoken && window.__spoken.some(t=>t.indexOf('获得新勋章')===0)]` → expect `[true, true]` (state commits, voice still fires, no animation, no error).
- node sanity: `node --test tests/garage.test.js` → all pass.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(medals): in-garage medal celebration + animateUnlock onDone"
```

---

### Task 5: Acceptance pass vs spec §8

**Files:** Create `docs/superpowers/plans/2026-05-17-medal-acceptance-checklist.md`

- [ ] **Step 1: Unit suite**

Run: `node --test tests/garage.test.js` — record exact pass/fail (expect all pass).

- [ ] **Step 2: Walk spec §8 acceptance criteria** (verify each via chrome-devtools MCP, record PASS/FAIL + evidence; be honest):

1. **Zero-regression of old 16 medals.** Seed records giving lele games≥1, perfect≥1, stars, police tag; open leaderboard before/after the change is conceptually identical — verify the 16 original ids still unlock at their thresholds (e.g. `first_game`, `perfect`, `stars_10`, `police_10`) and result-page new-medal announcement still works for a played round.
2. **28 shown, progress `X / 28`.** Fresh data → `.medal-progress` contains `/ 28`; `#medal-grid .medal-item` count == 28.
3. **Garage medal in-place celebration.** From default garage, unlocking the 3rd item pops `first_unlock` (`获得新勋章！第一次解锁` spoken); collecting all vehicles → `garage_master`; owning `dragon` → `驯龙高手`.
4. **Coin medals monotonic.** Drive lifetimeCoins ≥ 50 via records; `coin_saver_50` unlocked; then spend coins in garage so `coinsNow` drops — re-open leaderboard: `coin_saver_50` STILL unlocked (uses lifetimeCoins, not balance).
5. **Voice not truncated / muted silent / reduced-motion ok.** Multiple new medals → queued lines all spoken in order; mute → none; reduced-motion → state+voice ok, no animation, no console error.
6. **Clear-data resets.** After clear, all new medals locked again, progress back to `0 / 28`.

- [ ] **Step 3: Commit checklist**

```bash
git add docs/superpowers/plans/2026-05-17-medal-acceptance-checklist.md
git commit -m "test(medals): acceptance pass vs spec §8"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** §3 medalStats → T2; §4 monotonic lifetimeCoins/owned → T1 (pure) + T2 (wired), `coinsNow` defined-but-unused-by-checks (present in medalStats, no medal reads it — consistent with spec); §5 12 medals exact ids/icons/labels/checks → T3; §6 snapshotMedals + reuse findNewlyUnlocked + in-garage celebration + result path unchanged (only stats source swapped in T2) + animateUnlock onDone sequencing → T4; §7 voice via speakQueue + static placeholder fix → T3/T4; §8 tests/acceptance → T1 node tests + T5. No uncovered section.
- **Placeholder scan:** no TBD/TODO; every step has exact code/anchors/commands/expected output.
- **Type consistency:** `Garage.lifetimeCoins/ownedCount/ownsAll` defined T1, consumed by `medalStats` T2; medal `check`s in T3 read exactly the `medalStats` fields defined in T2 (`ownedTotal/ownedVehicleCount/ownsAllVehicles/ownsDragon/lifetimeCoins` + old `games/totalStars/perfectGames/streak/totalTagScores`); `snapshotMedals` defined T2 used T4; `celebrateNewMedalsIfAny(pid,beforeSet)` defined T4 reuses `findNewlyUnlocked` (T2); `animateUnlock(id,onDone)` extended T4, backward-compatible (existing call had no 2nd arg; the only caller is updated in the same task). `_medalBefore` captured before any commit in `handleGarageCellTap`. Consistent.
