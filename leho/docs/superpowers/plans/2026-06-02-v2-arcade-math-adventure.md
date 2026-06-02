# 小恐龙数学冒险 V2 Implementation Plan

> **给 agentic workers：** REQUIRED SUB-SKILL：使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务逐项执行本计划。步骤使用 checkbox (`- [ ]`) 语法跟踪。

**Goal:** 在 `v2/` 下实现独立的 V2 儿童街机数学冒险游戏，保留旧版题库、记录、金币、车库、奖杯规则，同时重做首页、玩家选择、答题驾驶舱、结算舞台和奖杯大厅。

**Architecture:** V2 只新增和修改 `v2/` 内文件；旧版 `index.html` 保留为基线。纯逻辑放在 `v2/scripts/questions.js`、`v2/scripts/themes.js`、`v2/scripts/rewards.js`、`v2/scripts/game-state.js`、`v2/scripts/storage.js`、`v2/scripts/speech.js`，表现层放在 `v2/scripts/ui.js`、`v2/scripts/motion.js` 和 `v2/styles/*`。浏览器页面通过 `<script src="../logic/question-mix.js">`、`<script src="../garage.js">`、`<script src="../adventure.js">` 复用旧逻辑，Node 测试通过 `require()` 引入同一批模块。

**Tech Stack:** 原生 HTML/CSS/JavaScript、UMD/CommonJS 模块、Web Speech API、Web Audio API、Web Animations API、Node 内置测试运行器、Browser 插件做本地页面验证。

---

## File Structure

- Create `v2/index.html`: V2 单页应用入口，包含首页、玩家选择、答题驾驶舱、结果页、车库页、奖杯大厅入口和脚本加载顺序。
- Create `v2/styles/base.css`: 全局变量、重置、页面切换、可访问性和基础排版。
- Create `v2/styles/arcade.css`: 首页、玩家选择、答题驾驶舱、数字键盘、结果页、奖杯大厅的主视觉布局。
- Create `v2/styles/themes.css`: 五类座驾主题的背景、boss、路线、光效。
- Create `v2/styles/motion.css`: 动效 keyframes、连击层级、减少动效模式。
- Create `v2/scripts/questions.js`: 题目生成、题型包装、朗读文本、提示范围；依赖 `QuestionMix`，不依赖 DOM。
- Create `v2/scripts/themes.js`: 座驾到主题映射、主题配置、主题校验；依赖 `Garage`，不依赖 DOM。
- Create `v2/scripts/rewards.js`: 星星、金币结算、记录聚合、奖杯/勋章规则、奖励排序、能力亮点；依赖 `Garage` 和 `QuestionMix`，不依赖 DOM。
- Create `v2/scripts/game-state.js`: 当前局状态机、答题提交、错误提示、结算数据；不依赖 DOM。
- Create `v2/scripts/storage.js`: 兼容旧版 localStorage key，负责玩家记录、玩家名、车库状态、金币入账。
- Create `v2/scripts/motion.js`: 动效预算、减少动效判断、粒子数量、CSS class 编排；尽量不写业务逻辑。
- Create `v2/scripts/speech.js`: 可取消朗读队列、静音开关、新一轮开始时停止旧朗读。
- Create `v2/scripts/ui.js`: 页面初始化、DOM 渲染、事件绑定、语音和音效调度。
- Create `v2/tests/questions.test.js`: 题型模板、固定随机序列、答案/算式/朗读一致性测试。
- Create `v2/tests/themes.test.js`: 主题映射、主题字段、车库座驾覆盖测试。
- Create `v2/tests/rewards.test.js`: 金币、星星、记录、奖杯/勋章优先级、能力亮点测试。
- Create `v2/tests/game-state.test.js`: 一轮 5 题、答错继续尝试、重复提交保护、结算幂等测试。
- Create `v2/tests/storage.test.js`: 旧版 localStorage key、记录保存、金币入账、车库购买和装备测试。
- Create `v2/tests/motion.test.js`: 动效时间预算、粒子上限、减少动效分支测试。
- Create `v2/tests/speech.test.js`: 朗读队列、取消、静音、新一轮停止旧朗读测试。
- Create `v2/tests/static-ui.test.js`: V2 HTML/CSS/JS 静态结构、脚本顺序、关键 ID、响应式规则测试。

所有实现代码必须在 `v2/` 下。允许 V2 页面和测试读取旧版纯逻辑文件：`logic/question-mix.js`、`garage.js`、`adventure.js`。不要修改旧版 `index.html`。

---

### Task 1: V2 Skeleton And Static Contract

**Files:**
- Create: `v2/index.html`
- Create: `v2/styles/base.css`
- Create: `v2/styles/arcade.css`
- Create: `v2/styles/themes.css`
- Create: `v2/styles/motion.css`
- Create: `v2/scripts/ui.js`
- Create: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Write the failing static UI contract test**

Create `v2/tests/static-ui.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('v2 index loads shared legacy logic before v2 modules', () => {
  const html = read('index.html');
  const order = [
    '../logic/question-mix.js',
    '../garage.js',
    '../adventure.js',
    'scripts/questions.js',
    'scripts/themes.js',
    'scripts/rewards.js',
    'scripts/game-state.js',
    'scripts/storage.js',
    'scripts/motion.js',
    'scripts/speech.js',
    'scripts/ui.js'
  ];
  let cursor = -1;
  for (const src of order) {
    const index = html.indexOf(`src="${src}"`);
    assert.notEqual(index, -1, `missing script ${src}`);
    assert.ok(index > cursor, `${src} must load after previous dependency`);
    cursor = index;
  }
});

test('v2 index exposes the required app pages and controls', () => {
  const html = read('index.html');
  [
    'page-home',
    'page-player',
    'page-game',
    'page-result',
    'page-garage',
    'page-trophies',
    'btn-start',
    'btn-open-garage',
    'player-lele',
    'player-haohao',
    'adventure-stage',
    'question-story',
    'question-equation',
    'answer-display',
    'numpad',
    'btn-submit',
    'result-award-stage',
    'garage-grid',
    'garage-message',
    'trophy-hall'
  ].forEach(id => assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`));
});

test('v2 css files are linked and define reduced motion support', () => {
  const html = read('index.html');
  [
    'styles/base.css',
    'styles/arcade.css',
    'styles/themes.css',
    'styles/motion.css'
  ].forEach(href => assert.match(html, new RegExp(`href="${href}"`), `missing ${href}`));

  const motionCss = read('styles/motion.css');
  assert.match(motionCss, /prefers-reduced-motion:\s*reduce/);
});
```

- [ ] **Step 2: Run the static UI test and verify failure**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because `v2/index.html` and the CSS/JS files do not exist yet.

- [ ] **Step 3: Create the minimal V2 shell**

Create `v2/index.html` with:

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>小恐龙数学冒险 V2</title>
  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/arcade.css">
  <link rel="stylesheet" href="styles/themes.css">
  <link rel="stylesheet" href="styles/motion.css">
</head>
<body>
  <main class="app-shell" id="app-shell">
    <section class="page page-home active" id="page-home" data-page="home">
      <div class="home-racetrack" aria-hidden="true"></div>
      <div class="home-players" aria-hidden="true">
        <span class="home-combo">🚓🦕</span>
        <span class="home-combo">🚑🦖</span>
      </div>
      <h1>小恐龙数学冒险</h1>
      <button class="arcade-primary" id="btn-start" type="button">开始冒险</button>
      <div class="icon-actions">
        <button id="btn-open-trophies" type="button" aria-label="奖杯大厅">🏆</button>
        <button id="btn-toggle-voice" type="button" aria-label="静音">🔊</button>
      </div>
    </section>

    <section class="page page-player" id="page-player" data-page="player" aria-hidden="true">
      <h2>选择出赛车手</h2>
      <div class="player-grid">
        <button class="player-stand" id="player-lele" type="button" data-player="lele">
          <span class="player-combo" id="lele-combo">🚓🦕</span>
          <strong id="lele-name">乐乐</strong>
          <span id="lele-stats">⭐ 0 · 🪙 0</span>
          <span class="mini-trophies" id="lele-trophies">还没有奖杯</span>
        </button>
        <button class="player-stand" id="player-haohao" type="button" data-player="haohao">
          <span class="player-combo" id="haohao-combo">🚑🦖</span>
          <strong id="haohao-name">昊昊</strong>
          <span id="haohao-stats">⭐ 0 · 🪙 0</span>
          <span class="mini-trophies" id="haohao-trophies">还没有奖杯</span>
        </button>
      </div>
      <button id="btn-open-garage" type="button">我的车库</button>
    </section>

    <section class="page page-game" id="page-game" data-page="game" aria-hidden="true">
      <header class="game-topbar">
        <span id="round-player">乐乐</span>
        <span id="round-progress">1 / 5</span>
        <span id="round-score">⭐ 0</span>
      </header>
      <div class="adventure-stage theme-adventure" id="adventure-stage">
        <div class="stage-sky" id="stage-sky" aria-hidden="true"></div>
        <div class="stage-route" id="stage-route" aria-hidden="true"></div>
        <span class="stage-vehicle" id="stage-vehicle">🚀🦕</span>
        <span class="stage-boss" id="stage-boss">☄️</span>
        <div class="stage-energy" aria-hidden="true"><span id="stage-energy-fill"></span></div>
      </div>
      <article class="question-panel" id="question-panel">
        <p id="question-story"></p>
        <div id="question-equation" aria-label="算式"></div>
        <div class="answer-row">
          <span id="answer-display" aria-live="polite"></span>
          <button id="btn-clear" type="button">删除</button>
        </div>
        <p id="feedback-message" aria-live="polite"></p>
      </article>
      <div class="numpad" id="numpad" aria-label="数字键盘"></div>
      <button class="arcade-primary submit" id="btn-submit" type="button">OK</button>
    </section>

    <section class="page page-result" id="page-result" data-page="result" aria-hidden="true">
      <div class="result-award-stage" id="result-award-stage">
        <span id="result-combo">🦕</span>
        <h2 id="result-title">冒险完成</h2>
        <div id="result-score">0 / 5</div>
        <div id="result-stars"></div>
        <div id="result-coins"></div>
        <div id="result-awards"></div>
        <div id="result-highlights"></div>
      </div>
      <button class="arcade-primary" id="btn-again" type="button">再来一次</button>
      <button id="btn-result-garage" type="button">去车库</button>
      <button id="btn-result-trophies" type="button">奖杯大厅</button>
    </section>

    <section class="page page-garage" id="page-garage" data-page="garage" aria-hidden="true">
      <h2><span id="garage-player-name">乐乐</span>的车库</h2>
      <div class="garage-wallet">🪙 <span id="garage-coins">0</span></div>
      <div class="garage-grid" id="garage-grid"></div>
      <p id="garage-message" aria-live="polite"></p>
      <button id="btn-garage-back" type="button">返回</button>
    </section>

    <section class="page page-trophies" id="page-trophies" data-page="trophies" aria-hidden="true">
      <h2>奖杯与成就大厅</h2>
      <div class="trophy-hall" id="trophy-hall"></div>
      <button id="btn-trophies-back" type="button">返回</button>
    </section>
  </main>

  <script src="../logic/question-mix.js"></script>
  <script src="../garage.js"></script>
  <script src="../adventure.js"></script>
  <script src="scripts/questions.js"></script>
  <script src="scripts/themes.js"></script>
  <script src="scripts/rewards.js"></script>
  <script src="scripts/game-state.js"></script>
  <script src="scripts/storage.js"></script>
  <script src="scripts/motion.js"></script>
  <script src="scripts/speech.js"></script>
  <script src="scripts/ui.js"></script>
</body>
</html>
```

Create `v2/styles/base.css` with:

```css
:root {
  --ink: #17324d;
  --paper: #fff8e7;
  --panel: rgba(255, 255, 255, 0.92);
  --line: rgba(23, 50, 77, 0.18);
  --yellow: #ffd447;
  --orange: #ff8a2a;
  --green: #18b875;
  --blue: #1b8cff;
  --red: #f04b3e;
  --shadow: 0 18px 40px rgba(18, 34, 56, 0.22);
  font-family: "Trebuchet MS", "PingFang SC", "Microsoft YaHei", sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  color: var(--ink);
  background: #0d2442;
  overflow-x: hidden;
}
button { font: inherit; cursor: pointer; }
.app-shell { min-height: 100svh; position: relative; overflow: hidden; }
.page { display: none; min-height: 100svh; padding: 20px; }
.page.active { display: grid; }
.page[aria-hidden="true"] { display: none; }
.arcade-primary {
  border: 0;
  border-radius: 18px;
  padding: 16px 28px;
  color: #3b2400;
  background: linear-gradient(180deg, #fff176, var(--yellow));
  box-shadow: 0 8px 0 #b65f00, var(--shadow);
  font-weight: 900;
}
```

Create `v2/styles/arcade.css` with:

```css
.page-home {
  place-items: center;
  text-align: center;
  background:
    radial-gradient(circle at 50% 10%, rgba(255, 244, 122, 0.9), transparent 24%),
    linear-gradient(180deg, #36b5ff 0%, #7ed957 45%, #194c7d 100%);
}
.home-racetrack {
  position: absolute;
  inset: 42% -20% -10%;
  background: linear-gradient(90deg, transparent 47%, rgba(255,255,255,.8) 49%, transparent 51%),
              linear-gradient(180deg, #2f3640, #121820);
  transform: perspective(520px) rotateX(58deg);
}
.home-players, .icon-actions { position: relative; z-index: 1; }
.home-combo { font-size: clamp(54px, 12vw, 120px); filter: drop-shadow(0 14px 12px rgba(0,0,0,.28)); }
.page-home h1 { position: relative; z-index: 1; font-size: clamp(34px, 8vw, 76px); margin: 0; }
.player-grid { display: grid; grid-template-columns: repeat(2, minmax(130px, 260px)); gap: 18px; justify-content: center; }
.player-stand { border: 0; border-radius: 20px; padding: 18px; background: var(--panel); box-shadow: var(--shadow); }
.player-combo { display: block; font-size: clamp(48px, 10vw, 90px); }
.page-game { grid-template-rows: auto minmax(110px, 28vh) auto auto auto; gap: 10px; background: #102c54; }
.game-topbar { display: flex; justify-content: space-between; color: white; font-weight: 900; }
.adventure-stage { position: relative; overflow: hidden; border-radius: 18px; min-height: 110px; box-shadow: var(--shadow); }
.stage-vehicle, .stage-boss { position: absolute; font-size: clamp(38px, 9vw, 88px); z-index: 3; }
.stage-vehicle { left: 8%; bottom: 18%; }
.stage-boss { right: 10%; top: 18%; }
.stage-energy { position: absolute; left: 16px; right: 16px; bottom: 12px; height: 12px; border-radius: 999px; background: rgba(255,255,255,.32); overflow: hidden; }
#stage-energy-fill { display: block; width: 0%; height: 100%; background: linear-gradient(90deg, #65ff7a, #fff176, #ff8a2a); }
.question-panel { background: var(--panel); border-radius: 18px; padding: 14px; text-align: center; box-shadow: var(--shadow); }
#question-story { margin: 0 0 8px; font-size: clamp(18px, 4.7vw, 28px); font-weight: 800; }
#question-equation { font-size: clamp(30px, 9vw, 58px); font-weight: 900; }
.answer-row { display: flex; justify-content: center; align-items: center; gap: 10px; }
#answer-display { min-width: 84px; min-height: 44px; border-radius: 14px; background: white; border: 3px solid var(--blue); font-size: 32px; font-weight: 900; }
.numpad { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; max-width: 360px; width: 100%; margin: 0 auto; }
.numpad button { min-height: 46px; border: 0; border-radius: 14px; background: #fff; box-shadow: 0 5px 0 #9db3c7; font-weight: 900; font-size: 22px; }
.submit { justify-self: center; min-width: 180px; }
.page-result, .page-trophies { place-items: center; background: linear-gradient(180deg, #11386a, #351366); color: white; }
.result-award-stage, .trophy-hall { width: min(680px, 100%); border-radius: 22px; padding: 20px; background: rgba(255,255,255,.12); box-shadow: var(--shadow); text-align: center; }
```

Create `v2/styles/themes.css` with:

```css
.theme-police { background: linear-gradient(135deg, #071a3c, #1363df); }
.theme-ambulance { background: linear-gradient(135deg, #073b2f, #19d18f); }
.theme-fire { background: linear-gradient(135deg, #4b1208, #ff6a1a); }
.theme-everyday { background: linear-gradient(135deg, #1f6aa5, #ffd45c); }
.theme-adventure { background: radial-gradient(circle at 65% 20%, #9f7bff, transparent 22%), linear-gradient(135deg, #150b35, #2858ff); }
.theme-police .stage-route,
.theme-ambulance .stage-route,
.theme-fire .stage-route,
.theme-everyday .stage-route,
.theme-adventure .stage-route {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 54%;
  height: 12px;
  border-radius: 999px;
  background: rgba(255,255,255,.55);
}
```

Create `v2/styles/motion.css` with:

```css
@keyframes v2Pulse {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.04); }
}
@keyframes v2CorrectDash {
  0% { transform: translateX(0) scale(1); }
  70% { transform: translateX(42vw) scale(1.16); }
  100% { transform: translateX(0) scale(1); }
}
@keyframes v2WrongShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-6px); }
}
.home-combo { animation: v2Pulse 2.4s ease-in-out infinite; }
.motion-correct .stage-vehicle { animation: v2CorrectDash 1100ms cubic-bezier(.22,1,.36,1); }
.motion-wrong .question-panel { animation: v2WrongShake 420ms ease-in-out; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

Create `v2/scripts/ui.js` with:

```js
(function (root) {
  'use strict';

  function setPage(id) {
    document.querySelectorAll('.page').forEach(page => {
      const active = page.id === id;
      page.classList.toggle('active', active);
      page.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function initNumpad() {
    const pad = document.getElementById('numpad');
    if (!pad) return;
    pad.innerHTML = '';
    [1,2,3,4,5,6,7,8,9,0].forEach(n => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(n);
      button.dataset.digit = String(n);
      pad.appendChild(button);
    });
  }

  function init() {
    initNumpad();
    document.getElementById('btn-start').addEventListener('click', () => setPage('page-player'));
    document.getElementById('btn-open-trophies').addEventListener('click', () => setPage('page-trophies'));
    document.getElementById('btn-trophies-back').addEventListener('click', () => setPage('page-home'));
  }

  root.V2UI = { setPage, initNumpad, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the static UI test and verify pass**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the V2 shell**

Run:

```bash
git add v2/index.html v2/styles/base.css v2/styles/arcade.css v2/styles/themes.css v2/styles/motion.css v2/scripts/ui.js v2/tests/static-ui.test.js
git commit -m "feat: add v2 app shell"
```

---

### Task 2: Question Generation Module

**Files:**
- Create: `v2/scripts/questions.js`
- Create: `v2/tests/questions.test.js`
- Modify: `v2/index.html`

- [ ] **Step 1: Write failing question module tests**

Create `v2/tests/questions.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const QuestionMix = require('../../logic/question-mix.js');
const Questions = require('../scripts/questions.js');

function seq(values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

test('generateRound returns five mixed typed questions with stats-compatible types', () => {
  const round = Questions.generateRound({
    count: 5,
    family: 'police',
    rand: seq([0, 0.2, 0.6, 0.78, 0.94, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
  });
  assert.equal(round.length, 5);
  round.forEach(q => assert.ok(QuestionMix.QUESTION_TYPES.includes(q.type), q.type));
  const stats = QuestionMix.buildRoundTypeStats(round, { 0: true, 1: true });
  assert.equal(Object.keys(stats).length, 5);
});

test('missing question keeps unknown operand, answer, and readEquation aligned', () => {
  const q = Questions.generateMissingQuestion({ family: 'adventure', rand: seq([0, 0.4, 0.4]) });
  assert.equal(q.type, 'missing');
  assert.deepEqual(q.equationParts, ['?', '+', 5, '=', 10]);
  assert.equal(q.answer, 5);
  assert.equal(q.readEquation, '几加 5 等于 10？');
  assert.match(q.question, /一开始/);
});

test('compare question asks the same direction as its equation', () => {
  const q = Questions.generateCompareQuestion({ family: 'everyday', rand: seq([0.95, 0.1, 0.9]) });
  assert.equal(q.type, 'compare');
  assert.equal(q.answer, q.a - q.b);
  assert.match(q.story, /校车上有/);
  assert.match(q.question, /公交车比校车多多少位/);
  assert.deepEqual(q.equationParts, [q.a, '-', q.b, '=']);
});

test('two-step question preserves action order in equation and speech', () => {
  const q = Questions.generateTwoStepQuestion({ family: 'fire', rand: seq([0.8, 0.5, 0.5, 0.5]) });
  assert.equal(q.type, 'twoStep');
  assert.equal(q.answer, q.a - q.b + q.c);
  assert.deepEqual(q.equationParts, [q.a, '-', q.b, '+', q.c, '=']);
  assert.equal(q.readEquation, `${q.a} 减 ${q.b} 再加 ${q.c} 等于多少？`);
});

test('answerHintRange is not capped at old twenty question range', () => {
  assert.deepEqual(Questions.answerHintRange({ answer: 27 }), { min: 24, max: 30 });
  assert.deepEqual(Questions.answerHintRange({ answer: 1 }), { min: 0, max: 4 });
});
```

- [ ] **Step 2: Run question tests and verify failure**

Run:

```bash
node --test v2/tests/questions.test.js
```

Expected: FAIL because `v2/scripts/questions.js` does not exist.

- [ ] **Step 3: Implement question generation**

Create `v2/scripts/questions.js` with:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../logic/question-mix.js'));
  } else {
    root.V2Questions = factory(root.QuestionMix);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (QuestionMix) {
  'use strict';

  function rngOf(rand) { return typeof rand === 'function' ? rand : Math.random; }
  function randInt(min, max, rand) {
    const r = Math.max(0, Math.min(0.999999999, rngOf(rand)()));
    return Math.floor(r * (max - min + 1)) + min;
  }

  const ADD_STORIES = [
    (a, b) => ({ tag: 'police', text: `警车找到 ${a} 个线索，又找到 ${b} 个线索，`, q: '一共有多少个线索？' }),
    (a, b) => ({ tag: 'ambulance', text: `救护车带来 ${a} 个急救包，又补充 ${b} 个，`, q: '现在有多少个急救包？' }),
    (a, b) => ({ tag: 'fire', text: `消防车接好 ${a} 根水管，又接好 ${b} 根，`, q: '一共接好多少根水管？' }),
    (a, b) => ({ tag: 'everyday', text: `车站来了 ${a} 位小朋友，又来了 ${b} 位，`, q: '现在有多少位小朋友？' }),
    (a, b) => ({ tag: 'adventure', text: `火箭收集 ${a} 颗星星，又收集 ${b} 颗，`, q: '一共有多少颗星星？' })
  ];

  const SUB_STORIES = [
    (a, b) => ({ tag: 'police', text: `警车有 ${a} 个路障，清理了 ${b} 个，`, q: '还剩多少个路障？' }),
    (a, b) => ({ tag: 'ambulance', text: `救护车有 ${a} 个急救包，用掉 ${b} 个，`, q: '还剩多少个急救包？' }),
    (a, b) => ({ tag: 'fire', text: `火场有 ${a} 处火苗，扑灭了 ${b} 处，`, q: '还剩多少处火苗？' }),
    (a, b) => ({ tag: 'everyday', text: `公交车上有 ${a} 位小朋友，下车 ${b} 位，`, q: '车上还剩多少位？' }),
    (a, b) => ({ tag: 'adventure', text: `火箭有 ${a} 桶燃料，用掉 ${b} 桶，`, q: '还剩多少桶燃料？' })
  ];

  function pickStory(pool, family) {
    const preferred = pool.find(fn => fn(1, 1).tag === family);
    return preferred || pool[pool.length - 1];
  }

  function attachEquation(q, equationParts, readEquation) {
    return { ...q, equationParts, readEquation };
  }

  function makeStoryQuestion(a, b, op, type, family) {
    if (op === '+') {
      const story = pickStory(ADD_STORIES, family)(a, b);
      return attachEquation(
        { a, b, op, answer: a + b, story: story.text, question: story.q, tag: story.tag, type },
        [a, '+', b, '='],
        `${a} 加 ${b} 等于多少？`
      );
    }
    const story = pickStory(SUB_STORIES, family)(a, b);
    return attachEquation(
      { a, b, op, answer: a - b, story: story.text, question: story.q, tag: story.tag, type },
      [a, '-', b, '='],
      `${a} 减 ${b} 等于多少？`
    );
  }

  function generateBasicQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    if (rand() < 0.55) {
      const a = randInt(1, 9, rand);
      const b = randInt(1, Math.max(1, 10 - a), rand);
      return makeStoryQuestion(a, b, '+', 'basic', family);
    }
    const a = randInt(2, 10, rand);
    const b = randInt(1, a, rand);
    return makeStoryQuestion(a, b, '-', 'basic', family);
  }

  function generateCarryBorrowQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    if (rand() < 0.55) {
      const a = randInt(6, 9, rand);
      const b = randInt(11 - a, 9, rand);
      return makeStoryQuestion(a, b, '+', 'carryBorrow', family);
    }
    const a = randInt(11, 18, rand);
    const b = randInt((a % 10) + 1, 9, rand);
    return makeStoryQuestion(a, b, '-', 'carryBorrow', family);
  }

  function generateMissingQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    const mode = randInt(0, 3, rand);
    if (mode === 0) {
      const a = randInt(3, 9, rand), b = randInt(3, 9, rand), total = a + b;
      return attachEquation(
        { a, b, op: '+', answer: a, story: `小恐龙先有一些星星，又找到 ${b} 颗，合起来是 ${total} 颗，`, question: '它一开始有多少颗？', tag: family, type: 'missing' },
        ['?', '+', b, '=', total],
        `几加 ${b} 等于 ${total}？`
      );
    }
    if (mode === 1) {
      const a = randInt(3, 9, rand), b = randInt(3, 9, rand), total = a + b;
      return attachEquation(
        { a, b, op: '+', answer: b, story: `小恐龙先有 ${a} 颗星星，又找到一些，合起来是 ${total} 颗，`, question: '后来又找到多少颗？', tag: family, type: 'missing' },
        [a, '+', '?', '=', total],
        `${a} 加几等于 ${total}？`
      );
    }
    if (mode === 2) {
      const a = randInt(11, 20, rand), b = randInt(2, 9, rand), left = a - b;
      return attachEquation(
        { a, b, op: '-', answer: a, story: `救援车上原来有一些急救包，用掉 ${b} 个后还剩 ${left} 个，`, question: '原来有多少个急救包？', tag: family, type: 'missing' },
        ['?', '-', b, '=', left],
        `几减 ${b} 等于 ${left}？`
      );
    }
    const a = randInt(11, 20, rand), answer = randInt(2, 9, rand), left = a - answer;
    return attachEquation(
      { a, b: answer, op: '-', answer, story: `小恐龙有 ${a} 颗星星，送出去一些后还剩 ${left} 颗，`, question: '它送出去了多少颗？', tag: family, type: 'missing' },
      [a, '-', '?', '=', left],
      `${a} 减几等于 ${left}？`
    );
  }

  function generateCompareQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    const high = randInt(9, 20, rand);
    const low = randInt(1, high - 1, rand);
    const askMore = rand() < 0.75;
    if (askMore) {
      return attachEquation(
        { a: high, b: low, op: '-', answer: high - low, story: `小恐龙有 ${high} 颗星星，小伙伴有 ${low} 颗，`, question: '小恐龙比小伙伴多多少颗？', tag: family, type: 'compare' },
        [high, '-', low, '='],
        `${high} 减 ${low} 等于多少？`
      );
    }
    return attachEquation(
      { a: high, b: low, op: '-', answer: high - low, story: `校车上有 ${low} 位小朋友，公交车上有 ${high} 位小朋友，`, question: '公交车比校车多多少位？', tag: family, type: 'compare' },
      [high, '-', low, '='],
      `${high} 减 ${low} 等于多少？`
    );
  }

  function generateTwoStepQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const family = options.family || 'adventure';
    if (rand() < 0.5) {
      const a = randInt(6, 14, rand);
      const b = randInt(2, Math.min(8, 20 - a), rand);
      const c = randInt(1, Math.min(9, a + b - 1), rand);
      return attachEquation(
        { a, b, c, op: '+-', answer: a + b - c, story: `小恐龙先收集 ${a} 颗星星，又收集 ${b} 颗，后来送给朋友 ${c} 颗，`, question: '现在还剩多少颗？', tag: family, type: 'twoStep' },
        [a, '+', b, '-', c, '='],
        `${a} 加 ${b} 再减 ${c} 等于多少？`
      );
    }
    const a = randInt(10, 20, rand);
    const b = randInt(1, Math.min(9, a - 1), rand);
    const c = randInt(1, Math.min(9, 30 - (a - b)), rand);
    return attachEquation(
      { a, b, c, op: '-+', answer: a - b + c, story: `火箭带了 ${a} 桶燃料，飞行用掉 ${b} 桶，又补充 ${c} 桶，`, question: '现在有多少桶燃料？', tag: family, type: 'twoStep' },
      [a, '-', b, '+', c, '='],
      `${a} 减 ${b} 再加 ${c} 等于多少？`
    );
  }

  function generateQuestion(options = {}) {
    const rand = rngOf(options.rand);
    const type = options.type || QuestionMix.chooseQuestionType(rand);
    const nextOptions = { ...options, rand };
    if (type === 'basic') return generateBasicQuestion(nextOptions);
    if (type === 'carryBorrow') return generateCarryBorrowQuestion(nextOptions);
    if (type === 'missing') return generateMissingQuestion(nextOptions);
    if (type === 'compare') return generateCompareQuestion(nextOptions);
    if (type === 'twoStep') return generateTwoStepQuestion(nextOptions);
    return generateCarryBorrowQuestion(nextOptions);
  }

  function generateRound(options = {}) {
    const count = Math.max(1, Math.floor(Number(options.count) || 5));
    const rand = rngOf(options.rand);
    return Array.from({ length: count }, () => generateQuestion({ ...options, rand }));
  }

  function answerHintRange(q) {
    const answer = Math.max(0, Math.floor(Number(q && q.answer) || 0));
    return { min: Math.max(0, answer - 3), max: answer + 3 };
  }

  return {
    randInt,
    generateRound,
    generateQuestion,
    generateBasicQuestion,
    generateCarryBorrowQuestion,
    generateMissingQuestion,
    generateCompareQuestion,
    generateTwoStepQuestion,
    answerHintRange
  };
});
```

- [ ] **Step 4: Run question tests and verify pass**

Run:

```bash
node --test v2/tests/questions.test.js
```

Expected: PASS.

- [ ] **Step 5: Run root question mix tests with V2 question tests**

Run:

```bash
node --test tests/question-mix.test.js v2/tests/questions.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit question module**

Run:

```bash
git add v2/scripts/questions.js v2/tests/questions.test.js v2/index.html
git commit -m "feat: add v2 question generation"
```

---

### Task 3: Theme Mapping Module

**Files:**
- Create: `v2/scripts/themes.js`
- Create: `v2/tests/themes.test.js`

- [ ] **Step 1: Write failing theme tests**

Create `v2/tests/themes.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const Garage = require('../../garage.js');
const Themes = require('../scripts/themes.js');

test('all garage vehicles map to one of five v2 visual themes', () => {
  const vehicles = Garage.byKind('vehicle').map(it => it.id);
  assert.deepEqual(vehicles.sort(), [
    'ambulance',
    'fire',
    'heli',
    'police',
    'race',
    'rocket',
    'schoolbus',
    'taxi',
    'tractor',
    'train',
    'ufo'
  ].sort());

  vehicles.forEach(id => {
    const theme = Themes.themeForVehicleId(id);
    assert.ok(['police', 'ambulance', 'fire', 'everyday', 'adventure'].includes(theme.id), id);
    assert.ok(theme.cssClass.startsWith('theme-'), id);
    assert.ok(theme.bossEmoji, id);
    assert.ok(theme.energyLabel, id);
  });
});

test('daily and adventure vehicle groups match the design document', () => {
  ['schoolbus', 'taxi', 'train', 'tractor'].forEach(id => {
    assert.equal(Themes.themeForVehicleId(id).id, 'everyday');
  });
  ['race', 'heli', 'rocket', 'ufo'].forEach(id => {
    assert.equal(Themes.themeForVehicleId(id).id, 'adventure');
  });
});

test('unknown vehicle falls back to adventure theme', () => {
  assert.equal(Themes.themeForVehicleId('missing-car').id, 'adventure');
  assert.equal(Themes.themeForVehicleId(undefined).id, 'adventure');
});
```

- [ ] **Step 2: Run theme tests and verify failure**

Run:

```bash
node --test v2/tests/themes.test.js
```

Expected: FAIL because `v2/scripts/themes.js` does not exist.

- [ ] **Step 3: Implement theme mapping**

Create `v2/scripts/themes.js` with:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../garage.js'));
  } else {
    root.V2Themes = factory(root.Garage);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Garage) {
  'use strict';

  const THEMES = {
    police: {
      id: 'police',
      name: '警车追击',
      cssClass: 'theme-police',
      bossEmoji: '🚧',
      bossName: '路障 boss',
      energyLabel: '警灯能量',
      victoryLine: '追击成功！'
    },
    ambulance: {
      id: 'ambulance',
      name: '急救救援',
      cssClass: 'theme-ambulance',
      bossEmoji: '🦠',
      bossName: '病毒云',
      energyLabel: '急救能量',
      victoryLine: '急救成功！'
    },
    fire: {
      id: 'fire',
      name: '消防救援',
      cssClass: 'theme-fire',
      bossEmoji: '🔥',
      bossName: '火焰 boss',
      energyLabel: '水柱能量',
      victoryLine: '火灭啦！'
    },
    everyday: {
      id: 'everyday',
      name: '日常交通',
      cssClass: 'theme-everyday',
      bossEmoji: '🚦',
      bossName: '大堵车',
      energyLabel: '到站能量',
      victoryLine: '安全到站！'
    },
    adventure: {
      id: 'adventure',
      name: '太空冒险',
      cssClass: 'theme-adventure',
      bossEmoji: '☄️',
      bossName: '大陨石',
      energyLabel: '发射能量',
      victoryLine: '抵达终点！'
    }
  };

  const VEHICLE_THEME = {
    police: 'police',
    ambulance: 'ambulance',
    fire: 'fire',
    schoolbus: 'everyday',
    taxi: 'everyday',
    train: 'everyday',
    tractor: 'everyday',
    race: 'adventure',
    heli: 'adventure',
    rocket: 'adventure',
    ufo: 'adventure'
  };

  function themeForVehicleId(vehicleId) {
    const key = VEHICLE_THEME[vehicleId] || 'adventure';
    return THEMES[key];
  }

  function comboForGarageEntry(entry, fallbackDino) {
    const vehicle = Garage && Garage.getItem ? Garage.getItem(entry && entry.equippedVehicle) : null;
    const dino = Garage && Garage.getItem ? Garage.getItem(entry && entry.equippedDino) : null;
    return {
      vehicleEmoji: vehicle ? vehicle.emoji : '🚀',
      dinoEmoji: dino ? dino.emoji : (fallbackDino || '🦕'),
      theme: themeForVehicleId(vehicle && vehicle.id)
    };
  }

  return { THEMES, VEHICLE_THEME, themeForVehicleId, comboForGarageEntry };
});
```

- [ ] **Step 4: Run theme tests and verify pass**

Run:

```bash
node --test v2/tests/themes.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit theme module**

Run:

```bash
git add v2/scripts/themes.js v2/tests/themes.test.js
git commit -m "feat: add v2 vehicle themes"
```

---

### Task 4: Reward And Record Module

**Files:**
- Create: `v2/scripts/rewards.js`
- Create: `v2/tests/rewards.test.js`

- [ ] **Step 1: Write failing reward tests**

Create `v2/tests/rewards.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const Garage = require('../../garage.js');
const Rewards = require('../scripts/rewards.js');

test('scoreToStars matches existing star thresholds for five-question rounds', () => {
  assert.equal(Rewards.scoreToStars(5, 5), 5);
  assert.equal(Rewards.scoreToStars(4, 5), 4);
  assert.equal(Rewards.scoreToStars(3, 5), 3);
  assert.equal(Rewards.scoreToStars(2, 5), 2);
  assert.equal(Rewards.scoreToStars(1, 5), 1);
  assert.equal(Rewards.scoreToStars(0, 5), 1);
});

test('round settlement uses Garage.roundCoins as the authority', () => {
  const settlement = Rewards.calculateRoundSettlement({
    playerId: 'lele',
    score: 5,
    total: 5,
    questions: [{ type: 'carryBorrow' }, { type: 'missing' }],
    correctByIndex: { 0: true, 1: true },
    previousRecords: []
  });
  assert.equal(settlement.coins, Garage.roundCoins(5, 5));
  assert.equal(settlement.stars, 5);
});

test('ability trophies sort before regular medals', () => {
  const awards = Rewards.sortUnlockedAwards([
    { id: 'stars_10', kind: 'medal', label: '10颗星星' },
    { id: 'trophy_compare', kind: 'trophy', label: '比较奖杯', source: 'round' },
    { id: 'first_unlock', kind: 'medal', label: '第一次解锁' },
    { id: 'trophy_mixed_perfect', kind: 'trophy', label: '全能奖杯', source: 'round' }
  ]);
  assert.deepEqual(awards.map(a => a.id), [
    'trophy_compare',
    'trophy_mixed_perfect',
    'first_unlock',
    'stars_10'
  ]);
});

test('ability highlights summarize current round strengths', () => {
  const highlights = Rewards.buildAbilityHighlights({
    carryBorrow: { total: 2, correct: 2 },
    missing: { total: 1, correct: 1 },
    compare: { total: 1, correct: 0 },
    twoStep: { total: 1, correct: 1 },
    basic: { total: 0, correct: 0 }
  });
  assert.deepEqual(highlights, ['进退位题全对', '缺数题全对', '完成两步题']);
});
```

- [ ] **Step 2: Run reward tests and verify failure**

Run:

```bash
node --test v2/tests/rewards.test.js
```

Expected: FAIL because `v2/scripts/rewards.js` does not exist.

- [ ] **Step 3: Implement reward logic**

Create `v2/scripts/rewards.js` with:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../garage.js'), require('../../logic/question-mix.js'));
  } else {
    root.V2Rewards = factory(root.Garage, root.QuestionMix);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Garage, QuestionMix) {
  'use strict';

  const AWARDS = [
    { id: 'first_game', icon: '🎯', label: '初次冒险', kind: 'medal', check: st => st.games >= 1 },
    { id: 'perfect', icon: '💯', label: '满分达人', kind: 'medal', check: st => st.perfectGames >= 1 },
    { id: 'trophy_streak_round', icon: '🏆', label: '五题连胜杯', kind: 'trophy', source: 'perfect', check: st => st.perfectGames >= 1 },
    { id: 'trophy_carry_borrow', icon: '🥈', label: '进退位奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.carryBorrow.correct >= 3 },
    { id: 'trophy_missing', icon: '🧩', label: '缺数奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.missing.correct >= 1 },
    { id: 'trophy_compare', icon: '⚖️', label: '比较奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.compare.correct >= 1 },
    { id: 'trophy_two_step', icon: '🧠', label: '推理奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.twoStep.correct >= 1 },
    { id: 'trophy_mixed_perfect', icon: '👑', label: '全能奖杯', kind: 'trophy', source: 'round', check: st => st.records && st.records.some(QuestionMix.hasMixedPerfectRound) },
    { id: 'five_games', icon: '✋', label: '五次挑战', kind: 'medal', check: st => st.games >= 5 },
    { id: 'ten_games', icon: '🏃', label: '勤奋小将', kind: 'medal', check: st => st.games >= 10 },
    { id: 'twenty_games', icon: '💪', label: '超级勤奋', kind: 'medal', check: st => st.games >= 20 },
    { id: 'stars_10', icon: '⭐', label: '10颗星星', kind: 'medal', check: st => st.totalStars >= 10 },
    { id: 'stars_30', icon: '🌟', label: '30颗星星', kind: 'medal', check: st => st.totalStars >= 30 },
    { id: 'stars_60', icon: '✨', label: '60颗星星', kind: 'medal', check: st => st.totalStars >= 60 },
    { id: 'stars_100', icon: '🌠', label: '100颗星星', kind: 'medal', check: st => st.totalStars >= 100 },
    { id: 'streak3', icon: '🔥', label: '三连满分', kind: 'medal', check: st => st.streak >= 3 },
    { id: 'streak5', icon: '🔥', label: '五连满分', kind: 'medal', check: st => st.streak >= 5 },
    { id: 'perfect5', icon: '🏆', label: '满分5次', kind: 'medal', check: st => st.perfectGames >= 5 },
    { id: 'fifty_games', icon: '🏅', label: '五十次挑战', kind: 'medal', check: st => st.games >= 50 },
    { id: 'stars_200', icon: '💫', label: '200颗星星', kind: 'medal', check: st => st.totalStars >= 200 },
    { id: 'perfect_10', icon: '👑', label: '满分十次', kind: 'medal', check: st => st.perfectGames >= 10 },
    { id: 'streak7', icon: '☄️', label: '七连满分', kind: 'medal', check: st => st.streak >= 7 },
    { id: 'police_10', icon: '🚓', label: '小小警长', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.police >= 10 },
    { id: 'police_30', icon: '🚔', label: '金牌警探', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.police >= 30 },
    { id: 'police_50', icon: '🎖️', label: '警界传奇', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.police >= 50 },
    { id: 'ambulance_10', icon: '🚑', label: '急救先锋', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.ambulance >= 10 },
    { id: 'ambulance_30', icon: '🏥', label: '金牌医生', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.ambulance >= 30 },
    { id: 'ambulance_50', icon: '🦸', label: '急救传奇', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.ambulance >= 50 },
    { id: 'fire_10', icon: '🚒', label: '消防小英雄', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.fire >= 10 },
    { id: 'fire_30', icon: '🧯', label: '烈焰克星', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.fire >= 30 },
    { id: 'everyday_10', icon: '🚌', label: '出行小达人', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.everyday >= 10 },
    { id: 'everyday_30', icon: '🎫', label: '金牌司机', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.everyday >= 30 },
    { id: 'adventure_10', icon: '🏁', label: '勇敢探险家', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.adventure >= 10 },
    { id: 'adventure_30', icon: '🛰️', label: '太空英雄', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.adventure >= 30 },
    { id: 'first_unlock', icon: '🔓', label: '第一次解锁', kind: 'medal', check: st => st.ownedTotal > 2 },
    { id: 'collector_5', icon: '🚙', label: '小小收藏家', kind: 'medal', check: st => st.ownedVehicleCount >= 5 },
    { id: 'garage_master', icon: '🏰', label: '车库大师', kind: 'medal', check: st => st.ownsAllVehicles === true },
    { id: 'dragon_rider', icon: '🐲', label: '驯龙高手', kind: 'medal', check: st => st.ownsDragon === true },
    { id: 'coin_saver_50', icon: '🪙', label: '小财主', kind: 'medal', check: st => st.lifetimeCoins >= 50 },
    { id: 'coin_saver_150', icon: '💰', label: '大富翁', kind: 'medal', check: st => st.lifetimeCoins >= 150 }
  ];

  function scoreToStars(score, total) {
    const safeTotal = Math.max(1, Math.floor(Number(total) || 1));
    const safeScore = Math.max(0, Math.min(safeTotal, Math.floor(Number(score) || 0)));
    const ratio = safeScore / safeTotal;
    if (ratio >= 1) return 5;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.6) return 3;
    if (ratio >= 0.4) return 2;
    return 1;
  }

  function emptyTagScores() {
    return { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 };
  }

  function aggregateRecords(records, garageEntry) {
    const list = Array.isArray(records) ? records : [];
    const totalTagScores = emptyTagScores();
    list.forEach(record => {
      const source = record && record.tagScores;
      if (!source || typeof source !== 'object') return;
      Object.keys(totalTagScores).forEach(tag => {
        totalTagScores[tag] += Math.max(0, Math.floor(Number(source[tag]) || 0));
      });
    });
    let streak = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].score === list[i].total) streak++;
      else break;
    }
    const owned = Array.isArray(garageEntry && garageEntry.owned) ? garageEntry.owned : [];
    return {
      records: list,
      games: list.length,
      totalStars: list.reduce((sum, r) => sum + (r.stars || 0), 0),
      perfectGames: list.filter(r => r.score === r.total).length,
      streak,
      typeStats: QuestionMix.aggregateTypeStats(list),
      totalTagScores,
      lifetimeCoins: Garage.lifetimeCoins(list),
      ownedVehicleCount: Garage.ownedCount(owned, 'vehicle'),
      ownedDinoCount: Garage.ownedCount(owned, 'dino'),
      ownedTotal: owned.length,
      ownsAllVehicles: Garage.ownsAll(owned, 'vehicle'),
      ownsDragon: owned.indexOf('dragon') !== -1
    };
  }

  function awardSet(stats) {
    return new Set(AWARDS.filter(a => a.check(stats)).map(a => a.id));
  }

  function sortUnlockedAwards(awards) {
    const sourceWeight = award => {
      if (award.kind === 'trophy' && award.source === 'round') return 0;
      if (award.kind === 'trophy') return 1;
      if (/unlock|collector|garage|dragon/.test(award.id)) return 2;
      return 3;
    };
    return awards.slice().sort((a, b) => sourceWeight(a) - sourceWeight(b));
  }

  function buildAbilityHighlights(typeStats) {
    const stats = typeStats || {};
    const out = [];
    if (stats.carryBorrow && stats.carryBorrow.total > 0 && stats.carryBorrow.correct === stats.carryBorrow.total) out.push('进退位题全对');
    if (stats.missing && stats.missing.total > 0 && stats.missing.correct === stats.missing.total) out.push('缺数题全对');
    if (stats.compare && stats.compare.total > 0 && stats.compare.correct === stats.compare.total) out.push('比较题全对');
    if (stats.twoStep && stats.twoStep.correct > 0) out.push('完成两步题');
    return out;
  }

  function calculateRoundSettlement(input) {
    const score = Math.max(0, Math.floor(Number(input.score) || 0));
    const total = Math.max(0, Math.floor(Number(input.total) || 0));
    const questionTypeStats = QuestionMix.buildRoundTypeStats(input.questions || [], input.correctByIndex || {});
    const record = {
      player: input.playerId,
      score,
      total,
      stars: scoreToStars(score, total || 1),
      date: new Date().toISOString(),
      tagScores: input.tagScores || {},
      questionTypeStats
    };
    const before = aggregateRecords(input.previousRecords || [], input.garageEntry);
    const after = aggregateRecords((input.previousRecords || []).concat(record), input.garageEntry);
    const beforeAwards = awardSet(before);
    const newAwards = sortUnlockedAwards(AWARDS.filter(a => !beforeAwards.has(a.id) && a.check(after)));
    return {
      record,
      score,
      total,
      stars: record.stars,
      coins: Garage.roundCoins(score, total),
      questionTypeStats,
      highlights: buildAbilityHighlights(questionTypeStats),
      newAwards
    };
  }

  return {
    AWARDS,
    scoreToStars,
    aggregateRecords,
    awardSet,
    sortUnlockedAwards,
    buildAbilityHighlights,
    calculateRoundSettlement
  };
});
```

- [ ] **Step 4: Run reward tests and verify pass**

Run:

```bash
node --test v2/tests/rewards.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit reward module**

Run:

```bash
git add v2/scripts/rewards.js v2/tests/rewards.test.js
git commit -m "feat: add v2 reward rules"
```

---

### Task 4A: Storage Compatibility And Garage Persistence

**Files:**
- Create: `v2/scripts/storage.js`
- Create: `v2/tests/storage.test.js`

- [ ] **Step 1: Write failing storage tests**

Create `v2/tests/storage.test.js` with:

```js
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
```

- [ ] **Step 2: Run storage tests and verify failure**

Run:

```bash
node --test v2/tests/storage.test.js
```

Expected: FAIL because `v2/scripts/storage.js` does not exist.

- [ ] **Step 3: Implement storage compatibility**

Create `v2/scripts/storage.js` with:

```js
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
```

- [ ] **Step 4: Run storage tests and verify pass**

Run:

```bash
node --test v2/tests/storage.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit storage module**

Run:

```bash
git add v2/scripts/storage.js v2/tests/storage.test.js
git commit -m "feat: add v2 storage compatibility"
```

---

### Task 5: Game State Reducer

**Files:**
- Create: `v2/scripts/game-state.js`
- Create: `v2/tests/game-state.test.js`

- [ ] **Step 1: Write failing game-state tests**

Create `v2/tests/game-state.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const GameState = require('../scripts/game-state.js');

const questions = [
  { answer: 3, type: 'basic' },
  { answer: 11, type: 'carryBorrow' },
  { answer: 6, type: 'missing' },
  { answer: 4, type: 'compare' },
  { answer: 12, type: 'twoStep' }
];

test('createRound initializes five-question playable state', () => {
  const state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  assert.equal(state.playerId, 'lele');
  assert.equal(state.currentIndex, 0);
  assert.equal(state.score, 0);
  assert.equal(state.correctStreak, 0);
  assert.equal(state.status, 'playing');
  assert.equal(state.questions.length, 5);
});

test('correct submit advances score and locks question once', () => {
  let state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  const result = GameState.submitAnswer(state, '3');
  assert.equal(result.kind, 'correct');
  state = result.state;
  assert.equal(state.score, 1);
  assert.equal(state.correctByIndex[0], true);
  assert.equal(state.correctStreak, 1);
  assert.equal(state.tagScores.general, 1);
  const duplicate = GameState.submitAnswer(state, '3');
  assert.equal(duplicate.kind, 'already-settled');
});

test('wrong submits reset streak but keep round playable', () => {
  let state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  let result = GameState.submitAnswer(state, '2');
  assert.equal(result.kind, 'wrong');
  assert.equal(result.state.wrongCounts[0], 1);
  assert.equal(result.message, '再想想！');
  result = GameState.submitAnswer(result.state, '1');
  assert.equal(result.kind, 'wrong');
  assert.match(result.message, /答案在 0 到 6 之间/);
  result = GameState.submitAnswer(result.state, '9');
  assert.equal(result.kind, 'wrong');
  assert.match(result.message, /正确答案是 3/);
});

test('advance moves to completed after final settled question', () => {
  let state = GameState.createRound({ playerId: 'lele', family: 'police', questions });
  for (const answer of ['3', '11', '6', '4', '12']) {
    const result = GameState.submitAnswer(state, answer);
    state = GameState.advanceAfterCorrect(result.state);
  }
  assert.equal(state.status, 'completed');
  assert.equal(state.currentIndex, 5);
  assert.equal(state.score, 5);
});
```

- [ ] **Step 2: Run game-state tests and verify failure**

Run:

```bash
node --test v2/tests/game-state.test.js
```

Expected: FAIL because `v2/scripts/game-state.js` does not exist.

- [ ] **Step 3: Implement state reducer**

Create `v2/scripts/game-state.js` with:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./questions.js'));
  } else {
    root.V2GameState = factory(root.V2Questions);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Questions) {
  'use strict';

  function createRound(input) {
    const questions = Array.isArray(input.questions) ? input.questions.slice() : [];
    return {
      playerId: input.playerId || 'lele',
      family: input.family || 'adventure',
      questions,
      currentIndex: 0,
      score: 0,
      correctStreak: 0,
      correctByIndex: {},
      wrongCounts: {},
      settledByIndex: {},
      tagScores: { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 },
      status: 'playing'
    };
  }

  function clone(state) {
    return {
      ...state,
      questions: state.questions.slice(),
      correctByIndex: { ...state.correctByIndex },
      wrongCounts: { ...state.wrongCounts },
      settledByIndex: { ...state.settledByIndex },
      tagScores: { ...state.tagScores }
    };
  }

  function currentQuestion(state) {
    return state.questions[state.currentIndex] || null;
  }

  function submitAnswer(state, answerText) {
    if (!state || state.status !== 'playing') return { kind: 'not-playing', state };
    const index = state.currentIndex;
    if (state.settledByIndex[index]) return { kind: 'already-settled', state };
    const question = currentQuestion(state);
    if (!question) return { kind: 'missing-question', state };
    const value = parseInt(answerText, 10);
    const next = clone(state);
    if (value === question.answer) {
      next.score += 1;
      next.correctStreak += 1;
      next.correctByIndex[index] = true;
      next.settledByIndex[index] = true;
      const tag = question.tag || state.family || 'general';
      next.tagScores[tag] = (next.tagScores[tag] || 0) + 1;
      return { kind: 'correct', state: next, question, streak: next.correctStreak };
    }
    const wrong = (next.wrongCounts[index] || 0) + 1;
    next.wrongCounts[index] = wrong;
    next.correctStreak = 0;
    let message = '再想想！';
    if (wrong === 2) {
      const range = Questions.answerHintRange(question);
      message = `答案在 ${range.min} 到 ${range.max} 之间哦！`;
    }
    if (wrong >= 3) message = `正确答案是 ${question.answer}，再试一次！`;
    return { kind: 'wrong', state: next, question, message };
  }

  function advanceAfterCorrect(state) {
    const next = clone(state);
    next.currentIndex += 1;
    if (next.currentIndex >= next.questions.length) next.status = 'completed';
    return next;
  }

  return { createRound, currentQuestion, submitAnswer, advanceAfterCorrect };
});
```

- [ ] **Step 4: Run game-state tests and verify pass**

Run:

```bash
node --test v2/tests/game-state.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit game state module**

Run:

```bash
git add v2/scripts/game-state.js v2/tests/game-state.test.js
git commit -m "feat: add v2 round state"
```

---

### Task 6: Motion Budget Module

**Files:**
- Create: `v2/scripts/motion.js`
- Create: `v2/tests/motion.test.js`
- Modify: `v2/styles/motion.css`

- [ ] **Step 1: Write failing motion budget tests**

Create `v2/tests/motion.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const Motion = require('../scripts/motion.js');

test('motion budgets match design time limits', () => {
  assert.equal(Motion.MOTION_BUDGETS.start.maxMs, 900);
  assert.equal(Motion.MOTION_BUDGETS.wrong.maxMs, 600);
  assert.equal(Motion.MOTION_BUDGETS.correct.minMs, 900);
  assert.equal(Motion.MOTION_BUDGETS.correct.maxMs, 1500);
  assert.equal(Motion.MOTION_BUDGETS.combo.maxMs, 1800);
  assert.equal(Motion.MOTION_BUDGETS.finisher.maxMs, 2200);
  assert.equal(Motion.MOTION_BUDGETS.perfect.maxMs, 2800);
});

test('particle limits are capped for phone and desktop', () => {
  assert.equal(Motion.particleLimit({ width: 390, height: 844 }), 35);
  assert.equal(Motion.particleLimit({ width: 1280, height: 720 }), 80);
});

test('combo tier maps visible escalation levels', () => {
  assert.equal(Motion.comboTier(1), 1);
  assert.equal(Motion.comboTier(2), 2);
  assert.equal(Motion.comboTier(3), 3);
  assert.equal(Motion.comboTier(4), 4);
  assert.equal(Motion.comboTier(5), 5);
  assert.equal(Motion.comboTier(99), 5);
});

test('question feedback classes distinguish math abilities without balance wording', () => {
  assert.equal(Motion.feedbackClassForQuestion({ type: 'carryBorrow' }), 'feedback-carryBorrow');
  assert.equal(Motion.feedbackClassForQuestion({ type: 'missing' }), 'feedback-missing');
  assert.equal(Motion.feedbackClassForQuestion({ type: 'compare' }), 'feedback-compare');
  assert.equal(Motion.feedbackClassForQuestion({ type: 'twoStep' }), 'feedback-twoStep');
  assert.notEqual(Motion.feedbackClassForQuestion({ type: 'compare' }), 'feedback-balance');
});

test('durationFor uses reduced motion budget when requested', () => {
  assert.equal(Motion.durationFor('correct', false), 1500);
  assert.equal(Motion.durationFor('correct', true), 400);
});
```

- [ ] **Step 2: Run motion tests and verify failure**

Run:

```bash
node --test v2/tests/motion.test.js
```

Expected: FAIL because `v2/scripts/motion.js` is only a script reference and has no implementation.

- [ ] **Step 3: Implement motion budgets**

Create `v2/scripts/motion.js` with:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.V2Motion = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MOTION_BUDGETS = {
    start: { maxMs: 900, reducedMaxMs: 300 },
    wrong: { maxMs: 600, reducedMaxMs: 250 },
    correct: { minMs: 900, maxMs: 1500, reducedMaxMs: 400 },
    combo: { minMs: 1200, maxMs: 1800, reducedMaxMs: 500 },
    finisher: { maxMs: 2200, reducedMaxMs: 700 },
    perfect: { infoMs: 500, maxMs: 2800, reducedMaxMs: 700 },
    shake: { maxMs: 180 }
  };

  function prefersReducedMotion() {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function particleLimit(viewport) {
    const width = viewport && Number(viewport.width) || 390;
    return width < 700 ? 35 : 80;
  }

  function comboTier(streak) {
    return Math.max(1, Math.min(5, Math.floor(Number(streak) || 1)));
  }

  function durationFor(name, reduced) {
    const budget = MOTION_BUDGETS[name] || MOTION_BUDGETS.correct;
    if (reduced && budget.reducedMaxMs) return budget.reducedMaxMs;
    return budget.maxMs || budget.minMs || 1;
  }

  function feedbackClassForQuestion(question) {
    const type = question && question.type;
    if (type === 'carryBorrow') return 'feedback-carryBorrow';
    if (type === 'missing') return 'feedback-missing';
    if (type === 'compare') return 'feedback-compare';
    if (type === 'twoStep') return 'feedback-twoStep';
    return 'feedback-basic';
  }

  function applyMotionClass(element, className, duration) {
    if (!element) return Promise.resolve();
    element.classList.add(className);
    const ms = Math.max(1, Math.floor(Number(duration) || 1));
    return new Promise(resolve => {
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, ms);
    });
  }

  return { MOTION_BUDGETS, prefersReducedMotion, particleLimit, comboTier, durationFor, feedbackClassForQuestion, applyMotionClass };
});
```

- [ ] **Step 4: Add combo CSS classes**

Append to `v2/styles/motion.css`:

```css
.combo-tier-1 .stage-energy { filter: brightness(1); }
.combo-tier-2 .stage-energy { filter: brightness(1.15); }
.combo-tier-3 .stage-energy { filter: brightness(1.35) drop-shadow(0 0 16px rgba(255,255,255,.55)); }
.combo-tier-4 .stage-energy { filter: brightness(1.6) drop-shadow(0 0 24px rgba(255,212,71,.9)); }
.combo-tier-5 .stage-energy { filter: brightness(1.9) drop-shadow(0 0 34px rgba(255,138,42,1)); }
.motion-finisher .stage-boss { transform: scale(1.28) rotate(-8deg); opacity: .25; transition: transform 650ms ease, opacity 650ms ease; }
.feedback-carryBorrow .stage-vehicle { filter: drop-shadow(0 0 26px rgba(255, 138, 42, .95)); }
.feedback-missing #question-equation { outline: 4px solid rgba(255, 212, 71, .75); outline-offset: 6px; border-radius: 14px; }
.feedback-compare .stage-route::after { content: ""; position: absolute; left: 42%; right: 18%; top: -8px; height: 26px; border-radius: 999px; background: rgba(255, 255, 255, .72); }
.feedback-twoStep .stage-energy { box-shadow: 0 0 32px rgba(255, 255, 255, .95), 0 0 52px rgba(255, 138, 42, .8); }
```

- [ ] **Step 5: Run motion tests and verify pass**

Run:

```bash
node --test v2/tests/motion.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit motion module**

Run:

```bash
git add v2/scripts/motion.js v2/styles/motion.css v2/tests/motion.test.js
git commit -m "feat: add v2 motion budgets"
```

---

### Task 6A: Speech Queue And Cancellation

**Files:**
- Create: `v2/scripts/speech.js`
- Create: `v2/tests/speech.test.js`

- [ ] **Step 1: Write failing speech tests**

Create `v2/tests/speech.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const Speech = require('../scripts/speech.js');

function fakeSynth() {
  const calls = [];
  return {
    calls,
    cancel: () => calls.push(['cancel']),
    speak: utterance => calls.push(['speak', utterance.text])
  };
}

test('speech queue cancels previous speech before a new queue', () => {
  const synth = fakeSynth();
  const speech = Speech.createSpeechController({ synth, Utterance: function Utterance(text) { this.text = text; } });
  speech.speakQueue(['第一句', '第二句']);
  speech.speakQueue(['新一轮']);
  assert.deepEqual(synth.calls.map(call => call[0]), ['cancel', 'speak', 'speak', 'cancel', 'speak']);
});

test('stop cancels active speech and muted mode suppresses speak', () => {
  const synth = fakeSynth();
  const speech = Speech.createSpeechController({ synth, Utterance: function Utterance(text) { this.text = text; } });
  speech.setMuted(true);
  speech.speakQueue(['不会朗读']);
  speech.stop();
  assert.equal(synth.calls.filter(call => call[0] === 'speak').length, 0);
  assert.ok(synth.calls.filter(call => call[0] === 'cancel').length >= 1);
});
```

- [ ] **Step 2: Run speech tests and verify failure**

Run:

```bash
node --test v2/tests/speech.test.js
```

Expected: FAIL because `v2/scripts/speech.js` does not exist.

- [ ] **Step 3: Implement speech controller**

Create `v2/scripts/speech.js` with:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.V2Speech = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createSpeechController(options = {}) {
    const synth = options.synth || (typeof window !== 'undefined' ? window.speechSynthesis : null);
    const Utterance = options.Utterance || (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null);
    let muted = false;

    function stop() {
      if (synth && typeof synth.cancel === 'function') synth.cancel();
    }

    function speakQueue(lines, rate = 0.9) {
      stop();
      if (muted || !synth || !Utterance || !Array.isArray(lines)) return;
      lines.filter(Boolean).forEach(text => {
        const utterance = new Utterance(text);
        utterance.rate = rate;
        synth.speak(utterance);
      });
    }

    function setMuted(next) {
      muted = !!next;
      if (muted) stop();
    }

    function isMuted() {
      return muted;
    }

    function toggleMuted() {
      setMuted(!muted);
      return muted;
    }

    return { speakQueue, stop, setMuted, isMuted, toggleMuted };
  }

  return { createSpeechController };
});
```

- [ ] **Step 4: Run speech tests and verify pass**

Run:

```bash
node --test v2/tests/speech.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit speech module**

Run:

```bash
git add v2/scripts/speech.js v2/tests/speech.test.js
git commit -m "feat: add v2 speech queue"
```

---

### Task 7: Wire Playable V2 Flow

**Files:**
- Modify: `v2/scripts/ui.js`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Add failing static test for UI wiring names**

Append to `v2/tests/static-ui.test.js`:

```js
test('ui module wires gameplay render and submit functions', () => {
  const ui = read('scripts/ui.js');
  [
    'function startRound',
    'function renderQuestion',
    'function submitCurrentAnswer',
    'function renderResult',
    'V2GameState.submitAnswer',
    'V2Rewards.calculateRoundSettlement',
    'V2Storage.saveRecord',
    'V2Storage.addCoins',
    'V2Motion.comboTier',
    'V2Motion.durationFor',
    'V2Motion.feedbackClassForQuestion',
    'V2Speech.createSpeechController'
  ].forEach(pattern => assert.match(ui, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing ${pattern}`));
});
```

- [ ] **Step 2: Run static UI tests and verify failure**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because `ui.js` does not yet define gameplay functions.

- [ ] **Step 3: Replace `v2/scripts/ui.js` with playable flow**

Replace `v2/scripts/ui.js` with:

```js
(function (root) {
  'use strict';

  const PLAYERS = {
    lele: { id: 'lele', name: '乐乐', fallbackDino: '🦕' },
    haohao: { id: 'haohao', name: '昊昊', fallbackDino: '🦖' }
  };

  let state = null;
  let answerText = '';
  let currentPlayerId = 'lele';
  const speech = root.V2Speech.createSpeechController();

  function $(id) { return document.getElementById(id); }

  function setPage(id) {
    document.querySelectorAll('.page').forEach(page => {
      const active = page.id === id;
      page.classList.toggle('active', active);
      page.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function safeGarage(playerId) {
    return root.V2Storage.getPlayerGarage(playerId);
  }

  function renderStage(combo) {
    const stage = $('adventure-stage');
    stage.className = `adventure-stage ${combo.theme.cssClass}`;
    $('stage-vehicle').textContent = `${combo.vehicleEmoji}${combo.dinoEmoji}`;
    $('stage-boss').textContent = combo.theme.bossEmoji;
  }

  function renderQuestion() {
    const q = root.V2GameState.currentQuestion(state);
    if (!q) return;
    $('round-player').textContent = PLAYERS[state.playerId].name;
    $('round-progress').textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
    $('round-score').textContent = `⭐ ${state.score}`;
    $('question-story').textContent = `${q.story}${q.question}`;
    $('question-equation').textContent = q.equationParts.join(' ');
    $('answer-display').textContent = answerText;
    $('feedback-message').textContent = '';
    $('stage-energy-fill').style.width = `${Math.round((state.currentIndex / state.questions.length) * 100)}%`;
    speech.speakQueue([`${q.story}${q.question}`, q.readEquation]);
  }

  function renderResult(settlement) {
    $('result-combo').textContent = $('stage-vehicle').textContent;
    $('result-title').textContent = settlement.score === settlement.total ? '完美通关' : '冒险完成';
    $('result-score').textContent = `${settlement.score} / ${settlement.total}`;
    $('result-stars').textContent = '⭐'.repeat(settlement.stars);
    $('result-coins').textContent = `本局 +${settlement.coins} 🪙`;
    $('result-awards').innerHTML = settlement.newAwards.map(a => {
      const awardClass = a.kind === 'trophy' ? 'award-chip trophy' : 'award-chip medal';
      return `<span class="${awardClass}">${a.icon} ${a.label}</span>`;
    }).join('');
    $('result-highlights').innerHTML = settlement.highlights.map(h => `<span class="highlight-chip">${h}</span>`).join('');
    setPage('page-result');
  }

  function finishRound() {
    const previousRecords = root.V2Storage.recordsForPlayer(state.playerId);
    const garage = root.V2Storage.getPlayerGarage(state.playerId);
    const settlement = root.V2Rewards.calculateRoundSettlement({
      playerId: state.playerId,
      score: state.score,
      total: state.questions.length,
      questions: state.questions,
      correctByIndex: state.correctByIndex,
      tagScores: state.tagScores,
      previousRecords,
      garageEntry: garage
    });
    root.V2Storage.saveRecord(settlement.record);
    root.V2Storage.addCoins(state.playerId, settlement.coins);
    renderResult(settlement);
  }

  function submitCurrentAnswer() {
    const result = root.V2GameState.submitAnswer(state, answerText);
    state = result.state;
    if (result.kind === 'wrong') {
      $('feedback-message').textContent = result.message;
      answerText = '';
      $('answer-display').textContent = '';
      root.V2Motion.applyMotionClass($('app-shell'), 'motion-wrong', root.V2Motion.MOTION_BUDGETS.wrong.maxMs);
      return;
    }
    if (result.kind !== 'correct') return;
    const tier = root.V2Motion.comboTier(result.streak);
    const feedbackClass = root.V2Motion.feedbackClassForQuestion(result.question);
    const motionName = state.currentIndex >= state.questions.length - 1 ? 'finisher' : (tier >= 3 ? 'combo' : 'correct');
    const shell = $('app-shell');
    shell.className = `app-shell combo-tier-${tier} ${feedbackClass}`;
    const duration = root.V2Motion.durationFor(motionName, root.V2Motion.prefersReducedMotion());
    root.V2Motion.applyMotionClass(shell, motionName === 'finisher' ? 'motion-finisher' : 'motion-correct', duration).then(() => {
      shell.classList.remove(feedbackClass);
      state = root.V2GameState.advanceAfterCorrect(state);
      answerText = '';
      if (state.status === 'completed') finishRound();
      else renderQuestion();
    });
  }

  function startRound(playerId) {
    speech.stop();
    currentPlayerId = playerId || currentPlayerId;
    const garage = safeGarage(currentPlayerId);
    const combo = root.V2Themes.comboForGarageEntry(garage, PLAYERS[currentPlayerId].fallbackDino);
    const questions = root.V2Questions.generateRound({ count: 5, family: combo.theme.id });
    state = root.V2GameState.createRound({ playerId: currentPlayerId, family: combo.theme.id, questions });
    answerText = '';
    setPage('page-game');
    renderStage(combo);
    renderQuestion();
  }

  function initNumpad() {
    const pad = $('numpad');
    if (!pad) return;
    pad.innerHTML = '';
    [1,2,3,4,5,6,7,8,9,0].forEach(n => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(n);
      button.dataset.digit = String(n);
      button.addEventListener('click', () => {
        answerText = `${answerText}${n}`.slice(0, 3);
        $('answer-display').textContent = answerText;
      });
      pad.appendChild(button);
    });
  }

  function init() {
    initNumpad();
    $('btn-start').addEventListener('click', () => setPage('page-player'));
    $('player-lele').addEventListener('click', () => startRound('lele'));
    $('player-haohao').addEventListener('click', () => startRound('haohao'));
    $('btn-submit').addEventListener('click', submitCurrentAnswer);
    $('btn-clear').addEventListener('click', () => { answerText = answerText.slice(0, -1); $('answer-display').textContent = answerText; });
    $('btn-toggle-voice').addEventListener('click', () => {
      const muted = speech.toggleMuted();
      $('btn-toggle-voice').textContent = muted ? '🔇' : '🔊';
    });
    $('btn-again').addEventListener('click', () => startRound(currentPlayerId));
    $('btn-open-trophies').addEventListener('click', () => setPage('page-trophies'));
    $('btn-result-trophies').addEventListener('click', () => setPage('page-trophies'));
    $('btn-trophies-back').addEventListener('click', () => setPage('page-home'));
  }

  root.V2UI = { setPage, initNumpad, startRound, renderQuestion, submitCurrentAnswer, renderResult, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run static UI tests and verify pass**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 5: Run all V2 logic and static tests**

Run:

```bash
node --test v2/tests/*.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit playable flow**

Run:

```bash
git add v2/scripts/ui.js v2/tests/static-ui.test.js
git commit -m "feat: wire v2 gameplay flow"
```

---

### Task 8: Result Stage And Trophy Hall Rendering

**Files:**
- Modify: `v2/scripts/ui.js`
- Modify: `v2/styles/arcade.css`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Add failing static test for result award hierarchy**

Append to `v2/tests/static-ui.test.js`:

```js
test('result UI renders awards before highlights and trophy hall groups', () => {
  const ui = read('scripts/ui.js');
  const awardIndex = ui.indexOf("result-awards");
  const highlightIndex = ui.indexOf("result-highlights");
  assert.ok(awardIndex !== -1 && highlightIndex !== -1 && awardIndex < highlightIndex);
  assert.match(ui, /function renderTrophyHall/);
  assert.match(ui, /award-chip trophy/);
  assert.match(ui, /award-chip medal/);
});
```

- [ ] **Step 2: Run static UI tests and verify failure**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because `renderTrophyHall` does not exist and result awards do not distinguish trophy/medal classes explicitly.

- [ ] **Step 3: Add trophy hall rendering**

In `v2/scripts/ui.js`, add this function before `init()`:

```js
  function renderTrophyHall() {
    const hall = $('trophy-hall');
    const groups = [
      { title: '能力奖杯', filter: a => a.kind === 'trophy' },
      { title: '长期勋章', filter: a => a.kind === 'medal' }
    ];
    hall.innerHTML = groups.map(group => {
      const awards = root.V2Rewards.AWARDS.filter(group.filter);
      return `<section class="trophy-group">
        <h3>${group.title}</h3>
        <div class="trophy-grid">
          ${awards.map(a => `<div class="trophy-card ${a.kind}" data-award="${a.id}">
            <span>${a.icon}</span>
            <strong>${a.label}</strong>
          </div>`).join('')}
        </div>
      </section>`;
    }).join('');
  }
```

Then update these event handlers in `init()`:

```js
    $('btn-open-trophies').addEventListener('click', () => { renderTrophyHall(); setPage('page-trophies'); });
    $('btn-result-trophies').addEventListener('click', () => { renderTrophyHall(); setPage('page-trophies'); });
```

Finally, add `renderTrophyHall` to the exported `root.V2UI` object:

```js
  root.V2UI = { setPage, initNumpad, startRound, renderQuestion, submitCurrentAnswer, renderResult, renderTrophyHall, init };
```

- [ ] **Step 4: Add result and trophy styles**

Append to `v2/styles/arcade.css`:

```css
.award-chip,
.highlight-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 6px;
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,.9);
  color: var(--ink);
  font-weight: 900;
}
.award-chip.trophy {
  font-size: 1.15rem;
  background: linear-gradient(180deg, #fff176, #ffc83d);
  box-shadow: 0 8px 24px rgba(255, 212, 71, .42);
}
.award-chip.medal { opacity: .9; }
.trophy-group { width: 100%; margin: 0 0 18px; }
.trophy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
.trophy-card { min-height: 96px; display: grid; place-items: center; border-radius: 16px; padding: 10px; background: rgba(255,255,255,.14); }
.trophy-card.trophy { outline: 3px solid rgba(255, 212, 71, .8); }
.trophy-card span { font-size: 34px; }
```

- [ ] **Step 5: Run static UI tests and verify pass**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit result and trophy rendering**

Run:

```bash
git add v2/scripts/ui.js v2/styles/arcade.css v2/tests/static-ui.test.js
git commit -m "feat: add v2 trophy hall"
```

---

### Task 8A: Minimal Garage Page

**Files:**
- Modify: `v2/scripts/ui.js`
- Modify: `v2/styles/arcade.css`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Add failing static garage wiring test**

Append to `v2/tests/static-ui.test.js`:

```js
test('garage UI reads and persists Garage catalog state', () => {
  const ui = read('scripts/ui.js');
  [
    'function renderGarage',
    'function handleGarageCellTap',
    'Garage.CATALOG',
    'Garage.unlock',
    'Garage.equip',
    'V2Storage.setPlayerGarage',
    'btn-result-garage',
    'btn-garage-back'
  ].forEach(pattern => assert.match(ui, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing ${pattern}`));
});
```

- [ ] **Step 2: Run static UI tests and verify failure**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because `renderGarage` and `handleGarageCellTap` do not exist.

- [ ] **Step 3: Add garage rendering and interaction**

In `v2/scripts/ui.js`, add these functions before `renderTrophyHall()`:

```js
  function renderGarage() {
    const garage = root.V2Storage.getPlayerGarage(currentPlayerId);
    const names = root.V2Storage.loadNames();
    $('garage-player-name').textContent = names[currentPlayerId] || PLAYERS[currentPlayerId].name;
    $('garage-coins').textContent = garage.coins;
    $('garage-grid').innerHTML = root.Garage.CATALOG.map(item => {
      const owned = root.Garage.owns(garage, item.id);
      const equipped = root.Garage.isEquipped(garage, item.id);
      const afford = root.Garage.canAfford(garage, item.id);
      const stateText = equipped ? '正在使用' : (owned ? '点我换上' : `🪙 ${item.price}`);
      const locked = owned ? '' : 'locked';
      const affordClass = !owned && afford ? 'afford' : '';
      return `<button class="garage-cell ${item.kind} ${locked} ${affordClass} ${equipped ? 'equipped' : ''}" type="button" data-item="${item.id}">
        <span class="garage-emoji">${item.emoji}</span>
        <strong>${item.name}</strong>
        <span>${stateText}</span>
      </button>`;
    }).join('');
  }

  function handleGarageCellTap(id) {
    const item = root.Garage.getItem(id);
    if (!item) return;
    const garage = root.V2Storage.getPlayerGarage(currentPlayerId);
    let next = null;
    if (root.Garage.owns(garage, id)) next = root.Garage.equip(garage, id);
    else next = root.Garage.unlock(garage, id);
    if (!next) {
      $('garage-message').textContent = `${item.name}还不能解锁，再赚一些金币吧！`;
      return;
    }
    root.V2Storage.setPlayerGarage(currentPlayerId, next);
    $('garage-message').textContent = `${item.name}准备好了！`;
    renderGarage();
  }

  function openGarage() {
    renderGarage();
    setPage('page-garage');
  }
```

Then add these event handlers in `init()`:

```js
    $('btn-open-garage').addEventListener('click', openGarage);
    $('btn-result-garage').addEventListener('click', openGarage);
    $('btn-garage-back').addEventListener('click', () => setPage('page-player'));
    $('garage-grid').addEventListener('click', event => {
      const cell = event.target.closest('[data-item]');
      if (cell) handleGarageCellTap(cell.dataset.item);
    });
```

Finally, export the new functions:

```js
  root.V2UI = { setPage, initNumpad, startRound, renderQuestion, submitCurrentAnswer, renderResult, renderTrophyHall, renderGarage, handleGarageCellTap, init };
```

- [ ] **Step 4: Add garage styles**

Append to `v2/styles/arcade.css`:

```css
.page-garage {
  align-content: start;
  gap: 14px;
  background: linear-gradient(180deg, #0e385f, #134b72);
  color: white;
}
.garage-wallet {
  justify-self: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .16);
  font-weight: 900;
}
.garage-grid {
  width: min(760px, 100%);
  justify-self: center;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
  gap: 10px;
}
.garage-cell {
  min-height: 112px;
  border: 0;
  border-radius: 16px;
  padding: 10px;
  display: grid;
  place-items: center;
  gap: 4px;
  background: rgba(255,255,255,.88);
  color: var(--ink);
  box-shadow: 0 6px 0 rgba(0,0,0,.18);
}
.garage-cell.locked { filter: grayscale(.35); opacity: .72; }
.garage-cell.afford { outline: 3px solid var(--yellow); }
.garage-cell.equipped { outline: 4px solid var(--green); }
.garage-emoji { font-size: 36px; }
```

- [ ] **Step 5: Run static UI tests and verify pass**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit garage page**

Run:

```bash
git add v2/scripts/ui.js v2/styles/arcade.css v2/tests/static-ui.test.js
git commit -m "feat: add v2 garage page"
```

---

### Task 9: Responsive Layout And Visual Constraints

**Files:**
- Modify: `v2/styles/arcade.css`
- Modify: `v2/styles/motion.css`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Add failing static responsive CSS test**

Append to `v2/tests/static-ui.test.js`:

```js
test('responsive css covers required v2 viewport constraints', () => {
  const arcade = read('styles/arcade.css');
  const base = read('styles/base.css');
  assert.match(arcade, /@media\s*\(max-width:\s*380px\)/);
  assert.match(arcade, /@media\s*\(max-height:\s*430px\)/);
  assert.match(arcade, /@media\s*\(min-width:\s*900px\)/);
  assert.match(arcade, /"stage question"/);
  assert.match(arcade, /"stage controls"/);
  assert.match(base, /min-height:\s*100svh/);
});
```

- [ ] **Step 2: Run static UI tests and verify failure**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because the CSS does not yet define the required viewport rules.

- [ ] **Step 3: Add responsive CSS rules**

Append to `v2/styles/arcade.css`:

```css
@media (max-width: 380px) {
  .page { padding: 10px; }
  .page-game {
    grid-template-rows: auto 92px auto auto auto;
    gap: 6px;
  }
  .adventure-stage { min-height: 92px; border-radius: 14px; }
  #question-story { font-size: 17px; }
  #question-equation { font-size: 30px; }
  .numpad { gap: 5px; max-width: 230px; }
  .numpad button { min-height: 34px; font-size: 18px; }
  .submit { min-width: 140px; padding: 10px 20px; }
}

@media (max-height: 430px) {
  .page-game {
    grid-template-columns: minmax(220px, 1fr) minmax(280px, 1.15fr);
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "top top"
      "stage question"
      "stage controls";
    align-items: stretch;
  }
  .game-topbar { grid-area: top; }
  .adventure-stage { grid-area: stage; min-height: 210px; }
  .question-panel { grid-area: question; }
  .numpad { grid-area: controls; max-width: 300px; }
  .submit { grid-column: 2; justify-self: center; }
}

@media (min-width: 900px) {
  .page-game {
    grid-template-columns: minmax(380px, 0.95fr) minmax(420px, 1fr);
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "top top"
      "stage question"
      "stage controls";
    gap: 18px;
    padding: 28px;
  }
  .game-topbar { grid-area: top; }
  .adventure-stage { grid-area: stage; min-height: 420px; }
  .question-panel { grid-area: question; align-self: end; }
  .numpad { grid-area: controls; align-self: start; }
  .submit { grid-column: 2; justify-self: center; }
  .stage-vehicle, .stage-boss { font-size: 96px; }
}
```

- [ ] **Step 4: Run static UI tests and verify pass**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit responsive rules**

Run:

```bash
git add v2/styles/arcade.css v2/tests/static-ui.test.js
git commit -m "feat: add v2 responsive layout"
```

---

### Task 10: Full Automated Verification

**Files:**
- Modify only if a previous test exposes a real issue in `v2/`.

- [ ] **Step 1: Run V2 tests**

Run:

```bash
node --test v2/tests/*.test.js
```

Expected: PASS. If this fails, fix only the `v2/` file named by the failing assertion and rerun the same command.

- [ ] **Step 2: Run shared legacy logic tests**

Run:

```bash
node --test tests/question-mix.test.js tests/garage.test.js tests/adventure.test.js
```

Expected: PASS. If this fails because a V2 task changed a root file, revert that root-file change and keep V2 implementation inside `v2/`.

- [ ] **Step 3: Run whitespace and patch sanity check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Confirm only V2 files plus the plan changed**

Run:

```bash
git status --short
```

Expected: new or modified paths are under `v2/` and `docs/superpowers/plans/2026-06-02-v2-arcade-math-adventure.md`. Existing unrelated `../.DS_Store` may appear; do not add or revert it.

- [ ] **Step 5: Commit automated verification fixes**

If Step 1 through Step 3 required fixes, commit them:

```bash
git add v2 docs/superpowers/plans/2026-06-02-v2-arcade-math-adventure.md
git commit -m "test: verify v2 arcade app"
```

If no fixes were needed and all previous tasks were already committed, skip this commit.

---

### Task 11: Browser Smoke Verification

**Files:**
- Modify only if browser verification exposes a concrete V2 issue.

- [ ] **Step 1: Start a local static server**

Run:

```bash
python3 -m http.server 4174
```

Expected: server starts in the workspace root and serves `http://localhost:4174/`.

- [ ] **Step 2: Open V2 in the in-app browser**

Use Browser plugin to open:

```text
http://localhost:4174/v2/index.html
```

Expected: V2 homepage appears, first viewport reads as a game screen, and “开始冒险” is visible.

- [ ] **Step 3: Verify core click path**

In the browser:

1. Click `开始冒险`.
2. Click `乐乐`.
3. Confirm the game page shows stage, question story, equation, answer display, numpad, and OK button.
4. Enter the visible correct answer.
5. Click `OK`.

Expected: score increases, route energy changes, no element covers the question or OK button.

- [ ] **Step 4: Verify wrong-answer copy**

Start another question and intentionally submit three wrong answers.

Expected:

1. First wrong answer shows “再想想”.
2. Second wrong answer shows a dynamic answer range.
3. Third wrong answer shows the correct answer and still allows re-entry.

- [ ] **Step 5: Verify result page**

Finish a full round.

Expected: result page shows score, stars, coins, awards before highlights, and buttons for another round and trophy hall.

- [ ] **Step 6: Verify fixed viewport constraints**

Use browser viewport changes or screenshots for:

```text
390 x 844
360 x 640
430 x 932
812 x 375
1280 x 720
```

Expected: stage, question, answer, numpad, and OK button are visible without incoherent overlap. At `812 x 375`, horizontal compact layout is active.

- [ ] **Step 7: Verify reduced motion**

In browser automation, emulate reduced motion if available, then answer one question.

Expected: state changes remain visible, but full-screen speed lines, heavy particles, and screen shake are not used.

- [ ] **Step 8: Stop the local static server**

Stop the `python3 -m http.server 4174` process from Step 1.

Expected: no long-running server process remains for this task.

- [ ] **Step 9: Commit browser-discovered fixes**

If browser smoke verification required V2 fixes, run:

```bash
git add v2
git commit -m "fix: polish v2 browser flow"
```

If browser verification passed without changes, skip this commit.

---

## Self-Review Checklist

- Spec coverage:
  - V2 独立在 `v2/` 下开发：Tasks 1-11。
  - 题库、题型权重、提示范围：Task 2。
  - 座驾主题映射：Task 3。
  - 星星、金币、奖杯、勋章、能力亮点：Task 4 and Task 8。
  - 本地记录、金币入账、车库持久化：Task 4A and Task 8A。
  - 一轮 5 题、答错继续尝试、重复提交保护：Task 5。
  - 动效预算、题型专属反馈、粒子上限、减少动效：Task 6 and Task 11。
  - 语音朗读、静音、新一轮取消旧朗读：Task 6A and Task 7。
  - 首页、玩家选择、答题页、结果页、奖杯大厅、车库页：Task 1, Task 7, Task 8, Task 8A。
  - 移动端和横屏验收：Task 9 and Task 11。
  - 自动测试、浏览器测试、旧逻辑不退化：Task 10 and Task 11。
- Placeholder scan command:

```bash
rg -n "T[B]D|T[O]DO|待[定]|占[位]|F[I]XME|implement[ ]later|Similar[ ]to|add[ ]appropriate|handle[ ]edge[ ]cases" docs/superpowers/plans/2026-06-02-v2-arcade-math-adventure.md
```

Expected: no matches.

- Type and name consistency:
  - `V2Questions.generateRound`, `V2Themes.themeForVehicleId`, `V2Rewards.calculateRoundSettlement`, `V2GameState.submitAnswer`, `V2Motion.comboTier`, and `V2UI.startRound` are defined before later tasks reference them.
  - HTML IDs in `v2/index.html` match `ui.js` selectors and `static-ui.test.js` assertions.
  - Tests use Node built-in `node:test` and no extra dependency installation.
