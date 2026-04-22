# Police Ambulance Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity HTML prototype for the police-and-ambulance logic training game, including the core mission loop, polished UI states, and child-friendly interface copy aligned with the approved PRD.

**Architecture:** Keep the product as a static browser prototype, but stop extending the existing 2957-line monolithic `index.html` directly. Replace it with a thin shell that loads focused modules for scene data, mission state, copy, and presentation so the prototype can evolve without becoming unmaintainable. Use a data-driven mission model so logic scenarios and UI copy can be iterated separately.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, `node:test`, `assert/strict`

---

## File Structure

### Existing files to modify

- Modify: `index.html`
  Responsibility: minimal app shell, root mount point, script entry, static metadata.

### New files to create

- Create: `src/prototype/app.js`
  Responsibility: bootstrap the prototype, route state transitions, render top-level screens.

- Create: `src/prototype/state/game-state.js`
  Responsibility: mission progress, score, retries, mode selection, derived UI state.

- Create: `src/prototype/data/missions.js`
  Responsibility: curated mission content, scene metadata, answer keys, ability tags.

- Create: `src/prototype/data/copy.js`
  Responsibility: all child-facing and parent-facing interface copy, praise lines, retry prompts, labels.

- Create: `src/prototype/ui/screens.js`
  Responsibility: render home, mode select, mission, result, and archive screens.

- Create: `src/prototype/ui/renderers.js`
  Responsibility: small reusable render helpers for cards, HUD, options, badges, and character panels.

- Create: `src/prototype/ui/animations.js`
  Responsibility: motion presets, celebratory overlays, reduced-motion-safe animation helpers.

- Create: `src/prototype/styles.css`
  Responsibility: full visual system for the new prototype, including scene layout, vehicle cards, buttons, and feedback states.

- Create: `tests/prototype/game-state.test.mjs`
  Responsibility: verify mission progression, scoring, retry behavior, and result summaries.

- Create: `tests/prototype/copy.test.mjs`
  Responsibility: verify required copy keys exist and fallback logic works.

- Create: `tests/prototype/render.test.mjs`
  Responsibility: verify renderer output contains critical UI sections and labels.

## Task 1: Create the prototype shell and mission state model

**Files:**
- Modify: `index.html`
- Create: `src/prototype/app.js`
- Create: `src/prototype/state/game-state.js`
- Test: `tests/prototype/game-state.test.mjs`

- [ ] **Step 1: Write the failing mission state test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGameState,
  startRun,
  submitMissionAnswer,
  getRunSummary,
} from '../../src/prototype/state/game-state.js';

test('startRun seeds mode-specific progress and first mission', () => {
  const state = createGameState();
  const nextState = startRun(state, {
    mode: 'quick',
    missionIds: ['mission-crosswalk', 'mission-park', 'mission-school'],
  });

  assert.equal(nextState.mode, 'quick');
  assert.equal(nextState.currentMissionId, 'mission-crosswalk');
  assert.equal(nextState.progress.completed, 0);
  assert.equal(nextState.progress.total, 3);
});

test('submitMissionAnswer rewards correct answers and advances', () => {
  const state = startRun(createGameState(), {
    mode: 'quick',
    missionIds: ['mission-crosswalk', 'mission-park'],
  });

  const answered = submitMissionAnswer(state, {
    missionId: 'mission-crosswalk',
    choiceId: 'ambulance-first',
    isCorrect: true,
  });

  assert.equal(answered.score.stars, 2);
  assert.equal(answered.progress.completed, 1);
  assert.equal(answered.currentMissionId, 'mission-park');
});

test('submitMissionAnswer tracks retry-safe mistakes without ending the run', () => {
  const state = startRun(createGameState(), {
    mode: 'quick',
    missionIds: ['mission-crosswalk'],
  });

  const answered = submitMissionAnswer(state, {
    missionId: 'mission-crosswalk',
    choiceId: 'police-first',
    isCorrect: false,
  });

  assert.equal(answered.score.stars, 0);
  assert.equal(answered.feedback.kind, 'retry');
  assert.equal(answered.progress.completed, 0);
  assert.equal(answered.currentMissionId, 'mission-crosswalk');
});

test('getRunSummary exposes practice abilities for result screen copy', () => {
  const state = {
    mode: 'adventure',
    completedMissionIds: ['mission-crosswalk', 'mission-rainy-road'],
    score: { stars: 5, perfectMissions: 2, retriesUsed: 1 },
    practicedAbilities: ['priority', 'sequence', 'route-planning'],
  };

  const summary = getRunSummary(state);

  assert.equal(summary.modeLabel, '冒险出发');
  assert.match(summary.practiceHeadline, /顺序|优先级|路线/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/prototype/game-state.test.mjs`

Expected: FAIL with `Cannot find module '../../src/prototype/state/game-state.js'`

- [ ] **Step 3: Write the minimal mission state implementation**

`src/prototype/state/game-state.js`

```js
const MODE_LABELS = {
  quick: '快速任务',
  adventure: '冒险出发',
};

export function createGameState() {
  return {
    mode: null,
    missionIds: [],
    currentMissionId: null,
    completedMissionIds: [],
    progress: { completed: 0, total: 0 },
    score: { stars: 0, perfectMissions: 0, retriesUsed: 0 },
    practicedAbilities: [],
    feedback: null,
  };
}

export function startRun(state, { mode, missionIds }) {
  return {
    ...createGameState(),
    mode,
    missionIds,
    currentMissionId: missionIds[0] ?? null,
    progress: { completed: 0, total: missionIds.length },
  };
}

export function submitMissionAnswer(state, { missionId, choiceId, isCorrect, abilityTag }) {
  if (!isCorrect) {
    return {
      ...state,
      score: {
        ...state.score,
        retriesUsed: state.score.retriesUsed + 1,
      },
      feedback: {
        kind: 'retry',
        missionId,
        choiceId,
      },
    };
  }

  const nextCompleted = [...state.completedMissionIds, missionId];
  const nextIndex = nextCompleted.length;

  return {
    ...state,
    completedMissionIds: nextCompleted,
    currentMissionId: state.missionIds[nextIndex] ?? null,
    progress: {
      completed: nextCompleted.length,
      total: state.progress.total,
    },
    score: {
      ...state.score,
      stars: state.score.stars + 2,
      perfectMissions: state.score.perfectMissions + 1,
    },
    practicedAbilities: abilityTag
      ? [...new Set([...state.practicedAbilities, abilityTag])]
      : state.practicedAbilities,
    feedback: {
      kind: 'success',
      missionId,
      choiceId,
    },
  };
}

export function getRunSummary(state) {
  return {
    modeLabel: MODE_LABELS[state.mode] ?? '任务模式',
    starCount: state.score.stars,
    practiceHeadline: `今天练到了：${state.practicedAbilities.join('、') || '观察与判断'}`,
  };
}
```

`src/prototype/app.js`

```js
import { createGameState } from './state/game-state.js';

const root = document.querySelector('#app');

root.innerHTML = `
  <div class="prototype-loading">
    <h1>星光安全城</h1>
    <p>原型结构正在接入中…</p>
  </div>
`;

window.prototypeState = createGameState();
```

`index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>星光安全城 | 警车与救护车逻辑训练</title>
    <link rel="stylesheet" href="./src/prototype/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/prototype/app.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/prototype/game-state.test.mjs`

Expected: PASS with `4 tests`

- [ ] **Step 5: Commit**

```bash
git add index.html src/prototype/app.js src/prototype/state/game-state.js tests/prototype/game-state.test.mjs
git commit -m "feat: scaffold prototype shell and mission state"
```

## Task 2: Add mission content and child-facing copy deck

**Files:**
- Create: `src/prototype/data/missions.js`
- Create: `src/prototype/data/copy.js`
- Modify: `src/prototype/state/game-state.js`
- Test: `tests/prototype/copy.test.mjs`
- Test: `tests/prototype/game-state.test.mjs`

- [ ] **Step 1: Write the failing data and copy tests**

`tests/prototype/copy.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { COPY, getPraiseLine, getRetryPrompt } from '../../src/prototype/data/copy.js';
import { MISSIONS, getMissionById } from '../../src/prototype/data/missions.js';

test('COPY exposes required product labels', () => {
  assert.equal(COPY.home.heroTitle, '星光安全城');
  assert.equal(COPY.home.quickModeLabel, '快速任务');
  assert.equal(COPY.result.primaryButton, '再来一轮');
});

test('getPraiseLine returns process-based praise', () => {
  assert.match(getPraiseLine('priority'), /观察|顺序|冷静|指挥官/);
});

test('getRetryPrompt keeps the tone gentle and constructive', () => {
  assert.doesNotMatch(getRetryPrompt('sequence'), /失败|不行|错得离谱/);
});

test('MISSIONS provides a complete first quick run set', () => {
  const firstMission = getMissionById('mission-crosswalk');
  assert.equal(firstMission.vehicle, 'ambulance');
  assert.equal(firstMission.abilityTag, 'priority');
  assert.equal(MISSIONS.quick.length, 3);
});
```

Append to `tests/prototype/game-state.test.mjs`

```js
test('submitMissionAnswer records practiced ability tags from mission metadata', () => {
  const state = startRun(createGameState(), {
    mode: 'quick',
    missionIds: ['mission-crosswalk'],
  });

  const answered = submitMissionAnswer(state, {
    missionId: 'mission-crosswalk',
    choiceId: 'ambulance-first',
    isCorrect: true,
    abilityTag: 'priority',
  });

  assert.deepEqual(answered.practicedAbilities, ['priority']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/prototype/copy.test.mjs tests/prototype/game-state.test.mjs`

Expected: FAIL with missing `copy.js` and `missions.js`

- [ ] **Step 3: Implement mission data and copy deck**

`src/prototype/data/missions.js`

```js
export const MISSIONS = {
  quick: [
    'mission-crosswalk',
    'mission-park',
    'mission-rainy-road',
  ],
  adventure: [
    'mission-crosswalk',
    'mission-park',
    'mission-rainy-road',
    'mission-library',
    'mission-school-gate',
  ],
};

const MISSION_MAP = {
  'mission-crosswalk': {
    id: 'mission-crosswalk',
    chapter: '学园守护日',
    title: '谁要先出发？',
    story: '斑马线旁有位爷爷突然头晕，小黄狗却只是找不到主人。',
    question: '哪辆车应该先去帮助更着急的人？',
    vehicle: 'ambulance',
    abilityTag: 'priority',
    sceneTag: 'school',
    choices: [
      { id: 'ambulance-first', label: '先派救护车去斑马线' },
      { id: 'police-first', label: '先派警车去找小黄狗' },
      { id: 'both-stop', label: '两辆车先停在原地观察' },
    ],
    correctChoiceId: 'ambulance-first',
  },
  'mission-park': {
    id: 'mission-park',
    chapter: '公园活动日',
    title: '线索藏在哪里？',
    story: '小朋友说气球飞走了，地上却留下了一串湿脚印和一张地图角。',
    question: '哪个线索更能帮助警车先找到方向？',
    vehicle: 'police',
    abilityTag: 'observation',
    sceneTag: 'park',
    choices: [
      { id: 'map-corner', label: '地图角' },
      { id: 'balloon-color', label: '气球颜色' },
      { id: 'wet-footprints', label: '湿脚印' },
    ],
    correctChoiceId: 'wet-footprints',
  },
  'mission-rainy-road': {
    id: 'mission-rainy-road',
    chapter: '雨天特别行动',
    title: '哪条路更快？',
    story: '一条路有积水，一条路有红灯等待，另一条路更远但畅通。',
    question: '要把药箱送到社区服务站，哪条路线更合适？',
    vehicle: 'ambulance',
    abilityTag: 'route-planning',
    sceneTag: 'rain',
    choices: [
      { id: 'flooded-road', label: '近路但有积水' },
      { id: 'traffic-light-road', label: '中路有长红灯' },
      { id: 'clear-road', label: '远一点但道路畅通' },
    ],
    correctChoiceId: 'clear-road',
  },
  'mission-library': {
    id: 'mission-library',
    chapter: '学园守护日',
    title: '先做哪一步？',
    story: '图书馆门口书本散落，广播里正在找一位走失的小朋友。',
    question: '先做哪一步最合理？',
    vehicle: 'police',
    abilityTag: 'sequence',
    sceneTag: 'library',
    choices: [
      { id: 'collect-books', label: '先收书再问情况' },
      { id: 'ask-broadcast-desk', label: '先去广播台确认线索' },
      { id: 'drive-away', label: '先绕城巡逻一圈' },
    ],
    correctChoiceId: 'ask-broadcast-desk',
  },
  'mission-school-gate': {
    id: 'mission-school-gate',
    chapter: '学园守护日',
    title: '任务顺序怎么排？',
    story: '校门口雨伞倒了一地，值班老师还说有个小朋友鞋带绊住了。',
    question: '怎样安排更安全？',
    vehicle: 'ambulance',
    abilityTag: 'sequence',
    sceneTag: 'school',
    choices: [
      { id: 'help-child-first', label: '先帮小朋友处理鞋带' },
      { id: 'collect-umbrellas-first', label: '先去收雨伞' },
      { id: 'wait-and-see', label: '先看看会不会自己好' },
    ],
    correctChoiceId: 'help-child-first',
  },
};

export function getMissionById(id) {
  return MISSION_MAP[id];
}
```

`src/prototype/data/copy.js`

```js
export const COPY = {
  home: {
    heroTitle: '星光安全城',
    heroSubtitle: '和警车、救护车一起动脑解决城市任务',
    quickModeLabel: '快速任务',
    adventureModeLabel: '冒险出发',
    archiveLabel: '车辆档案',
  },
  mission: {
    actionLabel: '请选择更合理的行动',
    scoreLabel: '闪亮星星',
    retryButton: '我再想想',
  },
  result: {
    title: '任务完成',
    primaryButton: '再来一轮',
    secondaryButton: '返回首页',
    skillPrefix: '今天练到了：',
  },
};

const PRAISE_LINES = {
  priority: ['你判断得很冷静', '你像真正的指挥官一样', '你看出了谁更需要帮助'],
  observation: ['你观察得真仔细', '这个线索被你抓住了', '你发现了关键细节'],
  sequence: ['你把先后顺序想清楚了', '这一步排得很稳', '你的流程判断真棒'],
  'route-planning': ['路线选得很聪明', '你提前想到了路况', '这次规划很可靠'],
};

const RETRY_PROMPTS = {
  priority: ['我们再看看，谁更着急呢？'],
  observation: ['再看一眼地上的线索，答案就快出现了。'],
  sequence: ['先别着急，我们把步骤重新排一排。'],
  'route-planning': ['想一想，哪条路虽然远一点却更稳？'],
};

export function getPraiseLine(tag) {
  return (PRAISE_LINES[tag] ?? ['你已经越来越会思考了'])[0];
}

export function getRetryPrompt(tag) {
  return (RETRY_PROMPTS[tag] ?? ['再试一次，你已经靠近答案了。'])[0];
}
```

Update `submitMissionAnswer()` in `src/prototype/state/game-state.js`

```js
export function submitMissionAnswer(state, { missionId, choiceId, isCorrect, abilityTag }) {
  if (!isCorrect) {
    return {
      ...state,
      score: {
        ...state.score,
        retriesUsed: state.score.retriesUsed + 1,
      },
      feedback: {
        kind: 'retry',
        missionId,
        choiceId,
        abilityTag,
      },
    };
  }

  const nextCompleted = [...state.completedMissionIds, missionId];
  const nextIndex = nextCompleted.length;

  return {
    ...state,
    completedMissionIds: nextCompleted,
    currentMissionId: state.missionIds[nextIndex] ?? null,
    progress: {
      completed: nextCompleted.length,
      total: state.progress.total,
    },
    score: {
      ...state.score,
      stars: state.score.stars + 2,
      perfectMissions: state.score.perfectMissions + 1,
    },
    practicedAbilities: abilityTag
      ? [...new Set([...state.practicedAbilities, abilityTag])]
      : state.practicedAbilities,
    feedback: {
      kind: 'success',
      missionId,
      choiceId,
      abilityTag,
    },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/prototype/copy.test.mjs tests/prototype/game-state.test.mjs`

Expected: PASS with `9 tests`

- [ ] **Step 5: Commit**

```bash
git add src/prototype/data/missions.js src/prototype/data/copy.js src/prototype/state/game-state.js tests/prototype/copy.test.mjs tests/prototype/game-state.test.mjs
git commit -m "feat: add mission data and child-facing copy"
```

## Task 3: Render the high-fidelity prototype screens

**Files:**
- Modify: `src/prototype/app.js`
- Create: `src/prototype/ui/screens.js`
- Create: `src/prototype/ui/renderers.js`
- Create: `src/prototype/styles.css`
- Test: `tests/prototype/render.test.mjs`

- [ ] **Step 1: Write the failing renderer test**

`tests/prototype/render.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { renderHomeScreen, renderMissionScreen, renderResultScreen } from '../../src/prototype/ui/screens.js';
import { getMissionById } from '../../src/prototype/data/missions.js';

test('renderHomeScreen exposes both game modes and archive entry', () => {
  const html = renderHomeScreen();

  assert.match(html, /快速任务/);
  assert.match(html, /冒险出发/);
  assert.match(html, /车辆档案/);
});

test('renderMissionScreen exposes question, vehicle panel, and progress HUD', () => {
  const html = renderMissionScreen({
    mission: getMissionById('mission-crosswalk'),
    state: {
      progress: { completed: 1, total: 3 },
      score: { stars: 2 },
    },
  });

  assert.match(html, /谁要先出发/);
  assert.match(html, /请选择更合理的行动/);
  assert.match(html, /救护车/);
  assert.match(html, /1 \/ 3/);
});

test('renderResultScreen highlights practiced abilities', () => {
  const html = renderResultScreen({
    summary: {
      modeLabel: '快速任务',
      starCount: 6,
      practiceHeadline: '今天练到了：优先级、顺序',
    },
  });

  assert.match(html, /任务完成/);
  assert.match(html, /今天练到了：优先级、顺序/);
  assert.match(html, /再来一轮/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/prototype/render.test.mjs`

Expected: FAIL with missing `screens.js`

- [ ] **Step 3: Implement screen renderers and styles**

`src/prototype/ui/renderers.js`

```js
export function renderModeButton({ id, title, description, accent }) {
  return `
    <button class="mode-card mode-card--${accent}" data-mode="${id}">
      <span class="mode-card__title">${title}</span>
      <span class="mode-card__desc">${description}</span>
    </button>
  `;
}

export function renderChoiceList(choices) {
  return `
    <div class="choice-list">
      ${choices
        .map(
          choice => `
            <button class="choice-card" data-choice-id="${choice.id}">
              <span class="choice-card__label">${choice.label}</span>
            </button>
          `,
        )
        .join('')}
    </div>
  `;
}

export function renderVehiclePanel(vehicle) {
  const meta = vehicle === 'ambulance'
    ? { name: '救护车', emoji: '🚑', role: '温柔、冷静、优先帮助更着急的人' }
    : { name: '警车', emoji: '🚓', role: '机灵、守规则、先找到关键线索' };

  return `
    <aside class="vehicle-panel vehicle-panel--${vehicle}">
      <div class="vehicle-panel__emoji">${meta.emoji}</div>
      <h3>${meta.name}</h3>
      <p>${meta.role}</p>
    </aside>
  `;
}
```

`src/prototype/ui/screens.js`

```js
import { COPY } from '../data/copy.js';
import { renderChoiceList, renderModeButton, renderVehiclePanel } from './renderers.js';

export function renderHomeScreen() {
  return `
    <section class="screen screen--home">
      <header class="hero">
        <p class="hero__eyebrow">逻辑训练小游戏</p>
        <h1>${COPY.home.heroTitle}</h1>
        <p class="hero__subtitle">${COPY.home.heroSubtitle}</p>
      </header>
      <div class="hero-vehicles">
        <div class="hero-vehicle hero-vehicle--police">🚓</div>
        <div class="hero-vehicle hero-vehicle--ambulance">🚑</div>
      </div>
      <div class="mode-grid">
        ${renderModeButton({
          id: 'quick',
          title: COPY.home.quickModeLabel,
          description: '3-5 分钟，快速完成一轮逻辑任务',
          accent: 'police',
        })}
        ${renderModeButton({
          id: 'adventure',
          title: COPY.home.adventureModeLabel,
          description: '8-10 分钟，连续处理城市任务',
          accent: 'ambulance',
        })}
      </div>
      <button class="archive-entry">${COPY.home.archiveLabel}</button>
    </section>
  `;
}

export function renderMissionScreen({ mission, state }) {
  return `
    <section class="screen screen--mission">
      <div class="hud">
        <span class="hud__progress">${state.progress.completed} / ${state.progress.total}</span>
        <span class="hud__stars">⭐ ${state.score.stars}</span>
      </div>
      <div class="scene-card scene-card--${mission.sceneTag}">
        <p class="scene-card__chapter">${mission.chapter}</p>
        <h2>${mission.title}</h2>
        <p class="scene-card__story">${mission.story}</p>
      </div>
      <div class="mission-layout">
        <div class="mission-question">
          <p class="mission-question__label">${COPY.mission.actionLabel}</p>
          <h3>${mission.question}</h3>
          ${renderChoiceList(mission.choices)}
        </div>
        ${renderVehiclePanel(mission.vehicle)}
      </div>
    </section>
  `;
}

export function renderResultScreen({ summary }) {
  return `
    <section class="screen screen--result">
      <p class="result__mode">${summary.modeLabel}</p>
      <h2>${COPY.result.title}</h2>
      <div class="result__stars">⭐ ${summary.starCount}</div>
      <p class="result__skills">${summary.practiceHeadline}</p>
      <div class="result__actions">
        <button>${COPY.result.primaryButton}</button>
        <button class="secondary">${COPY.result.secondaryButton}</button>
      </div>
    </section>
  `;
}
```

Replace `src/prototype/app.js` with:

```js
import { MISSIONS, getMissionById } from './data/missions.js';
import { createGameState, getRunSummary, startRun } from './state/game-state.js';
import { renderHomeScreen, renderMissionScreen, renderResultScreen } from './ui/screens.js';

const root = document.querySelector('#app');

let state = createGameState();

function render() {
  if (!state.mode) {
    root.innerHTML = renderHomeScreen();
    return;
  }

  if (state.currentMissionId) {
    root.innerHTML = renderMissionScreen({
      mission: getMissionById(state.currentMissionId),
      state,
    });
    return;
  }

  root.innerHTML = renderResultScreen({
    summary: getRunSummary(state),
  });
}

root.addEventListener('click', event => {
  const mode = event.target.closest('[data-mode]')?.dataset.mode;
  if (!mode) return;

  state = startRun(state, {
    mode,
    missionIds: MISSIONS[mode],
  });
  render();
});

render();
```

`src/prototype/styles.css`

```css
:root {
  --bg-top: #dff3ff;
  --bg-bottom: #fff3d6;
  --surface: rgba(255, 255, 255, 0.88);
  --ink: #17324d;
  --police: #2c6bff;
  --ambulance: #ff5b5b;
  --gold: #ffcc4d;
  --shadow: 0 20px 50px rgba(23, 50, 77, 0.14);
  --radius-xl: 28px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  background: linear-gradient(180deg, var(--bg-top), var(--bg-bottom));
  color: var(--ink);
}

#app {
  width: min(1200px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0 40px;
}

.screen {
  display: grid;
  gap: 24px;
}

.hero,
.scene-card,
.mission-layout,
.result__actions,
.mode-grid {
  width: 100%;
}

.hero {
  padding: 32px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow);
  text-align: center;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.mode-card,
.archive-entry,
.choice-card,
.result__actions button {
  border: 0;
  border-radius: 24px;
  background: #fff;
  box-shadow: var(--shadow);
  cursor: pointer;
}

.mission-layout {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr;
  gap: 20px;
}

.vehicle-panel,
.mission-question,
.scene-card {
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/prototype/render.test.mjs`

Expected: PASS with `3 tests`

- [ ] **Step 5: Commit**

```bash
git add src/prototype/app.js src/prototype/ui/screens.js src/prototype/ui/renderers.js src/prototype/styles.css tests/prototype/render.test.mjs
git commit -m "feat: render prototype screens and visual system"
```

## Task 4: Add mission interaction, success feedback, and archive/copy polish

**Files:**
- Modify: `src/prototype/app.js`
- Create: `src/prototype/ui/animations.js`
- Modify: `src/prototype/ui/screens.js`
- Modify: `src/prototype/styles.css`
- Modify: `src/prototype/data/copy.js`
- Test: `tests/prototype/render.test.mjs`
- Test: `tests/prototype/game-state.test.mjs`

- [ ] **Step 1: Extend tests for interaction-ready output**

Append to `tests/prototype/render.test.mjs`

```js
test('renderMissionScreen shows gentle retry copy when feedback exists', () => {
  const html = renderMissionScreen({
    mission: getMissionById('mission-library'),
    state: {
      progress: { completed: 2, total: 5 },
      score: { stars: 4 },
      feedback: {
        kind: 'retry',
        abilityTag: 'sequence',
        message: '先别着急，我们把步骤重新排一排。',
      },
    },
  });

  assert.match(html, /先别着急，我们把步骤重新排一排/);
});
```

Append to `tests/prototype/game-state.test.mjs`

```js
test('getRunSummary highlights a warm result headline', () => {
  const summary = getRunSummary({
    mode: 'quick',
    practicedAbilities: ['priority', 'sequence'],
    score: { stars: 6, perfectMissions: 3, retriesUsed: 1 },
  });

  assert.match(summary.practiceHeadline, /优先级|顺序/);
  assert.match(summary.resultHeadline, /任务完成|真棒|指挥官/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/prototype/render.test.mjs tests/prototype/game-state.test.mjs`

Expected: FAIL with missing retry copy and missing `resultHeadline`

- [ ] **Step 3: Implement interaction, feedback overlay, and copy polish**

`src/prototype/ui/animations.js`

```js
export function showCelebrateOverlay({ vehicle = 'police', text = '任务完成' }) {
  const overlay = document.createElement('div');
  overlay.className = `celebrate-overlay celebrate-overlay--${vehicle}`;
  overlay.innerHTML = `
    <div class="celebrate-overlay__vehicle">${vehicle === 'ambulance' ? '🚑' : '🚓'}</div>
    <div class="celebrate-overlay__text">${text}</div>
  `;

  document.body.appendChild(overlay);
  window.setTimeout(() => overlay.remove(), 1400);
}
```

Update `getRunSummary()` in `src/prototype/state/game-state.js`

```js
export function getRunSummary(state) {
  return {
    modeLabel: MODE_LABELS[state.mode] ?? '任务模式',
    starCount: state.score.stars,
    resultHeadline: '任务完成，你今天又更会动脑了',
    practiceHeadline: `今天练到了：${state.practicedAbilities.join('、') || '观察与判断'}`,
  };
}
```

Update `renderMissionScreen()` in `src/prototype/ui/screens.js`

```js
import { COPY, getRetryPrompt } from '../data/copy.js';

export function renderMissionScreen({ mission, state }) {
  const retryText =
    state.feedback?.kind === 'retry'
      ? state.feedback.message ?? getRetryPrompt(state.feedback.abilityTag)
      : '';

  return `
    <section class="screen screen--mission">
      <div class="hud">
        <span class="hud__progress">${state.progress.completed} / ${state.progress.total}</span>
        <span class="hud__stars">⭐ ${state.score.stars}</span>
      </div>
      <div class="scene-card scene-card--${mission.sceneTag}">
        <p class="scene-card__chapter">${mission.chapter}</p>
        <h2>${mission.title}</h2>
        <p class="scene-card__story">${mission.story}</p>
      </div>
      <div class="mission-layout">
        <div class="mission-question">
          <p class="mission-question__label">${COPY.mission.actionLabel}</p>
          <h3>${mission.question}</h3>
          ${retryText ? `<p class="mission-question__retry">${retryText}</p>` : ''}
          ${renderChoiceList(mission.choices)}
        </div>
        ${renderVehiclePanel(mission.vehicle)}
      </div>
    </section>
  `;
}
```

Replace `src/prototype/app.js` with:

```js
import { COPY, getPraiseLine, getRetryPrompt } from './data/copy.js';
import { MISSIONS, getMissionById } from './data/missions.js';
import { showCelebrateOverlay } from './ui/animations.js';
import { createGameState, getRunSummary, startRun, submitMissionAnswer } from './state/game-state.js';
import { renderHomeScreen, renderMissionScreen, renderResultScreen } from './ui/screens.js';

const root = document.querySelector('#app');

let state = createGameState();

function render() {
  if (!state.mode) {
    root.innerHTML = renderHomeScreen();
    return;
  }

  if (state.currentMissionId) {
    root.innerHTML = renderMissionScreen({
      mission: getMissionById(state.currentMissionId),
      state,
    });
    return;
  }

  root.innerHTML = renderResultScreen({
    summary: getRunSummary(state),
  });
}

function handleModeSelection(mode) {
  state = startRun(state, {
    mode,
    missionIds: MISSIONS[mode],
  });
  render();
}

function handleChoice(choiceId) {
  const mission = getMissionById(state.currentMissionId);
  const isCorrect = mission.correctChoiceId === choiceId;

  state = submitMissionAnswer(state, {
    missionId: mission.id,
    choiceId,
    isCorrect,
    abilityTag: mission.abilityTag,
  });

  if (!isCorrect) {
    state = {
      ...state,
      feedback: {
        ...state.feedback,
        message: getRetryPrompt(mission.abilityTag),
      },
    };
    render();
    return;
  }

  showCelebrateOverlay({
    vehicle: mission.vehicle,
    text: getPraiseLine(mission.abilityTag),
  });
  render();
}

root.addEventListener('click', event => {
  const mode = event.target.closest('[data-mode]')?.dataset.mode;
  if (mode) {
    handleModeSelection(mode);
    return;
  }

  const choiceId = event.target.closest('[data-choice-id]')?.dataset.choiceId;
  if (choiceId && state.currentMissionId) {
    handleChoice(choiceId);
    return;
  }

  const wantsRestart = event.target.textContent?.trim() === COPY.result.primaryButton;
  if (wantsRestart) {
    state = createGameState();
    render();
  }
});

render();
```

Append to `src/prototype/styles.css`

```css
.mission-question__retry {
  margin: 8px 0 16px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 204, 77, 0.22);
  color: #8a5a00;
  font-weight: 700;
}

.celebrate-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 12px;
  background: radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%);
  pointer-events: none;
  animation: celebrate-fade 1.4s ease-out forwards;
}

.celebrate-overlay__vehicle {
  font-size: 96px;
}

.celebrate-overlay__text {
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(255,255,255,0.92);
  box-shadow: var(--shadow);
  font-size: 24px;
  font-weight: 800;
}

@keyframes celebrate-fade {
  0% { opacity: 0; transform: scale(0.92); }
  20% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.06); }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/prototype/render.test.mjs tests/prototype/game-state.test.mjs`

Expected: PASS with `10 tests`

- [ ] **Step 5: Manual verification**

Run: `open index.html`

Expected:
- Home screen shows both modes and archive entry
- Clicking a mode opens the first mission
- Wrong answer shows warm retry guidance
- Correct answer shows overlay feedback
- Finishing the run shows practiced abilities on result screen

- [ ] **Step 6: Commit**

```bash
git add src/prototype/app.js src/prototype/ui/animations.js src/prototype/ui/screens.js src/prototype/styles.css src/prototype/data/copy.js src/prototype/state/game-state.js tests/prototype/render.test.mjs tests/prototype/game-state.test.mjs
git commit -m "feat: add playable mission flow and feedback polish"
```

## Self-Review

Spec coverage check:

- Core mission loop: covered by Tasks 1, 3, 4
- Dual mode structure: covered by Tasks 1 and 3
- Child-friendly copy and emotional feedback: covered by Tasks 2 and 4
- Card-based visual prototype and polished motion: covered by Tasks 3 and 4
- Light growth/result value expression: covered by Tasks 1 and 4 via practiced ability summary

Gaps intentionally left out of this prototype plan:

- Parent-side progress center
- Full chapter map recovery flow
- Vehicle archive detail interactions
- Production-grade audio system

Those are valid next plans, but they are not required to produce a convincing first playable prototype.

Placeholder scan:

- No `TBD`, `TODO`, or implicit “handle this later” language remains.
- Every task includes exact files, commands, and concrete code snippets.

Type consistency check:

- `abilityTag` naming is consistent across mission data, state, copy, and render layers.
- `practiceHeadline` naming is consistent between `getRunSummary()` and result rendering.
- `currentMissionId` is used consistently as the mission pointer throughout the plan.

## Recommended Execution Notes

- Because the current repo already contains a very large legacy `index.html`, do not implement this plan by partially editing old sections in place. Replace the shell and move new logic into `src/prototype/`.
- Keep the first prototype focused on one polished loop. Do not add leaderboard, settings migration, or extra vehicles during this plan.
- When manual verification is complete, capture 3 screenshots: home, mission, result. Those will make the next design review faster.
