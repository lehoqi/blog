# Themed Adventure Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn each 5-question round into a current-vehicle-family themed adventure with exaggerated animation, synchronized sound effects, full voice coverage, and non-text-dependent play.

**Architecture:** Keep `garage.js` as the vehicle/economy module and add a small `adventure.js` pure module for adventure themes, run state, validation, and one-time settlement guards. `index.html` owns DOM, audio, speech, and animation, using the pure module to avoid embedding state rules directly into the large inline script.

**Tech Stack:** Plain HTML/CSS/JavaScript, Web Audio API, Web Speech API, `localStorage`, Node built-in test runner.

---

## File Structure

- Create `adventure.js`: pure adventure configuration and state helpers. No DOM, no browser APIs beyond optional `window` export.
- Modify `index.html`: load `adventure.js`, add adventure HUD markup/CSS, wire start/render/answer/result flow, add animation and sound functions.
- Keep `tests/garage.test.js` unchanged unless an implementation change breaks an existing assertion.
- Create `tests/adventure.test.js`: pure tests for theme completeness, run state, settlement guards, and fallback behavior.
- Update `docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md`: check items during final verification only; do not mark boxes before implementation evidence.

---

### Task 1: Pure Adventure Module

**Files:**
- Create: `adventure.js`
- Create: `tests/adventure.test.js`

- [ ] **Step 1: Write failing module tests**

Create `tests/adventure.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../adventure.js');

test('themes cover every vehicle family with required non-text gameplay fields', () => {
  const ids = ['police', 'ambulance', 'fire', 'everyday', 'adventure'];
  assert.deepEqual(Object.keys(A.THEMES).sort(), ids.sort());
  for (const id of ids) {
    const t = A.getTheme(id);
    assert.equal(t.id, id);
    assert.ok(t.name);
    assert.ok(t.mapEmoji);
    assert.ok(t.bossEmoji);
    assert.ok(t.bossName);
    assert.ok(Array.isArray(t.introLines) && t.introLines.length >= 1);
    assert.ok(Array.isArray(t.stepLines) && t.stepLines.length >= 4);
    assert.ok(t.bossLine);
    assert.ok(t.victoryLine);
    assert.ok(t.fallbackColor);
  }
});

test('getTheme falls back safely for unknown values', () => {
  assert.equal(A.getTheme('bogus').id, 'adventure');
  assert.equal(A.getTheme(undefined).id, 'adventure');
  assert.equal(A.getTheme(null).id, 'adventure');
});

test('createRun initializes five unsettled questions', () => {
  const run = A.createRun('fire', 5);
  assert.equal(run.family, 'fire');
  assert.equal(run.step, 0);
  assert.equal(run.bossShown, false);
  assert.equal(run.completed, false);
  assert.equal(run.advancing, false);
  assert.deepEqual(run.settledQuestions, [false, false, false, false, false]);
});

test('beginSettle locks a question exactly once', () => {
  const run = A.createRun('police', 5);
  const first = A.beginSettle(run, 0);
  assert.equal(first.ok, true);
  assert.equal(first.run.advancing, true);
  assert.equal(first.run.settledQuestions[0], true);
  const second = A.beginSettle(first.run, 0);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'already-settled');
});

test('finishStep advances through normal steps and final completion', () => {
  let run = A.createRun('ambulance', 5);
  let locked = A.beginSettle(run, 0).run;
  run = A.finishStep(locked, 0);
  assert.equal(run.step, 1);
  assert.equal(run.advancing, false);
  assert.equal(run.completed, false);

  locked = A.beginSettle(run, 4).run;
  run = A.finishStep(locked, 4);
  assert.equal(run.step, 5);
  assert.equal(run.advancing, false);
  assert.equal(run.completed, true);
});

test('shouldShowBoss returns true only once for final question', () => {
  let run = A.createRun('fire', 5);
  assert.equal(A.shouldShowBoss(run, 3), false);
  assert.equal(A.shouldShowBoss(run, 4), true);
  run = A.markBossShown(run);
  assert.equal(run.bossShown, true);
  assert.equal(A.shouldShowBoss(run, 4), false);
});
```

- [ ] **Step 2: Run the failing tests**

Run: `node --test tests/adventure.test.js`

Expected: FAIL with module not found for `../adventure.js`.

- [ ] **Step 3: Implement pure adventure module**

Create `adventure.js`:

```js
'use strict';

var THEMES = {
  police: {
    id: 'police',
    name: '警车追捕',
    mapEmoji: '🏙️',
    bossEmoji: '🚧',
    bossName: '捣乱车',
    targetEmoji: '🚓',
    fallbackColor: '#1e88e5',
    introLines: ['警车出动！追上捣乱车！'],
    stepLines: ['追近啦！继续加速！', '警灯亮起来！', '快抓住它了！', '准备最后一击！'],
    bossLine: '捣乱车来了！答对这一题，抓住它！',
    victoryLine: '破案成功！太厉害了！'
  },
  ambulance: {
    id: 'ambulance',
    name: '急救救援',
    mapEmoji: '🏥',
    bossEmoji: '🦠',
    bossName: '病毒云',
    targetEmoji: '🚑',
    fallbackColor: '#00a86b',
    introLines: ['救护车出发！把急救能量送到终点！'],
    stepLines: ['急救能量更多啦！', '道路打开啦！', '快到医院啦！', '准备净化病毒云！'],
    bossLine: '病毒云来了！答对这一题，净化它！',
    victoryLine: '急救成功！你是小英雄！'
  },
  fire: {
    id: 'fire',
    name: '消防救援',
    mapEmoji: '🏘️',
    bossEmoji: '🔥',
    bossName: '火焰怪',
    targetEmoji: '🚒',
    fallbackColor: '#f4511e',
    introLines: ['消防车出动！答对五题，打败火焰怪！'],
    stepLines: ['水管接好啦！', '水柱更强啦！', '火变小啦！', '准备最后灭火！'],
    bossLine: '火焰怪来了！答对这一题，扑灭它！',
    victoryLine: '火灭啦！救援成功！'
  },
  everyday: {
    id: 'everyday',
    name: '安全到站',
    mapEmoji: '🛣️',
    bossEmoji: '🚦',
    bossName: '大堵车',
    targetEmoji: '🚌',
    fallbackColor: '#ffb300',
    introLines: ['安全出发！答对五题，冲破大堵车！'],
    stepLines: ['第一站到了！', '乘客星星跳起来！', '路障被推开啦！', '准备安全到站！'],
    bossLine: '大堵车来了！答对这一题，冲过去！',
    victoryLine: '安全到站！棒极了！'
  },
  adventure: {
    id: 'adventure',
    name: '太空探险',
    mapEmoji: '🌌',
    bossEmoji: '☄️',
    bossName: '大陨石',
    targetEmoji: '🚀',
    fallbackColor: '#7c4dff',
    introLines: ['准备发射！答对五题，冲过陨石区！'],
    stepLines: ['火箭加速啦！', '星星轨道亮起来！', '快穿过陨石区啦！', '准备最后发射！'],
    bossLine: '大陨石来了！答对这一题，冲破它！',
    victoryLine: '抵达终点！超厉害！'
  }
};

function getTheme(family) {
  return THEMES[family] || THEMES.adventure;
}

function createRun(family, total) {
  var count = Math.max(1, Math.floor(Number(total) || 5));
  return {
    family: getTheme(family).id,
    step: 0,
    bossShown: false,
    completed: false,
    advancing: false,
    settledQuestions: Array(count).fill(false)
  };
}

function _copyRun(run) {
  return {
    family: getTheme(run && run.family).id,
    step: Math.max(0, Math.floor(Number(run && run.step) || 0)),
    bossShown: !!(run && run.bossShown),
    completed: !!(run && run.completed),
    advancing: !!(run && run.advancing),
    settledQuestions: Array.isArray(run && run.settledQuestions) ? run.settledQuestions.slice() : Array(5).fill(false)
  };
}

function beginSettle(run, questionIndex) {
  var next = _copyRun(run);
  var i = Math.floor(Number(questionIndex) || 0);
  if (next.completed) return { ok: false, reason: 'completed', run: next };
  if (next.advancing) return { ok: false, reason: 'advancing', run: next };
  if (next.settledQuestions[i]) return { ok: false, reason: 'already-settled', run: next };
  next.advancing = true;
  next.settledQuestions[i] = true;
  return { ok: true, run: next };
}

function finishStep(run, questionIndex) {
  var next = _copyRun(run);
  var i = Math.floor(Number(questionIndex) || 0);
  next.step = Math.max(next.step, i + 1);
  next.advancing = false;
  if (i >= next.settledQuestions.length - 1) next.completed = true;
  return next;
}

function shouldShowBoss(run, questionIndex) {
  var next = _copyRun(run);
  var i = Math.floor(Number(questionIndex) || 0);
  return i === next.settledQuestions.length - 1 && !next.bossShown;
}

function markBossShown(run) {
  var next = _copyRun(run);
  next.bossShown = true;
  return next;
}

var Adventure = {
  THEMES: THEMES,
  getTheme: getTheme,
  createRun: createRun,
  beginSettle: beginSettle,
  finishStep: finishStep,
  shouldShowBoss: shouldShowBoss,
  markBossShown: markBossShown
};

if (typeof module !== 'undefined' && module.exports) module.exports = Adventure;
if (typeof window !== 'undefined') window.Adventure = Adventure;
```

- [ ] **Step 4: Run module tests**

Run: `node --test tests/adventure.test.js`

Expected: PASS, 6 tests.

- [ ] **Step 5: Run existing pure tests**

Run: `node --test tests/garage.test.js tests/adventure.test.js`

Expected: PASS for both test files.

- [ ] **Step 6: Commit**

```bash
git add adventure.js tests/adventure.test.js
git commit -m "feat: add adventure state module"
```

---

### Task 2: Load Adventure Module and Add HUD Shell

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Load `adventure.js`**

In `index.html`, immediately after the existing `garage.js` script:

```html
<script src="garage.js"></script>
<script src="adventure.js"></script>
```

- [ ] **Step 2: Add adventure HUD markup**

Inside `#quiz-page`, place this block above `#question-card` so the HUD is visible but does not hide the math area:

```html
<div class="adventure-hud" id="adventure-hud" aria-live="polite">
  <div class="adventure-scene" id="adventure-scene">
    <span class="adventure-map" id="adventure-map">🌌</span>
    <span class="adventure-vehicle" id="adventure-vehicle">🚀</span>
    <span class="adventure-boss" id="adventure-boss">☄️</span>
  </div>
  <div class="adventure-track" id="adventure-track">
    <span class="adv-dot" data-step="0">1</span>
    <span class="adv-dot" data-step="1">2</span>
    <span class="adv-dot" data-step="2">3</span>
    <span class="adv-dot" data-step="3">4</span>
    <span class="adv-dot boss-dot" data-step="4">5</span>
  </div>
  <div class="adventure-title" id="adventure-title">太空探险</div>
</div>
```

- [ ] **Step 3: Add HUD CSS**

Add this CSS near quiz page styles:

```css
.adventure-hud {
  width: 100%;
  background: rgba(255,255,255,0.92);
  border: 3px solid rgba(76,175,80,0.18);
  border-radius: 18px;
  padding: 10px 12px 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.10);
  margin-bottom: 10px;
  overflow: hidden;
}
.adventure-scene {
  position: relative;
  height: 54px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(33,150,243,0.12), rgba(255,214,0,0.14));
}
.adventure-map, .adventure-vehicle, .adventure-boss {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  line-height: 1;
}
.adventure-map { left: 10px; font-size: 28px; opacity: 0.82; }
.adventure-vehicle { left: 18%; font-size: 34px; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.25)); }
.adventure-boss { right: 12px; font-size: 34px; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.25)); }
.adventure-track {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-top: 8px;
}
.adv-dot {
  height: 24px;
  border-radius: 999px;
  background: #e0e0e0;
  color: #33691e;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}
.adv-dot.done { background: linear-gradient(135deg, #ffd600, #ff9800); color: #5d4037; }
.adv-dot.active { outline: 3px solid #4caf50; background: #c8e6c9; }
.adv-dot.boss-dot { background: #ffcdd2; color: #b71c1c; }
.adv-dot.boss-dot.done { background: linear-gradient(135deg, #ff5252, #ffd600); color: #fff; }
.adventure-title {
  margin-top: 5px;
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--text);
  text-align: center;
}
@media (max-width: 420px) {
  .adventure-scene { height: 46px; }
  .adventure-map { font-size: 23px; }
  .adventure-vehicle, .adventure-boss { font-size: 29px; }
  .adventure-title { font-size: 0.82rem; }
}
```

- [ ] **Step 4: Add render helper**

Near `currentFamily()` add:

```js
let adventureRun = null;
let inputLocked = false;

function setInputLocked(locked) {
  inputLocked = !!locked;
  const ok = document.querySelector('#numpad .btn-ok');
  if (ok) ok.disabled = inputLocked;
}

function currentAdventureTheme() {
  const family = currentFamily() || 'adventure';
  return Adventure.getTheme(family);
}

function renderAdventureHud() {
  if (!window.Adventure || !adventureRun) return;
  const theme = Adventure.getTheme(adventureRun.family);
  const e = currentPlayer ? equippedEmojis(currentPlayer) : { vehicle: theme.targetEmoji, dino: '🦕' };
  $('adventure-map').textContent = theme.mapEmoji;
  $('adventure-vehicle').textContent = e.vehicle;
  $('adventure-boss').textContent = theme.bossEmoji;
  $('adventure-title').textContent = theme.name;
  document.querySelectorAll('.adv-dot').forEach((dot, i) => {
    dot.classList.toggle('done', i < adventureRun.step);
    dot.classList.toggle('active', i === Math.min(adventureRun.step, 4) && !adventureRun.completed);
  });
  const pct = Math.min(88, 12 + adventureRun.step * 18);
  $('adventure-vehicle').style.left = pct + '%';
}
```

- [ ] **Step 5: Wire HUD render**

In `renderQuestion()`, after player avatar/progress setup, call:

```js
renderAdventureHud();
```

- [ ] **Step 6: Manual smoke check**

Open `index.html` in browser, start a game, confirm the HUD appears, the equation and numpad remain visible on desktop and mobile width.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add adventure hud"
```

---

### Task 3: Adventure Run State and Voice Sequencing

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Initialize adventure run in `startGame()`**

In `startGame()`, after `questions = generateQuestions(5);` and before `renderQuestion(false);`, add:

```js
adventureRun = Adventure.createRun(currentFamily() || 'adventure', questions.length);
setInputLocked(false);
```

- [ ] **Step 2: Add question narration helper**

Near `buildReadText(q)` add:

```js
function speakQuestionWithAdventure(q, slideIn) {
  if (!q) return;
  const readText = buildReadText(q);
  if (adventureRun && Adventure.shouldShowBoss(adventureRun, currentIdx)) {
    const theme = Adventure.getTheme(adventureRun.family);
    adventureRun = Adventure.markBossShown(adventureRun);
    renderAdventureHud();
    const e = currentPlayer ? equippedEmojis(currentPlayer) : { vehicle: theme.targetEmoji, dino: '🦕' };
    showBossEntrance(theme, e.vehicle, e.dino, () => {
      speakQueue([theme.bossLine, readText], 0.86);
    });
    return;
  }
  setTimeout(() => speak(readText, 0.8), slideIn ? 500 : 300);
}
```

- [ ] **Step 3: Let `renderQuestion` suppress automatic question speech**

Change the function signature:

```js
function renderQuestion(slideIn = true, speakNow = true) {
```

At the bottom of `renderQuestion()`, replace direct question speech:

```js
const readText = buildReadText(q);
setTimeout(() => speak(readText, 0.8), slideIn ? 500 : 300);
```

with:

```js
if (speakNow) speakQuestionWithAdventure(q, slideIn);
```

- [ ] **Step 4: Add intro voice after page render**

In `startGame()`, replace the final `renderQuestion(false);` call with this deterministic sequence:

```js
const introTheme = Adventure.getTheme(adventureRun.family);
renderQuestion(false, false);
const introE = currentPlayer ? equippedEmojis(currentPlayer) : { vehicle: introTheme.targetEmoji, dino: '🦕' };
setTimeout(() => {
  showAdventureIntro(introTheme, introE.vehicle, introE.dino, () => {
    const firstQuestion = questions[currentIdx] ? buildReadText(questions[currentIdx]) : '';
    speakQueue(introTheme.introLines.concat(firstQuestion ? [firstQuestion] : []), 0.86);
  });
}, 80);
```

Required behavior: intro speech first, then first question speech in the same queue. There is no separate `speak(readText)` for the first question.

- [ ] **Step 5: Manual voice check**

Start a game and listen: intro speech must play, then question speech. On question 5, Boss line must play before question text and must not be cut off.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: sequence adventure narration"
```

---

### Task 4: Submission Lock and One-Time Settlement

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Guard numpad input**

At the top of `inputDigit(d)`, `deleteDigit()`, and `submitAnswer()`, add:

```js
if (inputLocked) return;
```

- [ ] **Step 2: Guard keyboard input**

In the document keydown handler near the bottom of `index.html`, add an early return:

```js
if (inputLocked) return;
```

Place it before digit/Backspace/Enter handling, but after any global keys that must remain active. If there are no such global keys, make it the first line of the handler.

- [ ] **Step 3: Lock answer settlement**

At the start of the correct-answer branch in `submitAnswer()`, before `score++`, add:

```js
const settle = Adventure.beginSettle(adventureRun, currentIdx);
if (!settle.ok) return;
adventureRun = settle.run;
setInputLocked(true);
renderAdventureHud();
```

- [ ] **Step 4: Reset lock on wrong answer only after current input clears**

Wrong answers should not set `inputLocked`. Keep existing retry behavior. Confirm the guard from Step 1 does not block normal wrong-answer retry.

- [ ] **Step 5: Unlock only through next/result exit**

Replace the existing `goNext` inside the correct-answer flow with:

```js
const goNext = () => {
  adventureRun = Adventure.finishStep(adventureRun, currentIdx);
  renderAdventureHud();
  currentIdx++;
  setInputLocked(false);
  if (currentIdx >= questions.length) showResult();
  else renderQuestion();
};
```

For the final question, the finisher callback should call the same `goNext()` once.

- [ ] **Step 6: Manual re-entry check**

Start a game, enter a correct answer, then rapidly press Enter/click OK several times while animation runs. Score and progress must increase by exactly one.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "fix: lock adventure answer settlement"
```

---

### Task 5: Adventure Sound Effects

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add sound helpers**

Near existing audio functions, add:

```js
function playNoiseBurst(duration, gainValue, delay = 0) {
  try {
    const ctx = getAudioCtx();
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffer;
    g.gain.setValueAtTime(gainValue, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    src.connect(g); g.connect(ctx.destination);
    src.start(ctx.currentTime + delay);
    src.stop(ctx.currentTime + delay + duration);
  } catch (e) {}
}

function playAdventureIntroSound(family) {
  if (family === 'police') return playPoliceSiren();
  if (family === 'ambulance') return playAmbulanceSiren();
  if (family === 'fire') return playFireBell();
  if (family === 'everyday') return playEverydayHorn();
  return playAdventureWhoosh();
}

function playAdventureBoost(family, streak) {
  const s = Math.max(1, Math.min(5, streak || 1));
  playTone(520 + s * 80, 'sawtooth', 0.12, 0.08 + s * 0.02);
  playTone(760 + s * 90, 'triangle', 0.16, 0.07 + s * 0.018, 0.08);
  if (s >= 3) playNoiseBurst(0.22, 0.08, 0.02);
}

function playBossEntranceSound(family) {
  playTone(180, 'sawtooth', 0.22, 0.16);
  playTone(120, 'square', 0.18, 0.10, 0.18);
  playNoiseBurst(0.35, 0.10, 0.08);
}

function playBossHitSound(family) {
  playTone(880, 'square', 0.08, 0.12);
  playTone(440, 'sawtooth', 0.18, 0.10, 0.06);
  playNoiseBurst(0.20, 0.10, 0.02);
}

function playBossDefeatSound(family) {
  playTone(523, 'triangle', 0.13, 0.12);
  playTone(659, 'triangle', 0.13, 0.12, 0.12);
  playTone(784, 'triangle', 0.22, 0.14, 0.24);
  playNoiseBurst(0.35, 0.08, 0.12);
}

function playRewardRain() {
  playTone(988, 'sine', 0.08, 0.10);
  playTone(1175, 'sine', 0.08, 0.10, 0.08);
  playTone(1319, 'sine', 0.12, 0.12, 0.16);
}
```

- [ ] **Step 2: Verify no voice mute coupling**

Do not check `voiceMuted` inside these functions. They must behave like existing sirens.

- [ ] **Step 3: Manual sound check**

With voice muted and system audio on, trigger intro/boost/Boss/reward. Voice should be silent; effects should still play.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add adventure sound effects"
```

---

### Task 6: Exaggerated Adventure Animations

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add generic timeout wrapper**

Near animation helpers, add:

```js
function onceDone(fn) {
  let called = false;
  return function () {
    if (called) return;
    called = true;
    if (fn) fn();
  };
}
```

- [ ] **Step 2: Add Boss entrance animation**

Add:

```js
function showBossEntrance(theme, vehicleEmoji, dinoEmoji, done) {
  const finish = onceDone(done);
  playBossEntranceSound(theme.id);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(finish, 80);
    return;
  }
  const ov = document.createElement('div');
  ov.className = 'adv-boss-entrance';
  ov.innerHTML = `<div class="adv-boss-card"><div class="adv-boss-emoji">${theme.bossEmoji}</div><div class="adv-boss-name">${theme.bossName}</div></div>`;
  document.body.appendChild(ov);
  ov.animate([
    { opacity: 0, background: 'rgba(0,0,0,0)' },
    { opacity: 1, background: 'rgba(0,0,0,0.45)', offset: 0.25 },
    { opacity: 1, background: 'rgba(0,0,0,0.35)', offset: 0.75 },
    { opacity: 0, background: 'rgba(0,0,0,0)' }
  ], { duration: 1100, easing: 'ease-out', fill: 'forwards' }).finished.then(() => {
    ov.remove();
    finish();
  }).catch(() => {
    ov.remove();
    finish();
  });
  setTimeout(finish, 1400);
}
```

Add CSS:

```css
.adv-boss-entrance {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.adv-boss-card {
  text-align: center;
  color: #fff;
  text-shadow: 0 4px 18px rgba(0,0,0,0.6);
  animation: advBossSlam 900ms cubic-bezier(.2,1.4,.4,1) both;
}
.adv-boss-emoji { font-size: min(28vw, 132px); line-height: 1; }
.adv-boss-name { font-size: 1.5rem; font-weight: 900; margin-top: 8px; }
@keyframes advBossSlam {
  0% { transform: scale(0.15) rotate(-18deg); filter: blur(8px); }
  55% { transform: scale(1.24) rotate(4deg); filter: blur(0); }
  75% { transform: scale(0.94) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); }
}
```

- [ ] **Step 3: Add adventure step animation**

Add:

```js
function showAdventureStep(theme, vehicleEmoji, dinoEmoji, step, streak, done) {
  const finish = onceDone(done);
  playAdventureBoost(theme.id, streak);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(finish, 80);
    return;
  }
  const vehicle = $('adventure-vehicle');
  const scene = $('adventure-scene');
  if (!vehicle || !scene) { finish(); return; }
  const power = Math.min(5, Math.max(1, streak || 1));
  scene.animate([
    { transform: 'translateX(0)' },
    { transform: `translateX(${-4 * power}px)`, offset: 0.25 },
    { transform: `translateX(${4 * power}px)`, offset: 0.50 },
    { transform: 'translateX(0)' }
  ], { duration: 360, easing: 'ease-in-out' });
  vehicle.animate([
    { transform: 'translateY(-50%) scale(1)', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.25))' },
    { transform: 'translateY(-58%) scale(1.45) rotate(-8deg)', filter: `drop-shadow(0 0 ${8 + power * 4}px ${theme.fallbackColor})`, offset: 0.45 },
    { transform: 'translateY(-50%) scale(1)', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.25))' }
  ], { duration: 700 + power * 80, easing: 'cubic-bezier(.34,1.56,.64,1)' }).finished.then(finish).catch(finish);
  for (let i = 0; i < 8 + power * 5; i++) {
    const p = document.createElement('span');
    p.className = 'adv-spark';
    p.textContent = i % 3 === 0 ? '⭐' : '✨';
    p.style.left = `${15 + Math.random() * 70}%`;
    p.style.top = `${10 + Math.random() * 70}%`;
    scene.appendChild(p);
    p.animate([
      { transform: 'translate(0,0) scale(0.4)', opacity: 0 },
      { transform: `translate(${(Math.random()-0.5)*100}px, ${(Math.random()-0.5)*50}px) scale(1.2)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${(Math.random()-0.5)*180}px, ${(Math.random()-0.5)*90}px) scale(0.2)`, opacity: 0 }
    ], { duration: 650 + Math.random() * 380, easing: 'ease-out', fill: 'forwards' }).finished.then(() => p.remove()).catch(() => p.remove());
  }
  setTimeout(finish, 1300);
}
```

Add CSS:

```css
.adv-spark {
  position: absolute;
  z-index: 2;
  font-size: 18px;
  pointer-events: none;
}
```

- [ ] **Step 4: Add Boss finisher animation**

Add:

```js
function showBossFinisher(theme, vehicleEmoji, dinoEmoji, streak, done) {
  const finish = onceDone(done);
  playBossHitSound(theme.id);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    playBossDefeatSound(theme.id);
    setTimeout(finish, 100);
    return;
  }
  const ov = document.createElement('div');
  ov.className = 'adv-finisher';
  ov.innerHTML = `
    <div class="adv-finisher-vehicle">${vehicleEmoji}</div>
    <div class="adv-finisher-boss">${theme.bossEmoji}</div>
    <div class="adv-finisher-text">${theme.victoryLine}</div>
  `;
  document.body.appendChild(ov);
  setTimeout(() => playBossDefeatSound(theme.id), 650);
  setTimeout(() => playRewardRain(), 1150);
  ov.animate([
    { opacity: 0 },
    { opacity: 1, offset: 0.12 },
    { opacity: 1, offset: 0.82 },
    { opacity: 0 }
  ], { duration: 2200, easing: 'ease-out', fill: 'forwards' }).finished.then(() => {
    ov.remove();
    startFireworks(1400);
    finish();
  }).catch(() => {
    ov.remove();
    finish();
  });
  setTimeout(finish, 2600);
}
```

Add CSS:

```css
.adv-finisher {
  position: fixed;
  inset: 0;
  z-index: 135;
  pointer-events: none;
  overflow: hidden;
  background: radial-gradient(circle at center, rgba(255,214,0,0.30), rgba(0,0,0,0.50));
}
.adv-finisher-vehicle {
  position: absolute;
  left: -18vw;
  top: 40vh;
  font-size: min(24vw, 118px);
  animation: advVehicleStrike 1500ms cubic-bezier(.18,.9,.25,1) both;
}
.adv-finisher-boss {
  position: absolute;
  right: 13vw;
  top: 34vh;
  font-size: min(26vw, 128px);
  animation: advBossDefeat 1700ms ease-out both;
}
.adv-finisher-text {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18vh;
  text-align: center;
  color: #fff;
  font-size: clamp(1.7rem, 7vw, 3rem);
  font-weight: 900;
  text-shadow: 0 5px 18px rgba(0,0,0,0.65);
  animation: advTextPop 1300ms cubic-bezier(.34,1.56,.64,1) 700ms both;
}
@keyframes advVehicleStrike {
  0% { transform: translateX(0) scale(0.8) rotate(-8deg); }
  55% { transform: translateX(58vw) scale(1.5) rotate(6deg); }
  100% { transform: translateX(125vw) scale(1.0) rotate(16deg); }
}
@keyframes advBossDefeat {
  0%, 35% { transform: scale(1) rotate(0); filter: brightness(1); }
  55% { transform: scale(1.45) rotate(-12deg); filter: brightness(2.2); }
  100% { transform: scale(0.1) rotate(45deg); filter: brightness(3); opacity: 0; }
}
@keyframes advTextPop {
  0% { transform: scale(0.2); opacity: 0; }
  65% { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

- [ ] **Step 5: Add intro animation**

Add:

```js
function showAdventureIntro(theme, vehicleEmoji, dinoEmoji, done) {
  const finish = onceDone(done);
  playAdventureIntroSound(theme.id);
  renderAdventureHud();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(finish, 80);
    return;
  }
  const hud = $('adventure-hud');
  if (!hud) { finish(); return; }
  hud.animate([
    { transform: 'translateY(-18px) scale(0.96)', opacity: 0 },
    { transform: 'translateY(4px) scale(1.03)', opacity: 1, offset: 0.75 },
    { transform: 'translateY(0) scale(1)', opacity: 1 }
  ], { duration: 720, easing: 'cubic-bezier(.34,1.56,.64,1)' }).finished.then(finish).catch(finish);
  setTimeout(finish, 1000);
}
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add adventure animations"
```

---

### Task 7: Replace Correct-Answer Long Chain

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the correct-answer async chain**

In `submitAnswer()`, replace the block beginning with:

```js
setTimeout(() => {
  showCelebrate(() => {
```

through its matching callback close with:

```js
setTimeout(() => {
  const theme = Adventure.getTheme(adventureRun.family);
  const e = currentPlayer ? equippedEmojis(currentPlayer) : { vehicle: theme.targetEmoji, dino: '🦕' };
  const goNext = () => {
    adventureRun = Adventure.finishStep(adventureRun, currentIdx);
    renderAdventureHud();
    currentIdx++;
    setInputLocked(false);
    if (currentIdx >= questions.length) showResult();
    else renderQuestion();
  };
  if (currentIdx >= questions.length - 1) {
    speakQueue([theme.victoryLine], 0.9);
    showBossFinisher(theme, e.vehicle, e.dino, correctStreak, goNext);
  } else {
    const line = theme.stepLines[Math.min(currentIdx, theme.stepLines.length - 1)];
    speak(line, 0.9);
    showAdventureStep(theme, e.vehicle, e.dino, currentIdx, correctStreak, goNext);
  }
}, 220);
```

- [ ] **Step 2: Keep existing non-answer uses of `showVehicleRush`**

Do not remove `showVehicleRush`; garage unlock animation still calls it.

- [ ] **Step 3: Manual timing check**

Answer one correct question. Confirm only one full adventure animation plays, not `showCelebrate`, `showVehicleRush`, and adventure all stacked together.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: route answers through adventure flow"
```

---

### Task 8: Verification and Acceptance Pass

**Files:**
- Modify: `docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md`

- [ ] **Step 1: Run pure tests**

Run: `node --test tests/garage.test.js tests/adventure.test.js`

Expected: all tests pass.

- [ ] **Step 2: Start a local server**

Run: `python3 -m http.server 4173`

Expected: server serves the project at `http://localhost:4173`.

- [ ] **Step 3: Browser smoke test**

Open `http://localhost:4173/index.html` with Browser. Check:

- HUD appears.
- Start -> player -> quiz works.
- Correct answer locks input during animation.
- Question 5 Boss speech and question speech do not cut each other off.
- Final result appears once.

- [ ] **Step 4: Five-family acceptance**

Use console/localStorage or the UI garage to equip one vehicle from each family and run at least one happy path:

- `police`: `police`
- `ambulance`: `ambulance`
- `fire`: `fire`
- `everyday`: `schoolbus`
- `adventure`: `rocket`

For each family verify: intro animation, boost animation, Boss entrance, finisher, sound effects, voice, and non-text visual clarity.

- [ ] **Step 5: Reduced-motion and voice-mute checks**

Use browser emulation or temporary CSS/media override for reduced motion. Verify reduced-motion completes state changes. Toggle voice mute and confirm voice stops but adventure sound effects still play.

- [ ] **Step 6: Mark checklist evidence**

Only after manual/browser evidence, update `docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md` with checked boxes for verified items.

- [ ] **Step 7: Final status**

Run:

```bash
git status --short --branch
git log --oneline -5
```

Expected: only intended files changed; commits are visible on `game-upgrade-index-html`.

---

## Self-Review Notes

- Spec coverage: tasks cover pure state, five themes, HUD, voice sequencing, submission lock, sounds, exaggerated animations, replacement of the current answer animation chain, and acceptance verification.
- Red-flag scan: no unresolved tokens. The plan includes concrete commands and code snippets for core changes.
- Type consistency: `Adventure.THEMES`, `Adventure.getTheme`, `Adventure.createRun`, `Adventure.beginSettle`, `Adventure.finishStep`, `Adventure.shouldShowBoss`, and `Adventure.markBossShown` are defined in Task 1 and used consistently later.
