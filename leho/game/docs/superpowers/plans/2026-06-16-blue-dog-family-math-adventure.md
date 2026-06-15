# Blue Dog Family Math Adventure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current dinosaur math game into an original blue/orange dog-family cartoon math adventure with rigorous story semantics, voice-first flow, and polished exaggerated animation and sound.

**Architecture:** Keep the static HTML game model. Move math-story generation into a focused testable module, add a focused cartoon-scene module, then adapt `index.html`, `adventure.js`, and `garage.js` to consume those APIs while preserving score, coins, leaderboard, medals, and localStorage.

**Tech Stack:** Plain HTML, CSS, JavaScript, Web Speech API, Web Audio API, Node built-in `node:test`, localStorage.

---

## File Structure

- Create `logic/story-templates.js`: structured math story templates, generator helpers, `validateQuestion`, and CommonJS/browser exports.
- Create `logic/story-templates.test.js`: Node tests for arithmetic and semantic invariants.
- Create `cartoon.js`: original dog-family character data, scene metadata, scene rendering helpers, and speech line helpers.
- Modify `index.html`: load new scripts, replace dinosaur/vehicle visual copy with dog-family cartoon UI, call `StoryTemplates.generateQuestion`, render cartoon scenes, route speech and sound.
- Modify `adventure.js`: replace vehicle chase themes with household episode themes while keeping the `Adventure` API shape.
- Modify `garage.js`: keep economy behavior and API names, but change player-facing names and voice text so vehicles become pretend-play props and dinosaurs become dog costumes.

## Task 1: Story Template Module

**Files:**
- Create: `logic/story-templates.js`
- Create: `logic/story-templates.test.js`

- [ ] **Step 1: Write the failing tests**

Create `logic/story-templates.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const StoryTemplates = require('./story-templates');

function fixedRand(values) {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i += 1;
    return value;
  };
}

test('generateQuestion returns valid arithmetic for every known type', () => {
  const types = ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep'];
  for (const type of types) {
    for (let i = 0; i < 30; i += 1) {
      const q = StoryTemplates.generateQuestion({ type, family: 'livingRoom', rand: fixedRand([0.13, 0.62, 0.29, 0.81, 0.45]) });
      const result = StoryTemplates.validateQuestion(q);
      assert.equal(result.ok, true, `${type} should validate: ${result.reason || ''}`);
      assert.equal(Number.isInteger(q.answer), true);
      assert.equal(q.answer >= 0, true);
      assert.equal(typeof q.story, 'string');
      assert.equal(typeof q.question, 'string');
      assert.equal(typeof q.readEquation, 'string');
      assert.equal(Array.isArray(q.equationParts), true);
    }
  }
});

test('semantic intent matches operation mode', () => {
  const addition = StoryTemplates.makeQuestionFromTemplate('addition', { a: 4, b: 5, templateIndex: 0 });
  assert.equal(addition.intent, 'total');
  assert.equal(addition.answer, 9);
  assert.match(addition.question, /一共|总共|现在有/);

  const subtraction = StoryTemplates.makeQuestionFromTemplate('subtraction', { a: 9, b: 3, templateIndex: 0 });
  assert.equal(subtraction.intent, 'remaining');
  assert.equal(subtraction.answer, 6);
  assert.match(subtraction.question, /还剩/);

  const compare = StoryTemplates.makeQuestionFromTemplate('compare', { a: 13, b: 8, templateIndex: 0 });
  assert.equal(compare.intent, 'difference');
  assert.equal(compare.answer, 5);
  assert.match(compare.question, /多多少/);
});

test('validator rejects mismatched story semantics', () => {
  const bad = {
    type: 'basic',
    mode: 'addition',
    intent: 'remaining',
    answer: 7,
    equationParts: [3, '+', 4, '='],
    story: '蓝蓝有 3 块积木，又拿来 4 块，',
    question: '还剩多少块？',
    readEquation: '三加四等于多少？',
    unit: '块',
    noun: '积木'
  };
  const result = StoryTemplates.validateQuestion(bad);
  assert.equal(result.ok, false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test logic/story-templates.test.js`

Expected: FAIL with `Cannot find module './story-templates'`.

- [ ] **Step 3: Implement the story module**

Create `logic/story-templates.js` with:

```js
'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StoryTemplates = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCENES = ['livingRoom', 'backyard', 'park', 'kitchen', 'bedroom'];

  const TEMPLATES = {
    addition: [
      { scene: 'livingRoom', noun: '积木', unit: '块', story: (a, b) => `蓝蓝先搭了 ${a} 块积木，橙橙又递来 ${b} 块，`, question: '现在一共有多少块积木？' },
      { scene: 'backyard', noun: '气球', unit: '个', story: (a, b) => `后院挂着 ${a} 个气球，爸爸又吹好 ${b} 个，`, question: '后院一共有多少个气球？' },
      { scene: 'kitchen', noun: '饼干', unit: '块', story: (a, b) => `盘子里有 ${a} 块饼干，妈妈又放上 ${b} 块，`, question: '盘子里现在有多少块饼干？' }
    ],
    subtraction: [
      { scene: 'livingRoom', noun: '积木', unit: '块', story: (a, b) => `蓝蓝有 ${a} 块积木，收进玩具箱 ${b} 块，`, question: '外面还剩多少块积木？' },
      { scene: 'kitchen', noun: '饼干', unit: '块', story: (a, b) => `盘子里有 ${a} 块饼干，橙橙吃掉 ${b} 块，`, question: '盘子里还剩多少块饼干？' },
      { scene: 'bedroom', noun: '星星贴纸', unit: '张', story: (a, b) => `床头有 ${a} 张星星贴纸，蓝蓝贴到本子上 ${b} 张，`, question: '床头还剩多少张星星贴纸？' }
    ],
    compare: [
      { scene: 'park', noun: '小石子', unit: '颗', story: (a, b) => `蓝蓝捡了 ${a} 颗小石子，橙橙捡了 ${b} 颗小石子，`, question: '蓝蓝比橙橙多多少颗小石子？' },
      { scene: 'bedroom', noun: '星星贴纸', unit: '张', story: (a, b) => `蓝蓝有 ${a} 张星星贴纸，橙橙有 ${b} 张星星贴纸，`, question: '蓝蓝比橙橙多多少张星星贴纸？' }
    ]
  };

  function randInt(min, max, rand) {
    const r = typeof rand === 'function' ? rand() : Math.random();
    return Math.floor(Math.max(0, Math.min(0.999999, r)) * (max - min + 1)) + min;
  }

  function pick(list, index) {
    return list[Math.max(0, Math.min(list.length - 1, index || 0))];
  }

  function spokenNumber(n) {
    return String(n);
  }

  function makeQuestionFromTemplate(mode, opts) {
    const options = opts || {};
    const list = TEMPLATES[mode];
    if (!list) throw new Error(`Unknown story mode: ${mode}`);
    const t = pick(list, options.templateIndex || 0);
    let a = Math.floor(Number(options.a) || 0);
    let b = Math.floor(Number(options.b) || 0);
    if (mode === 'subtraction' && b > a) {
      const tmp = a; a = b; b = tmp;
    }
    const answer = mode === 'addition' ? a + b : a - b;
    const op = mode === 'addition' ? '+' : '-';
    const intent = mode === 'addition' ? 'total' : (mode === 'compare' ? 'difference' : 'remaining');
    const readOp = op === '+' ? '加' : '减';
    return {
      a, b, op, answer,
      type: mode === 'compare' ? 'compare' : 'basic',
      mode,
      intent,
      scene: t.scene,
      noun: t.noun,
      unit: t.unit,
      story: t.story(a, b),
      question: t.question,
      tag: t.scene,
      equationParts: [a, op, b, '='],
      readEquation: `${spokenNumber(a)} ${readOp} ${spokenNumber(b)} 等于多少？`
    };
  }

  function validateQuestion(q) {
    if (!q || typeof q !== 'object') return { ok: false, reason: 'missing-question' };
    if (!Number.isInteger(q.answer) || q.answer < 0) return { ok: false, reason: 'bad-answer' };
    if (!Array.isArray(q.equationParts) || q.equationParts.length < 4) return { ok: false, reason: 'bad-equation-parts' };
    if (!q.story || !q.question || !q.readEquation) return { ok: false, reason: 'missing-text' };
    if (q.mode === 'addition' && q.intent !== 'total') return { ok: false, reason: 'addition-intent-mismatch' };
    if (q.mode === 'subtraction' && q.intent !== 'remaining') return { ok: false, reason: 'subtraction-intent-mismatch' };
    if (q.mode === 'compare' && q.intent !== 'difference') return { ok: false, reason: 'compare-intent-mismatch' };
    return { ok: true };
  }

  function generateQuestion(options) {
    const opts = options || {};
    const rand = opts.rand || Math.random;
    const type = opts.type || 'basic';
    if (type === 'compare') return makeQuestionFromTemplate('compare', { a: randInt(9, 20, rand), b: randInt(1, 8, rand), templateIndex: randInt(0, TEMPLATES.compare.length - 1, rand) });
    if (type === 'missing') return makeQuestionFromTemplate('addition', { a: randInt(3, 9, rand), b: randInt(3, 9, rand), templateIndex: randInt(0, TEMPLATES.addition.length - 1, rand) });
    if (type === 'twoStep') return makeQuestionFromTemplate('subtraction', { a: randInt(10, 20, rand), b: randInt(1, 9, rand), templateIndex: randInt(0, TEMPLATES.subtraction.length - 1, rand) });
    if (type === 'carryBorrow') return makeQuestionFromTemplate(rand() < 0.55 ? 'addition' : 'subtraction', { a: randInt(6, 18, rand), b: randInt(2, 9, rand), templateIndex: randInt(0, TEMPLATES.addition.length - 1, rand) });
    return makeQuestionFromTemplate(rand() < 0.55 ? 'addition' : 'subtraction', { a: randInt(2, 10, rand), b: randInt(1, 9, rand), templateIndex: randInt(0, TEMPLATES.addition.length - 1, rand) });
  }

  return { SCENES, TEMPLATES, makeQuestionFromTemplate, validateQuestion, generateQuestion };
});
```

- [ ] **Step 4: Run tests to verify green**

Run: `node --test logic/story-templates.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add logic/story-templates.js logic/story-templates.test.js
git commit -m "feat: add validated dog family story templates"
```

## Task 2: Full Question Coverage And Generator Integration

**Files:**
- Modify: `logic/story-templates.js`
- Modify: `logic/story-templates.test.js`
- Modify: `index.html`

- [ ] **Step 1: Add failing tests for missing and two-step semantics**

Add tests that call `StoryTemplates.generateQuestion({ type: 'missing' })` and `StoryTemplates.generateQuestion({ type: 'twoStep' })`, then assert `validateQuestion(q).ok === true`, `q.type` matches the requested type, and `q.readEquation` describes the same equation as `q.equationParts`.

- [ ] **Step 2: Run test to verify failure**

Run: `node --test logic/story-templates.test.js`

Expected: FAIL because the starter implementation maps `missing` and `twoStep` to simplified basic semantics.

- [ ] **Step 3: Implement real missing and two-step templates**

Update `logic/story-templates.js` so:

- `missingAddend`: equation parts include `'?'` in an addend position and answer is the missing addend.
- `missingMinuend`: equation parts begin with `'?'`, answer is original quantity, and story asks original quantity.
- `missingSubtrahend`: equation parts contain `'?'` after `'-'`, answer is removed quantity, and story asks removed quantity.
- `twoStepAddSubtract`: answer is `a + b - c`.
- `twoStepSubtractAdd`: answer is `a - b + c`.

- [ ] **Step 4: Replace inline generation in `index.html`**

Load the new script before `garage.js`:

```html
<script src="logic/question-mix.js"></script>
<script src="logic/story-templates.js"></script>
<script src="garage.js"></script>
```

Replace `generateQuestion()` so it delegates to `StoryTemplates.generateQuestion({ type, family: currentFamily() || 'livingRoom' })`, validates the result, and retries a bounded number of times before falling back to a known-safe addition question.

- [ ] **Step 5: Run tests**

Run:

```bash
node --test logic/story-templates.test.js
```

Expected: tests PASS. Browser loading and runtime syntax are verified in Task 7 because `index.html` is not a standalone JavaScript file.

- [ ] **Step 6: Commit**

Run:

```bash
git add logic/story-templates.js logic/story-templates.test.js index.html
git commit -m "feat: use validated dog family math stories"
```

## Task 3: Cartoon Scene Metadata And Rendering

**Files:**
- Create: `cartoon.js`
- Modify: `index.html`
- Modify: `adventure.js`

- [ ] **Step 1: Create a lightweight scene module**

Create `cartoon.js` with browser/CommonJS exports for:

- `Cartoon.CHARACTERS.lele` and `Cartoon.CHARACTERS.haohao`.
- `Cartoon.SCENES.livingRoom`, `backyard`, `park`, `kitchen`, `bedroom`.
- `Cartoon.characterMarkup(playerId)`.
- `Cartoon.sceneTitle(sceneId)`.
- `Cartoon.sceneClass(sceneId)`.

- [ ] **Step 2: Load `cartoon.js`**

Add:

```html
<script src="cartoon.js"></script>
```

before `adventure.js` in `index.html`.

- [ ] **Step 3: Adapt `adventure.js` themes**

Keep `Adventure.createRun`, `beginSettle`, `finishStep`, `shouldShowBoss`, and `markBossShown` unchanged. Replace theme data with household episode families: `livingRoom`, `backyard`, `park`, `kitchen`, `bedroom`, plus `adventure` fallback mapped to `livingRoom`.

- [ ] **Step 4: Render cartoon scenes in `index.html`**

Update `renderAdventureHud()` to:

- Read `q.scene` when available.
- Apply scene CSS class from `Cartoon.sceneClass(sceneId)`.
- Render scene props from `Cartoon.SCENES[sceneId].props`.
- Render the selected dog character instead of the equipped vehicle.

- [ ] **Step 5: Commit**

Run:

```bash
git add cartoon.js adventure.js index.html
git commit -m "feat: render dog family cartoon scenes"
```

## Task 4: Visual Redesign And Animation Polish

**Files:**
- Modify: `index.html`
- Modify: `cartoon.js`

- [ ] **Step 1: Replace dinosaur-facing UI copy**

Change title, subtitle, button copy, player preview labels, result copy, leaderboard titles, and garage labels from dinosaur/vehicle wording to dog-family cartoon wording.

- [ ] **Step 2: Add dog character CSS**

Add CSS for original dog characters:

- Head, ears, muzzle, eyes, nose, body, tail.
- Idle breathing.
- Blink animation.
- Ear bounce.
- Correct-answer jump class.
- Streak glow class.

- [ ] **Step 3: Add scene CSS**

Add CSS classes for:

- `.cartoon-scene-living-room`
- `.cartoon-scene-backyard`
- `.cartoon-scene-park`
- `.cartoon-scene-kitchen`
- `.cartoon-scene-bedroom`

Each scene must have recognizable props and a calm area for the question card.

- [ ] **Step 4: Replace correct-answer animation sequence**

Update `showAdventureStep()` to use a household cartoon sequence:

1. Character crouches.
2. Character springs upward.
3. Matching scene prop flies into place.
4. Stars/coins arc to the score badge.
5. Scene progress moves to the next episode beat.

- [ ] **Step 5: Keep reduced-motion behavior**

Ensure `@media (prefers-reduced-motion: reduce)` disables new character and prop animations while keeping state changes visible.

- [ ] **Step 6: Commit**

Run:

```bash
git add index.html cartoon.js
git commit -m "feat: polish dog family cartoon animation"
```

## Task 5: Exaggerated Web Audio

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Write a small sound palette**

Add functions:

- `playToyClick()`
- `playBoing(freq, delay)`
- `playXylophoneRun(base, count, delay)`
- `playCartoonCorrect(streak)`
- `playCartoonWrong()`
- `playCartoonHint()`
- `playCartoonFinale(streak)`

Each function must use `withAudioCtx` and `playTone`, and must return immediately when `voiceMuted` is true.

- [ ] **Step 2: Replace event sound calls**

Route:

- Start and player selection to `playXylophoneRun`.
- Button click to `playToyClick`.
- Correct answers to `playCartoonCorrect(correctStreak)`.
- Wrong answers to `playCartoonWrong()` plus hint chime when needed.
- Final answer to `playCartoonFinale(correctStreak)`.
- Garage unlock/equip to toy-box sound.

- [ ] **Step 3: Verify mute**

Manually test: mute button changes to muted state, speech stops, and new sound functions do not schedule tones.

- [ ] **Step 4: Commit**

Run:

```bash
git add index.html
git commit -m "feat: add exaggerated cartoon sound effects"
```

## Task 6: Voice-First Flow

**Files:**
- Modify: `index.html`
- Modify: `garage.js`
- Modify: `cartoon.js`

- [ ] **Step 1: Add voice line helpers**

Add `Cartoon.voice` helpers for:

- Home intro.
- Player prompt.
- Player selected.
- Episode intro.
- Correct feedback by streak.
- Wrong feedback by attempt count.
- Finale.

- [ ] **Step 2: Replace text-only flows**

Audit event handlers and ensure each user-visible state change calls `speak`, `speakQueue`, or `speakQueueAfterCurrent`.

- [ ] **Step 3: Preserve reread behavior**

Ensure `rereadCurrentQuestion()` calls `buildReadText(questions[currentIdx])` and reads story + question + equation only according to settings.

- [ ] **Step 4: Add spoken labels for non-reading children**

When entering player page, garage page, leaderboard page, result page, and settings page, speak a short orientation line.

- [ ] **Step 5: Commit**

Run:

```bash
git add index.html garage.js cartoon.js
git commit -m "feat: make dog math game voice first"
```

## Task 7: Browser Verification And Responsive Checks

**Files:**
- Modify only if verification finds defects.

- [ ] **Step 1: Start a static server**

Run: `python3 -m http.server 4173`

Expected: server serves `/Users/ip/dev/code/blog/leho/game` at `http://localhost:4173`.

- [ ] **Step 2: Open in browser**

Use the Browser plugin to navigate to `http://localhost:4173/index.html`.

- [ ] **Step 3: Verify first viewport**

Confirm:

- The page visibly reads as a dog-family cartoon math game.
- No dinosaur hero remains.
- Main button is visible.
- Mute button is visible.

- [ ] **Step 4: Verify one round can start**

Click start, choose a player, confirm:

- A dog-family episode scene appears.
- A question appears.
- Read-question button exists.
- Numpad exists.

- [ ] **Step 5: Verify responsive layouts**

Check desktop, mobile portrait, and landscape dimensions. Confirm text and controls do not overlap.

- [ ] **Step 6: Run automated tests**

Run: `node --test logic/story-templates.test.js`

Expected: PASS.

- [ ] **Step 7: Commit fixes if any**

If any verification issue is fixed, run:

```bash
git add index.html adventure.js garage.js cartoon.js logic/story-templates.js logic/story-templates.test.js
git commit -m "fix: verify dog family math adventure"
```
