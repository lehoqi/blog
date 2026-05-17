# Vehicle-Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a player's quiz theme (story bank + celebrate + vehicle-rush + SFX + title + medals) follow their **equipped garage vehicle's family** instead of the fixed `preferTag`, adding 3 new full theme families (fire / everyday / adventure) with zero regression for default 🚓/🚑 players.

**Architecture:** Pure vehicle→family map lives in `garage.js` (`Garage.vehicleFamily`, node-tested). `index.html` adds `currentFamily()` (wraps it via the equipped garage vehicle), 3 Web-Audio SFX fns, themed data (stories/celebrate/rush/titles), swaps 4 `preferTag` read-sites to `currentFamily()`, and appends 6 medals. Default garage equips (lele=police, haohao=ambulance) make `currentFamily()` == old `preferTag`, so default play is bit-identical.

**Tech Stack:** Single static `index.html` (inline JS), sibling `garage.js` (UMD-lite ES5), Node `node:test`, chrome-devtools MCP for browser verification.

**Spec:** `docs/superpowers/specs/2026-05-17-vehicle-theme-system-design.md` (read before starting; note the A1–A4/B1–B5 accepted-decisions — do not re-flag them).

---

## Conventions

- Branch `feature/game-enhancements` (already checked out).
- `garage.js` pure ES5, UMD tail intact; extend the `GarageAPI` object literal (keep all 28 existing members).
- Locate `index.html` anchors by the quoted snippet. If an anchor does not match exactly, STOP and report NEEDS_CONTEXT (do not guess).
- Final names (used across tasks): `Garage.vehicleFamily(id)`; index.html `currentFamily()`, `playFireBell()`, `playEverydayHorn()`, `playAdventureWhoosh()`, `CELEBRATE_FIRE/EVERYDAY/ADVENTURE`, `CELEBRATE_BY_FAMILY`, `RUSH_TEXT`, `SFX_BY_FAMILY`, `TITLES.fire/everyday/adventure`.
- Run pure tests: `node --test tests/garage.test.js`.
- Commit after every task. **Zero-regression (spec C3/§8) is the prime directive** for Tasks 5–6.

---

## File Structure

- **Modify `garage.js`** — add pure `vehicleFamily(id)` + map; expose on `GarageAPI`.
- **Modify `tests/garage.test.js`** — node tests for `vehicleFamily`.
- **Modify `index.html`** — 3 SFX fns; themed data; `currentFamily()`; 4 engine swaps; 6 medals + `/34`.

---

### Task 1: `Garage.vehicleFamily` pure map + node tests

**Files:** Modify `garage.js`, Modify `tests/garage.test.js`

- [ ] **Step 1: Append failing tests** to `tests/garage.test.js`:

```js
test('vehicleFamily maps all 11 vehicles to a family; unknown/garbage -> general', () => {
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
  assert.equal(G.vehicleFamily('bogus'), 'general');
  assert.equal(G.vehicleFamily(undefined), 'general');
  assert.equal(G.vehicleFamily(42), 'general');
  // every catalog vehicle id resolves to a non-general family
  G.byKind('vehicle').forEach(it => {
    assert.notEqual(G.vehicleFamily(it.id), 'general', 'vehicle ' + it.id + ' must map to a real family');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `node --test tests/garage.test.js`
Expected: FAIL — `G.vehicleFamily is not a function`.

- [ ] **Step 3: Implement in `garage.js`** — add BEFORE the `var GarageAPI = {` line:

```js
var VEHICLE_FAMILY = {
  police: 'police',
  ambulance: 'ambulance',
  fire: 'fire',
  schoolbus: 'everyday', taxi: 'everyday', train: 'everyday', tractor: 'everyday',
  race: 'adventure', heli: 'adventure', rocket: 'adventure', ufo: 'adventure'
};
function vehicleFamily(vehicleId) {
  return VEHICLE_FAMILY[vehicleId] || 'general';
}
```

Then extend the `GarageAPI` object literal — find:

```js
  ownsAll: ownsAll,
};
```

Replace with:

```js
  ownsAll: ownsAll,
  vehicleFamily: vehicleFamily,
};
```

- [ ] **Step 4: Run — expect PASS**

Run: `node --test tests/garage.test.js`
Expected: PASS (all prior + the new test).

- [ ] **Step 5: Commit**

```bash
git add garage.js tests/garage.test.js
git commit -m "feat(theme): Garage.vehicleFamily pure map + tests"
```

---

### Task 2: Three Web-Audio SFX functions

**Files:** Modify `index.html`

- [ ] **Step 1: Add the SFX functions.** Find this exact line (the start of the ambulance siren):

```js
function playAmbulanceSiren() {
```

Insert IMMEDIATELY BEFORE it:

```js
function playFireBell() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime, dur = 1.6;
  const g = ctx.createGain(); g.connect(ctx.destination);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.16, now + 0.03);
  g.gain.setValueAtTime(0.16, now + dur - 0.15);
  g.gain.linearRampToValueAtTime(0, now + dur);
  const o = ctx.createOscillator(); o.type = 'square'; o.connect(g);
  const step = 0.16;
  for (let i = 0; i < 10; i++) o.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, now + i * step);
  o.start(now); o.stop(now + dur);
}
function playEverydayHorn() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  function beep(t, f, d) {
    const g = ctx.createGain(); g.connect(ctx.destination);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.start(t); o.stop(t + d);
  }
  beep(now, 523, 0.3); beep(now + 0.34, 659, 0.45);
}
function playAdventureWhoosh() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime, dur = 1.8;
  const g = ctx.createGain(); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.22, now + 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.connect(g);
  o.frequency.setValueAtTime(180, now);
  o.frequency.exponentialRampToValueAtTime(1200, now + dur * 0.8);
  o.start(now); o.stop(now + dur);
  const g2 = ctx.createGain(); g2.connect(ctx.destination);
  g2.gain.setValueAtTime(0.25, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  const o2 = ctx.createOscillator(); o2.type = 'square'; o2.connect(g2);
  o2.frequency.setValueAtTime(90, now);
  o2.frequency.exponentialRampToValueAtTime(40, now + 0.35);
  o2.start(now); o2.stop(now + 0.36);
}
```

- [ ] **Step 2: Verify (chrome-devtools MCP)**

Navigate `file:///Users/ip/dev/code/blog/leho/index.html`. `evaluate_script`:

```js
() => { const r=[]; ['playFireBell','playEverydayHorn','playAdventureWhoosh'].forEach(n=>{
  try { window[n] ? window[n]() : (eval(n+'()')); r.push(n+':ok'); } catch(e){ r.push(n+':ERR '+e.message); } }); return r; }
```

These are function declarations in the inline script (not on `window`); the safe check is no console error after invoking via a user gesture. Simpler robust verification: `() => [typeof playFireBell, typeof playEverydayHorn, typeof playAdventureWhoosh]` is not accessible from page scope either. Instead verify by **reading the diff** that the 3 functions are present and well-formed, then `list_console_messages` after a normal page load → no errors (syntax-valid). Record the console state.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(theme): fire/everyday/adventure Web-Audio SFX"
```

---

### Task 3: Append 36 themed story templates

**Files:** Modify `index.html`

Stories live in `STORIES_ADD` and `STORIES_SUB`. Each entry is `(a,b) => ({ text, q, tag })`. Generator ranges: ADD `a∈[1,15], b∈[1,20-a]`; SUB `a∈[2,20], b∈[1,a]`. All texts below contain both `${a}` and `${b}`; all `q` end with `？`; all SUB stories read correctly for the full `b∈[1,a]` incl. `b===a` (result 0) and `b===1` (spec B5).

- [ ] **Step 1: Append ADD stories.** Find the last entry + close of `STORIES_ADD` — find:

```js
  (a,b) => ({ text: `🚑 救护车车队有 ${a} 辆，又调来了 ${b} 辆支援，`, q: '现在一共有多少辆救护车？', tag: 'ambulance' }),
];
```

Replace with:

```js
  (a,b) => ({ text: `🚑 救护车车队有 ${a} 辆，又调来了 ${b} 辆支援，`, q: '现在一共有多少辆救护车？', tag: 'ambulance' }),
  (a,b) => ({ text: `🚒 消防车出动！先扑灭了 ${a} 处火，又扑灭了 ${b} 处，`, q: '一共扑灭了多少处火？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防员先救出 ${a} 只小猫，又救出 ${b} 只，`, q: '一共救出多少只小猫？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防站今天来了 ${a} 辆消防车，又开来 ${b} 辆，`, q: '现在一共有多少辆消防车？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防员先接好 ${a} 根水管，又接了 ${b} 根，`, q: '一共接了多少根水管？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防车先装了 ${a} 桶水，又装了 ${b} 桶，`, q: '一共装了多少桶水？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防队先来了 ${a} 个新队员，又来了 ${b} 个，`, q: '一共有多少个新队员？', tag: 'fire' }),
  (a,b) => ({ text: `🚌 校车先接了 ${a} 位小朋友，又上来 ${b} 位，`, q: '车上一共有多少位小朋友？', tag: 'everyday' }),
  (a,b) => ({ text: `🚕 出租车上午载了 ${a} 位客人，下午又载了 ${b} 位，`, q: '一共载了多少位客人？', tag: 'everyday' }),
  (a,b) => ({ text: `🚂 小火车先挂了 ${a} 节车厢，又挂上 ${b} 节，`, q: '一共有多少节车厢？', tag: 'everyday' }),
  (a,b) => ({ text: `🚜 拖拉机先运了 ${a} 袋粮食，又运了 ${b} 袋，`, q: '一共运了多少袋粮食？', tag: 'everyday' }),
  (a,b) => ({ text: `🚌 公交站先来了 ${a} 个人，又来了 ${b} 个人，`, q: '车站一共有多少个人？', tag: 'everyday' }),
  (a,b) => ({ text: `🚜 农场先收了 ${a} 筐苹果，又收了 ${b} 筐，`, q: '一共收了多少筐苹果？', tag: 'everyday' }),
  (a,b) => ({ text: `🚀 火箭先收集了 ${a} 颗星星，又收集了 ${b} 颗，`, q: '一共收集了多少颗星星？', tag: 'adventure' }),
  (a,b) => ({ text: `🏎️ 赛车第一圈超了 ${a} 辆车，第二圈又超了 ${b} 辆，`, q: '一共超了多少辆车？', tag: 'adventure' }),
  (a,b) => ({ text: `🛸 飞碟先接了 ${a} 个外星朋友，又接了 ${b} 个，`, q: '一共接了多少个外星朋友？', tag: 'adventure' }),
  (a,b) => ({ text: `🚁 直升机先送了 ${a} 个包裹，又送了 ${b} 个，`, q: '一共送了多少个包裹？', tag: 'adventure' }),
  (a,b) => ({ text: `🚀 太空站先来了 ${a} 个宇航员，又来了 ${b} 个，`, q: '一共有多少个宇航员？', tag: 'adventure' }),
  (a,b) => ({ text: `🏎️ 车队先有 ${a} 辆赛车，又来了 ${b} 辆，`, q: '车队一共有多少辆赛车？', tag: 'adventure' }),
];
```

- [ ] **Step 2: Append SUB stories.** Find the last entry + close of `STORIES_SUB` — find:

```js
  (a,b) => ({ text: `🚑 救护车上有 ${a} 个急救包，用掉了 ${b} 个，`, q: '还剩多少个急救包？', tag: 'ambulance' }),
];
```

Replace with:

```js
  (a,b) => ({ text: `🚑 救护车上有 ${a} 个急救包，用掉了 ${b} 个，`, q: '还剩多少个急救包？', tag: 'ambulance' }),
  (a,b) => ({ text: `🚒 消防车上有 ${a} 桶水，灭火用掉了 ${b} 桶，`, q: '还剩多少桶水？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防员救出 ${a} 只小猫，已经送回家 ${b} 只，`, q: '还剩多少只小猫没送回家？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防站有 ${a} 个消防员，出警去了 ${b} 个，`, q: '消防站还剩多少个消防员？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防车带了 ${a} 个灭火器，已经用掉 ${b} 个，`, q: '还剩多少个灭火器？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 消防队有 ${a} 顶头盔，借出去 ${b} 顶，`, q: '还剩多少顶头盔？', tag: 'fire' }),
  (a,b) => ({ text: `🚒 楼里有 ${a} 个人等救援，已经救出 ${b} 个，`, q: '还剩多少个人没救出？', tag: 'fire' }),
  (a,b) => ({ text: `🚌 校车上有 ${a} 位小朋友，到站下去了 ${b} 位，`, q: '车上还剩多少位小朋友？', tag: 'everyday' }),
  (a,b) => ({ text: `🚕 出租车上有 ${a} 位客人，到家下了 ${b} 位，`, q: '车上还剩多少位客人？', tag: 'everyday' }),
  (a,b) => ({ text: `🚂 小火车有 ${a} 节车厢，摘掉了 ${b} 节，`, q: '还剩多少节车厢？', tag: 'everyday' }),
  (a,b) => ({ text: `🚜 拖拉机拉了 ${a} 袋粮食，已经卸下 ${b} 袋，`, q: '车上还剩多少袋粮食？', tag: 'everyday' }),
  (a,b) => ({ text: `🚌 停车场有 ${a} 辆校车，开走了 ${b} 辆，`, q: '还剩多少辆校车？', tag: 'everyday' }),
  (a,b) => ({ text: `🚜 农场有 ${a} 筐苹果，卖掉了 ${b} 筐，`, q: '还剩多少筐苹果？', tag: 'everyday' }),
  (a,b) => ({ text: `🚀 火箭带了 ${a} 颗星星，送给朋友 ${b} 颗，`, q: '还剩多少颗星星？', tag: 'adventure' }),
  (a,b) => ({ text: `🛸 飞碟上有 ${a} 个外星朋友，送回家 ${b} 个，`, q: '飞碟上还剩多少个外星朋友？', tag: 'adventure' }),
  (a,b) => ({ text: `🏎️ 比赛有 ${a} 辆赛车，已经冲线 ${b} 辆，`, q: '还剩多少辆没冲线？', tag: 'adventure' }),
  (a,b) => ({ text: `🚁 直升机带了 ${a} 个包裹，已经送出 ${b} 个，`, q: '还剩多少个包裹？', tag: 'adventure' }),
  (a,b) => ({ text: `🚀 太空站有 ${a} 个宇航员，回地球了 ${b} 个，`, q: '太空站还剩多少个宇航员？', tag: 'adventure' }),
  (a,b) => ({ text: `🚀 火箭装了 ${a} 桶燃料，飞行用掉 ${b} 桶，`, q: '还剩多少桶燃料？', tag: 'adventure' }),
];
```

- [ ] **Step 3: Verify — A4 structural-invariant check (chrome-devtools MCP)**

Navigate `file:///Users/ip/dev/code/blog/leho/index.html`. The story arrays are inline-scope, not on `window`; expose them transiently for the check by `evaluate_script` that re-derives via a page-level probe is not possible. Instead add a **temporary** debug hook is undesirable. Use this approach: `evaluate_script` cannot read inline `const`. So verify structurally by running this Node snippet that extracts and evals the two arrays:

Run:
```bash
cd /Users/ip/dev/code/blog/leho && node -e '
const fs=require("fs");const h=fs.readFileSync("index.html","utf8");
function arr(name){const i=h.indexOf("const "+name+" = [");const j=h.indexOf("\n];",i);return h.slice(i+("const "+name+" = ").length, j+2);}
const ok=new Set(["police","ambulance","fire","everyday","adventure"]);
for(const name of ["STORIES_ADD","STORIES_SUB"]){
  const pool=eval("("+arr(name)+")");
  for(const fn of pool){
    for(const [a,b] of [[1,1],[15,5],[2,1],[20,1],[20,20]]){
      const s=fn(a,b);
      if(!s.text||!s.q) throw new Error(name+" missing text/q");
      if(s.text.indexOf(String(a))<0||s.text.indexOf(String(b))<0) throw new Error(name+" text missing a/b: "+s.text);
      if(!/？$/.test(s.q)) throw new Error(name+" q must end with ？: "+s.q);
      if(s.tag!==undefined && !ok.has(s.tag)) throw new Error(name+" bad tag: "+s.tag);
    }
  }
  console.log(name, pool.length, "entries OK");
}
'
```
Expected: `STORIES_ADD 33 entries OK` and `STORIES_SUB 33 entries OK` (15 original + 18 appended each: 6 fire + 6 everyday + 6 adventure). 0 thrown errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(theme): 36 themed story templates (fire/everyday/adventure)"
```

---

### Task 4: Themed data — celebrate / rush text / SFX map / titles

**Files:** Modify `index.html`

- [ ] **Step 1: Add celebrate arrays + family maps.** Find:

```js
const CELEBRATE_AMBULANCE = ['🚑 急救成功！你是小英雄！','🚑 嘀嘟嘀嘟～救到啦！','🚑 急救达人！太棒了！'];
```

Insert IMMEDIATELY AFTER it:

```js
const CELEBRATE_FIRE      = ['🚒 火灭啦！你是消防小英雄！','🚒 救援成功！太勇敢了！','🚒 呜哇——救到啦！太棒了！'];
const CELEBRATE_EVERYDAY  = ['🚌 安全到站！棒极了！','🚕 一路顺风！真厉害！','🚂 呜——准点出发！太棒了！'];
const CELEBRATE_ADVENTURE = ['🚀 发射成功！冲出大气层！','🏎️ 冲线第一！太快啦！','🛸 探索成功！你是小宇航员！'];
const CELEBRATE_BY_FAMILY = {
  police: CELEBRATE_POLICE, ambulance: CELEBRATE_AMBULANCE,
  fire: CELEBRATE_FIRE, everyday: CELEBRATE_EVERYDAY, adventure: CELEBRATE_ADVENTURE
};
const RUSH_TEXT = { fire: '🚒 火灭啦！救援成功！', everyday: '🚌 安全到站！', adventure: '🚀 抵达终点！超厉害！' };
const SFX_BY_FAMILY = { fire: playFireBell, everyday: playEverydayHorn, adventure: playAdventureWhoosh };
```

- [ ] **Step 2: Add the 3 title sets.** Find:

```js
  default:   ['🌱 数学新手', '🦕 勇敢冒险家', '⭐ 进步之星', '💡 聪明小将', '🔥 算数达人', '👑 数学大王']
};
```

Replace with:

```js
  default:   ['🌱 数学新手', '🦕 勇敢冒险家', '⭐ 进步之星', '💡 聪明小将', '🔥 算数达人', '👑 数学大王'],
  fire:      ['🚒 消防新兵', '🚒 灭火小将', '🚒 救火小队长', '🚒 灭火能手', '🚒 救援英雄', '🚒 传奇消防员'],
  everyday:  ['🚌 出行新手', '🚌 小小司机', '🚌 熟练司机', '🚌 安全模范', '🚌 金牌司机', '🚌 出行大师'],
  adventure: ['🚀 探险新手', '🚀 见习宇航员', '🚀 勇敢探险家', '🚀 星际旅行家', '🚀 太空英雄', '🚀 传奇探险家']
};
```

- [ ] **Step 3: Verify (chrome-devtools MCP)** — navigate fresh, `list_console_messages` → no errors (syntax valid; `SFX_BY_FAMILY` references the Task-2 fns which exist). Read the diff to confirm exactly these 2 insertions, no others.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(theme): themed celebrate/rush/sfx maps + 3 title sets"
```

---

### Task 5: Engine core — currentFamily + generateQuestion + tagScores keys + getTitle

**Files:** Modify `index.html`

- [ ] **Step 1: Add `currentFamily()`.** Find:

```js
function generateQuestion() {
  const preferTag = currentPlayer ? PLAYERS[currentPlayer].preferTag : null;
```

Replace with:

```js
function currentFamily() {
  if (!currentPlayer) return null;
  try { return Garage.vehicleFamily(getPlayerGarage(currentPlayer).equippedVehicle); }
  catch (e) { if (typeof console !== 'undefined') console.warn('[currentFamily] fallback:', e); return 'general'; }
}
function generateQuestion() {
  const preferTag = currentFamily();
```

- [ ] **Step 2: Add tagScores keys (3 sites).** Find (the `let` declaration):

```js
let tagScores     = { police: 0, ambulance: 0, general: 0 };
```

Replace with:

```js
let tagScores     = { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 };
```

Find (inside `startGame`):

```js
  tagScores     = { police: 0, ambulance: 0, general: 0 };
```

Replace with:

```js
  tagScores     = { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 };
```

Find (inside `getPlayerStats`):

```js
  const totalTagScores = { police: 0, ambulance: 0, general: 0 };
```

Replace with:

```js
  const totalTagScores = { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 };
```

- [ ] **Step 3: Swap `getTitle` key source (A2 — keep guards + try/catch).** Find:

```js
  const key = playerId && PLAYERS[playerId] ? PLAYERS[playerId].preferTag : 'default';
  const t = TITLES[key] || TITLES.default;
```

Replace with:

```js
  let key = 'default';
  if (playerId && PLAYERS[playerId]) {
    try { key = Garage.vehicleFamily(getPlayerGarage(playerId).equippedVehicle); }
    catch (e) { key = 'default'; }
  }
  const t = TITLES[key] || TITLES.default;
```

- [ ] **Step 4: Verify (chrome-devtools MCP) — zero-regression + family switch**

Navigate `file:///Users/ip/dev/code/blog/leho/index.html`; `() => { localStorage.clear(); return 'c'; }`; reload.
- B3 default==old: drive a fresh game as lele and read family. Since `currentFamily` is inline-scoped, expose a temporary read via the existing `window.getPlayerGarage` + `window.Garage`: `() => [window.Garage.vehicleFamily(window.getPlayerGarage('lele').equippedVehicle), window.Garage.vehicleFamily(window.getPlayerGarage('haohao').equippedVehicle)]` → expect `["police","ambulance"]` (fresh defaults == old preferTag).
- Title default unchanged: open leaderboard (`btn-start`→`btn-lb-player`); the lele title still starts with `🚓` (police set) and haohao `🚑`. `() => { const items=[...document.querySelectorAll('.lb-player-block, .tower-title-badge, [id$="-preview-title"]')].map(x=>x.textContent); return items.join(' | '); }` — confirm lele shows a 🚓 title, haohao 🚑 (zero-regression: default equip → police/ambulance titles, same as preferTag before).
- Family switch: seed lele equipped rocket: `() => { const a=JSON.parse(localStorage.getItem('dino_math_garage')||'{}'); a.lele={coins:0,owned:['police','brontosaurus','rocket'],equippedVehicle:'rocket',equippedDino:'brontosaurus',migrated:true}; localStorage.setItem('dino_math_garage',JSON.stringify(a)); return 's'; }`, reload, `() => window.Garage.vehicleFamily(window.getPlayerGarage('lele').equippedVehicle)` → `"adventure"`; open leaderboard → lele title now starts with `🚀`.
- node sanity: `cd /Users/ip/dev/code/blog/leho && node --test tests/garage.test.js` → all pass.
- `list_console_messages` → no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(theme): currentFamily + generateQuestion/tagScores/getTitle by equipped family"
```

---

### Task 6: Engine theming — showCelebrate table + submitAnswer family rush

**Files:** Modify `index.html`

- [ ] **Step 1: Swap `showCelebrate` to family table.** Find:

```js
  const isThemeQ = currentPlayer && curQ && curQ.tag && PLAYERS[currentPlayer].preferTag === curQ.tag;
  if (isThemeQ && curQ.tag === 'police') {
    textEl.textContent = CELEBRATE_POLICE[randInt(0, CELEBRATE_POLICE.length-1)];
  } else if (isThemeQ && curQ.tag === 'ambulance') {
    textEl.textContent = CELEBRATE_AMBULANCE[randInt(0, CELEBRATE_AMBULANCE.length-1)];
  } else {
    textEl.textContent = CELEBRATE_TEXTS[randInt(0, CELEBRATE_TEXTS.length-1)];
  }
```

Replace with:

```js
  const isThemeQ = !!(curQ && curQ.tag && curQ.tag === currentFamily());
  if (isThemeQ && CELEBRATE_BY_FAMILY[curQ.tag]) {
    const arr = CELEBRATE_BY_FAMILY[curQ.tag];
    textEl.textContent = arr[randInt(0, arr.length-1)];
  } else {
    textEl.textContent = CELEBRATE_TEXTS[randInt(0, CELEBRATE_TEXTS.length-1)];
  }
```

(Zero-regression: default lele/police + police question → `currentFamily()`='police', `CELEBRATE_BY_FAMILY['police']`===`CELEBRATE_POLICE` → same array, same `randInt` call. Identical.)

- [ ] **Step 2: Swap `submitAnswer` isThemeMatch + family rush.** Find:

```js
    const isThemeMatch = currentPlayer && q.tag && PLAYERS[currentPlayer].preferTag === q.tag;
```

Replace with:

```js
    const isThemeMatch = !!(q.tag && q.tag === currentFamily());
```

Then find:

```js
        if (isThemeMatch) {
          const vType = q.tag;
          const vEmoji = equippedEmojis(currentPlayer).vehicle;
          showVehicleRush(vEmoji, vType, correctStreak, goNext);
        } else {
          goNext();
        }
```

Replace with:

```js
        if (isThemeMatch) {
          const vType = q.tag;
          const vEmoji = equippedEmojis(currentPlayer).vehicle;
          if (vType === 'police' || vType === 'ambulance') {
            showVehicleRush(vEmoji, vType, correctStreak, goNext);
          } else {
            showVehicleRush(vEmoji, vType, correctStreak, goNext, { text: RUSH_TEXT[vType], sound: SFX_BY_FAMILY[vType] });
          }
        } else {
          goNext();
        }
```

(Zero-regression: police/ambulance branch unchanged — no opts → original siren + original `'🚓 破案成功！'`/`'🚑 急救成功！'` text + original colors. A1 accepted: new families reuse the existing strobe color scheme; only text+sound+vehicle emoji are family-specific.)

- [ ] **Step 3: Verify (chrome-devtools MCP)**

- Zero-regression: clear storage, reload, play one full correct round as **lele** (default police). For each question parse `#question-text` "a±b=", click `#numpad` digits + 确认, poll between questions ~7s (celebrate/rush). Confirm: themed (police) questions show a 🚓 celebrate from `CELEBRATE_POLICE` and the police vehicle-rush fires with the police siren (audible / no opts path). No console errors. (Behavioural identity is the goal — if a police question appears, celebrate text ∈ CELEBRATE_POLICE.)
- Family theming: seed lele equipped rocket (`owned:['police','brontosaurus','rocket'],equippedVehicle:'rocket'`), reload, play a round as lele until an `adventure`-tagged question appears (story text starts with 🚀/🏎️/🛸/🚁); on answering it correctly, the celebrate text ∈ `CELEBRATE_ADVENTURE` and the rush shows the equipped 🚀 with `RUSH_TEXT.adventure` ("🚀 抵达终点！超厉害！"). Capture `#celebrate-text` textContent at celebrate time via a polled `evaluate_script` and assert it is one of the adventure strings; assert no console error.
- node sanity: `node --test tests/garage.test.js` → all pass.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(theme): showCelebrate table + family-aware vehicle rush"
```

---

### Task 7: +6 family medals + `/34` placeholder

**Files:** Modify `index.html`

- [ ] **Step 1: Append 6 medals.** Find:

```js
  { id: 'coin_saver_150', icon: '💰', label: '大富翁',     check: st => st.lifetimeCoins >= 150 },
];
```

Replace with:

```js
  { id: 'coin_saver_150', icon: '💰', label: '大富翁',     check: st => st.lifetimeCoins >= 150 },
  { id: 'fire_10',      icon: '🚒', label: '消防小英雄',  check: st => st.totalTagScores && st.totalTagScores.fire >= 10 },
  { id: 'fire_30',      icon: '🧯', label: '烈焰克星',    check: st => st.totalTagScores && st.totalTagScores.fire >= 30 },
  { id: 'everyday_10',  icon: '🚌', label: '出行小达人',  check: st => st.totalTagScores && st.totalTagScores.everyday >= 10 },
  { id: 'everyday_30',  icon: '🎫', label: '金牌司机',    check: st => st.totalTagScores && st.totalTagScores.everyday >= 30 },
  { id: 'adventure_10', icon: '🏁', label: '勇敢探险家',  check: st => st.totalTagScores && st.totalTagScores.adventure >= 10 },
  { id: 'adventure_30', icon: '🛰️', label: '太空英雄',    check: st => st.totalTagScores && st.totalTagScores.adventure >= 30 },
];
```

(If the `coin_saver_150` line's whitespace differs from above, match it by its unique `id: 'coin_saver_150'` identity and insert the 6 new objects on the lines immediately before the array's closing `];`. STOP+report if `coin_saver_150` or the `];` after it is not found.)

- [ ] **Step 2: Fix static placeholder.** Find:

```html
        <div class="medal-progress">已解锁 0 / 28 枚勋章</div>
```

Replace with:

```html
        <div class="medal-progress">已解锁 0 / 34 枚勋章</div>
```

- [ ] **Step 3: Verify (chrome-devtools MCP)**

- Fresh: navigate, `() => { localStorage.clear(); return 'c'; }`, reload, open leaderboard (`btn-start`→`btn-lb-player`): `() => [document.querySelectorAll('#medal-grid .medal-item').length, document.querySelector('.medal-progress').textContent]` → `[34, "已解锁 0 / 34 枚勋章"]`.
- Earned: seed records giving fire tag ≥10: `() => { const r=[]; for(let i=0;i<3;i++) r.push({player:'lele',score:5,total:5,stars:5,date:new Date().toISOString(),tagScores:{fire:5}}); localStorage.setItem('dino_math_records',JSON.stringify(r)); return 's'; }` (3×5=15 ≥10) reload, open leaderboard, assert `fire_10`(消防小英雄) unlocked: `() => { const u=[...document.querySelectorAll('#medal-grid .medal-item.unlocked')].map(x=>x.textContent).join('|'); return u.includes('消防小英雄'); }` → `true`.
- node sanity: `node --test tests/garage.test.js` → all pass.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(theme): +6 family medals (fire/everyday/adventure) + /34 placeholder"
```

---

### Task 8: Acceptance pass vs spec §8/§9

**Files:** Create `docs/superpowers/plans/2026-05-17-vehicle-theme-acceptance-checklist.md`

- [ ] **Step 1: Unit suite** — `cd /Users/ip/dev/code/blog/leho && node --test tests/garage.test.js` — record exact pass/fail (expect all pass).

- [ ] **Step 2: Re-run the A4 structural check** (the Node snippet from Task 3 Step 3) — record output (`STORIES_ADD 33 entries OK`, `STORIES_SUB 33 entries OK`).

- [ ] **Step 3: A3 grep** — `grep -nE "\.preferTag" index.html` — record output; assert NO occurrence is a runtime theme/title/celebrate/rush read (only the two `PLAYERS` definition lines `preferTag: 'police'`/`'ambulance'` may remain — vestigial, acceptable). Any `generateQuestion/showCelebrate/submitAnswer/getTitle` reference to `preferTag` is a FAIL.

- [ ] **Step 4: Walk spec §9 acceptance criteria via chrome-devtools MCP** — record PASS/FAIL + actual evidence for each (be honest; DONE_WITH_CONCERNS if any fail):
  1. **Zero-regression**: clear data, play one full correct round each as lele (police) and haohao (ambulance); confirm themed questions still yield the original `CELEBRATE_POLICE`/`CELEBRATE_AMBULANCE` celebrate texts and the police/ambulance vehicle-rush (no-opts path); existing `node --test` green.
  2. **B3**: fresh `Garage.vehicleFamily(getPlayerGarage('lele').equippedVehicle)`==='police', haohao 'ambulance'.
  3. lele equipped fire/everyday/adventure (seed each) → that round's themed questions are the matching family (story emoji prefix), celebrate ∈ that family's array, rush text = `RUSH_TEXT[family]`, title set switches to that family.
  4. Earn family tag ≥10/≥30 (seed records) → fire_10/30, everyday_10/30, adventure_10/30 unlock; medal cabinet `/ 34`; in-garage/result medal celebration still works (reuse).
  5. Voice: new story/celebrate spoken via existing speak/speakQueue (not truncated); mute silences speech; new SFX still play when muted (B2, matches sirens); reduced-motion rush degrades, state/score correct.
  6. Switch back to default car → behavior returns to police/ambulance live.

- [ ] **Step 5: Write + commit checklist** — create the doc with title, date 2026-05-17, node result, A4/A3 outputs, and §9 criteria PASS/FAIL + evidence + overall verdict/caveats.

```bash
cd /Users/ip/dev/code/blog/leho
git add docs/superpowers/plans/2026-05-17-vehicle-theme-acceptance-checklist.md
git commit -m "test(theme): acceptance pass vs spec §8/§9"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** §3 family model + Garage.vehicleFamily → T1; §4 SFX → T2; §5 content (12 add+12 sub+9 celebrate+3 rush+18 title across 3 families = exactly the 6/6 per family, 3 celebrate, 1 rush, 6-tier title) → T3/T4; §6.1 vehicleFamily+currentFamily → T1/T5; §6.2 generateQuestion → T5; §6.3 showCelebrate table → T6; §6.4 submitAnswer rush + A1 accepted → T6; §6.5 tagScores+totalTagScores keys → T5; §6.6 getTitle A2-guarded → T5; §6.7 preferTag vestigial → T5 (no longer read) + T8 A3 grep; §7 +6 medals + /34 → T7; §8 zero-regression → T5/T6 verify + T8; §9 tests incl. A4 structural + B3 + node map → T1/T3/T8. No uncovered section.
- **Placeholder scan:** all 38 story templates, 9 celebrate, 3 rush, 18 title strings, 3 SFX bodies are written in full; exact anchors from the live file; exact verify commands + expected output. No TBD/TODO.
- **Type consistency:** `Garage.vehicleFamily` (T1) consumed by `currentFamily()` (T5) and `getTitle` (T5); `currentFamily()` consumed by `generateQuestion`/`showCelebrate`/`submitAnswer` (T5/T6); `playFireBell/playEverydayHorn/playAdventureWhoosh` (T2) referenced by `SFX_BY_FAMILY` (T4) used in `submitAnswer` (T6); `CELEBRATE_BY_FAMILY`/`RUSH_TEXT` (T4) used in T6; `TITLES.fire/everyday/adventure` (T4) used by `getTitle` (T5); new tag ids `fire/everyday/adventure` consistent across stories (T3), tagScores (T5), medals (T7), vehicleFamily (T1).
- **Count consistency (verified):** Task 3 appends exactly 6 fire + 6 everyday + 6 adventure = **18 ADD** and **18 SUB** (36 templates total). Pools become `STORIES_ADD` 15+18=**33**, `STORIES_SUB` 15+18=**33** — matched by Task 3 Step 3 and Task 8 Step 2 expected output. Medals are a separate axis: 28 existing + 6 new = **34** (the `/34` placeholder in Task 7). 33 (stories) vs 34 (medals) are intentionally different numbers.
