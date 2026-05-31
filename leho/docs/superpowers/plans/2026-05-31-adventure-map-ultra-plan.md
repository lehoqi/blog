# Adventure Map Ultra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current adventure HUD into an A+B Ultra map: five theme-specific mini-worlds, exaggerated answer animations, synchronized sound, controlled speech cancellation, and mobile-safe layout.

**Architecture:** Keep `adventure.js` pure and extend theme metadata there. Keep `index.html` responsible for DOM, CSS, Web Audio, Web Speech, and animation orchestration. Add static Node tests around theme completeness, HUD layers, speech cancellation, and animation/audio entry points, then verify the local page in the in-app browser.

**Tech Stack:** Plain HTML/CSS/JavaScript, Web Audio API, Web Speech API, Web Animations API, Node built-in test runner, Browser plugin for localhost verification.

---

## File Structure

- Modify `adventure.js`: add per-family scene metadata used by HUD rendering and tests.
- Modify `index.html`: replace the simple adventure HUD with layered mini-world DOM/CSS, upgrade `renderAdventureHud()`, add Ultra animation helper functions, and add missing sound hooks.
- Modify `tests/adventure.test.js`: require scene metadata and sound key metadata for all five families.
- Modify `tests/index-adventure-flow.test.js`: add static regression tests for layered HUD, family scene classes, audio calls, and speech cancellation.
- Modify `docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md`: append a dated Ultra map verification section after browser testing.

---

### Task 1: Extend Pure Theme Metadata

**Files:**
- Modify: `adventure.js`
- Modify: `tests/adventure.test.js`

- [ ] **Step 1: Add failing metadata assertions**

In `tests/adventure.test.js`, extend the existing `themes cover every vehicle family with required non-text gameplay fields` test by adding these assertions inside the `for (const id of ids)` loop:

```js
    assert.ok(t.sceneClass && t.sceneClass.startsWith('adv-scene-'), `missing sceneClass for ${id}`);
    assert.ok(Array.isArray(t.landmarks) && t.landmarks.length >= 2, `missing landmarks for ${id}`);
    assert.ok(t.routeStyle, `missing routeStyle for ${id}`);
    assert.ok(t.powerLabel, `missing powerLabel for ${id}`);
    assert.ok(t.sounds && t.sounds.charge, `missing charge sound key for ${id}`);
    assert.ok(t.sounds && t.sounds.dash, `missing dash sound key for ${id}`);
    assert.ok(t.sounds && t.sounds.impact, `missing impact sound key for ${id}`);
    assert.ok(t.sounds && t.sounds.arena, `missing arena sound key for ${id}`);
    assert.ok(t.sounds && t.sounds.finisher, `missing finisher sound key for ${id}`);
```

- [ ] **Step 2: Run metadata test and verify failure**

Run:

```bash
node --test tests/adventure.test.js
```

Expected: FAIL because current theme objects do not define `sceneClass`, `landmarks`, `routeStyle`, `powerLabel`, or `sounds`.

- [ ] **Step 3: Add metadata to each theme**

Update each `THEMES.<family>` object in `adventure.js` with this exact shape, adapting the values per family:

```js
    sceneClass: 'adv-scene-police',
    landmarks: ['city-a', 'city-b', 'roadblock'],
    routeStyle: 'city-chase',
    powerLabel: '警灯能量',
    sounds: {
      charge: 'police-charge',
      dash: 'police-dash',
      impact: 'police-impact',
      arena: 'police-arena',
      finisher: 'police-finisher'
    },
```

Use these family-specific values:

```js
// police
sceneClass: 'adv-scene-police',
landmarks: ['city-a', 'city-b', 'roadblock'],
routeStyle: 'city-chase',
powerLabel: '警灯能量',
sounds: { charge:'police-charge', dash:'police-dash', impact:'police-impact', arena:'police-arena', finisher:'police-finisher' }

// ambulance
sceneClass: 'adv-scene-ambulance',
landmarks: ['hospital', 'medical-cross', 'green-lane'],
routeStyle: 'rescue-lane',
powerLabel: '急救能量',
sounds: { charge:'ambulance-charge', dash:'ambulance-dash', impact:'ambulance-impact', arena:'ambulance-arena', finisher:'ambulance-finisher' }

// fire
sceneClass: 'adv-scene-fire',
landmarks: ['building-fire', 'hydrant', 'water-arc'],
routeStyle: 'fire-rescue',
powerLabel: '水柱能量',
sounds: { charge:'fire-charge', dash:'fire-dash', impact:'fire-impact', arena:'fire-arena', finisher:'fire-finisher' }

// everyday
sceneClass: 'adv-scene-everyday',
landmarks: ['bus-stop', 'crosswalk', 'traffic-sign'],
routeStyle: 'station-road',
powerLabel: '到站能量',
sounds: { charge:'everyday-charge', dash:'everyday-dash', impact:'everyday-impact', arena:'everyday-arena', finisher:'everyday-finisher' }

// adventure
sceneClass: 'adv-scene-adventure',
landmarks: ['star-gate', 'meteor-a', 'orbit-line'],
routeStyle: 'space-orbit',
powerLabel: '发射能量',
sounds: { charge:'adventure-charge', dash:'adventure-dash', impact:'adventure-impact', arena:'adventure-arena', finisher:'adventure-finisher' }
```

- [ ] **Step 4: Run metadata test and verify pass**

Run:

```bash
node --test tests/adventure.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit metadata**

Run:

```bash
git add adventure.js tests/adventure.test.js
git commit -m "feat: add ultra adventure theme metadata"
```

---

### Task 2: Replace HUD Markup With Layered Mini-World

**Files:**
- Modify: `index.html`
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add failing static HUD structure test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('adventure HUD has layered mini-world structure', () => {
  const hudMarkup = between('<div class="adventure-hud" id="adventure-hud"', '\n    <div class="quiz-body">');
  assert.match(hudMarkup, /id="adventure-scene"/);
  assert.match(hudMarkup, /id="adventure-sky"/);
  assert.match(hudMarkup, /id="adventure-landmarks"/);
  assert.match(hudMarkup, /id="adventure-route"/);
  assert.match(hudMarkup, /id="adventure-effects"/);
  assert.match(hudMarkup, /id="adventure-power"/);
  assert.match(hudMarkup, /id="adventure-power-fill"/);
  assert.match(hudMarkup, /id="adventure-vehicle"/);
  assert.match(hudMarkup, /id="adventure-boss"/);
});
```

- [ ] **Step 2: Run static HUD test and verify failure**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL because current HUD markup only has `adventure-map`, `adventure-vehicle`, `adventure-boss`, and `adventure-track`.

- [ ] **Step 3: Replace the adventure HUD markup**

In `index.html`, replace the current `#adventure-hud` block with:

```html
    <div class="adventure-hud" id="adventure-hud" aria-live="polite">
      <div class="adventure-scene adv-scene-adventure" id="adventure-scene">
        <div class="adventure-sky" id="adventure-sky"></div>
        <div class="adventure-landmarks" id="adventure-landmarks" aria-hidden="true"></div>
        <div class="adventure-route" id="adventure-route">
          <span class="adv-route-beam" id="adv-route-beam"></span>
          <span class="adv-dot" data-step="0">1</span>
          <span class="adv-dot" data-step="1">2</span>
          <span class="adv-dot" data-step="2">3</span>
          <span class="adv-dot" data-step="3">4</span>
          <span class="adv-dot boss-dot" data-step="4">5</span>
        </div>
        <span class="adventure-vehicle" id="adventure-vehicle">🚀</span>
        <span class="adventure-boss" id="adventure-boss">☄️</span>
        <div class="adventure-effects" id="adventure-effects" aria-hidden="true"></div>
        <div class="adventure-power" id="adventure-power" aria-hidden="true">
          <span class="adventure-power-fill" id="adventure-power-fill"></span>
        </div>
      </div>
      <div class="adventure-title" id="adventure-title">太空探险</div>
    </div>
```

- [ ] **Step 4: Run static HUD test and verify pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit HUD markup**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: add layered adventure hud"
```

---

### Task 3: Add Ultra HUD CSS and Responsive Rules

**Files:**
- Modify: `index.html`
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add failing CSS coverage test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('adventure HUD defines ultra scene classes and mobile safety rules', () => {
  const styleBlock = between('<style>', '\n  </style>');
  ['police', 'ambulance', 'fire', 'everyday', 'adventure'].forEach(family => {
    assert.match(styleBlock, new RegExp(`\\.adv-scene-${family}`), `missing CSS for ${family}`);
  });
  assert.match(styleBlock, /\.adventure-route/);
  assert.match(styleBlock, /\.adv-route-beam/);
  assert.match(styleBlock, /\.adventure-effects/);
  assert.match(styleBlock, /\.adventure-power-fill/);
  assert.match(styleBlock, /@media \(max-width: 420px\)[\s\S]*\.adventure-scene/);
  assert.match(styleBlock, /@media \(prefers-reduced-motion: reduce\)/);
});
```

- [ ] **Step 2: Run static CSS test and verify failure**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL because the new classes are not defined yet.

- [ ] **Step 3: Replace the old adventure HUD CSS**

In the `<style>` block of `index.html`, replace the current `.adventure-hud` through `.adv-spark` rules with a layered version. Include these selectors and behaviors:

```css
    .adventure-hud {
      width: 100%;
      background: rgba(255,255,255,0.94);
      border: 3px solid rgba(76,175,80,0.18);
      border-radius: 20px;
      padding: 10px 12px 12px;
      box-shadow: 0 8px 22px rgba(0,0,0,0.12);
      margin-bottom: 10px;
      overflow: hidden;
    }
    .adventure-scene {
      position: relative;
      height: 132px;
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(180deg, #38bdf8 0%, #bfdbfe 42%, #22c55e 43%, #047857 100%);
      box-shadow: inset 0 -34px 36px rgba(0,0,0,0.20);
      isolation: isolate;
    }
    .adventure-sky,
    .adventure-landmarks,
    .adventure-route,
    .adventure-effects {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .adventure-landmark {
      position: absolute;
      bottom: 42px;
      width: 36px;
      height: 58px;
      border-radius: 8px 8px 0 0;
      background: rgba(51,65,85,0.92);
      box-shadow: inset 0 0 0 2px rgba(255,255,255,0.16), 0 8px 14px rgba(0,0,0,0.22);
    }
    .adventure-landmark::before {
      content: "";
      position: absolute;
      inset: 9px 7px;
      background: repeating-linear-gradient(180deg, #fde68a 0 6px, transparent 6px 14px);
    }
    .adventure-route {
      z-index: 2;
    }
    .adv-route-beam {
      position: absolute;
      left: 8%;
      right: 10%;
      top: 72%;
      height: 10px;
      border-radius: 999px;
      transform: rotate(-8deg);
      background: linear-gradient(90deg, #22c55e, #facc15 48%, #fb923c 72%, #ef4444);
      box-shadow: 0 0 18px rgba(250,204,21,0.82);
    }
    .adv-dot {
      position: absolute;
      z-index: 4;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: radial-gradient(circle, #fff7ad, #f59e0b);
      color: #7c2d12;
      font-weight: 1000;
      font-size: 0.9rem;
      box-shadow: 0 0 0 4px rgba(255,255,255,0.44), 0 0 22px rgba(250,204,21,0.78);
    }
    .adv-dot[data-step="0"] { left: 7%; top: 70%; }
    .adv-dot[data-step="1"] { left: 27%; top: 54%; }
    .adv-dot[data-step="2"] { left: 47%; top: 65%; }
    .adv-dot[data-step="3"] { left: 66%; top: 46%; }
    .adv-dot[data-step="4"] { left: 84%; top: 62%; }
    .adv-dot.done { background: radial-gradient(circle, #dcfce7, #22c55e); color: #064e3b; }
    .adv-dot.active { transform: scale(1.15); outline: 4px solid rgba(255,255,255,0.62); }
    .adv-dot.boss-dot { background: radial-gradient(circle, #fecaca, #ef4444); color: #fff; }
    .adventure-vehicle,
    .adventure-boss {
      position: absolute;
      z-index: 6;
      line-height: 1;
      filter: drop-shadow(0 8px 10px rgba(0,0,0,0.35));
    }
    .adventure-vehicle {
      left: 7%;
      top: 50%;
      font-size: 48px;
      transform: translate(-50%, -50%);
    }
    .adventure-boss {
      right: 6%;
      top: 40%;
      font-size: 50px;
      transform: translate(50%, -50%);
    }
    .adventure-power {
      position: absolute;
      z-index: 5;
      left: 18px;
      right: 18px;
      bottom: 10px;
      height: 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.38);
      overflow: hidden;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.18);
    }
    .adventure-power-fill {
      display: block;
      width: 0%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #22c55e, #fde047, #fb923c, #ef4444);
      box-shadow: 0 0 18px rgba(250,204,21,0.90);
      transition: width 0.55s cubic-bezier(.34,1.56,.64,1);
    }
    .adv-scene-police {
      background: radial-gradient(circle at 82% 16%, rgba(255,236,104,0.92), transparent 15%), linear-gradient(180deg, #38bdf8 0%, #bfdbfe 42%, #334155 43%, #111827 100%);
    }
    .adv-scene-ambulance {
      background: radial-gradient(circle at 20% 18%, rgba(187,247,208,0.92), transparent 16%), linear-gradient(180deg, #bae6fd 0%, #e0f2fe 42%, #10b981 43%, #047857 100%);
    }
    .adv-scene-fire {
      background: radial-gradient(circle at 80% 32%, rgba(251,146,60,0.82), transparent 18%), linear-gradient(180deg, #fef3c7 0%, #fed7aa 42%, #7f1d1d 43%, #1f2937 100%);
    }
    .adv-scene-everyday {
      background: radial-gradient(circle at 76% 18%, rgba(254,240,138,0.95), transparent 15%), linear-gradient(180deg, #93c5fd 0%, #dbeafe 42%, #22c55e 43%, #166534 100%);
    }
    .adv-scene-adventure {
      background: radial-gradient(circle at 72% 28%, rgba(168,85,247,0.70), transparent 22%), radial-gradient(circle at 20% 16%, rgba(34,211,238,0.60), transparent 16%), linear-gradient(180deg, #0f172a 0%, #1e1b4b 58%, #312e81 100%);
    }
```

Keep existing `.adv-boss-entrance` and `.adv-finisher` CSS for the full-screen overlays; later tasks can enhance their timing without replacing them.

- [ ] **Step 4: Add mobile and reduced-motion CSS**

In the existing `@media (max-width: 420px)` block, replace the old adventure mini rules with:

```css
      .adventure-hud { padding: 8px 9px 9px; margin-bottom: 8px; border-radius: 16px; }
      .adventure-scene { height: 86px; border-radius: 14px; }
      .adventure-landmark { width: 26px; height: 40px; bottom: 34px; }
      .adventure-vehicle { font-size: 34px; }
      .adventure-boss { font-size: 36px; }
      .adv-dot { width: 24px; height: 24px; font-size: 0.78rem; box-shadow: 0 0 0 3px rgba(255,255,255,0.42), 0 0 16px rgba(250,204,21,0.70); }
      .adventure-power { left: 12px; right: 12px; bottom: 7px; height: 9px; }
      .adventure-title { font-size: 0.82rem; margin-top: 4px; }
```

Add a new reduced-motion block near the other media rules:

```css
    @media (prefers-reduced-motion: reduce) {
      .adventure-scene,
      .adventure-vehicle,
      .adventure-boss,
      .adv-dot,
      .adv-spark,
      .adv-speed-line,
      .adv-shockwave {
        animation: none !important;
      }
    }
```

- [ ] **Step 5: Run CSS test and verify pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit CSS**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: style ultra adventure map"
```

---

### Task 4: Render Theme Mini-Worlds From State

**Files:**
- Modify: `index.html`
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add failing render regression test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('renderAdventureHud applies scene class, landmarks, route progress, and power width', () => {
  const renderBlock = between('function renderAdventureHud() {', '\n}\n\nfunction generateQuestion');
  assert.match(renderBlock, /theme\.sceneClass/);
  assert.match(renderBlock, /adventure-scene/);
  assert.match(renderBlock, /adventure-landmarks/);
  assert.match(renderBlock, /adventure-power-fill/);
  assert.match(renderBlock, /theme\.landmarks\.forEach/);
  assert.match(renderBlock, /dot\.style\.setProperty\('--step-progress'/);
  assert.match(renderBlock, /powerFill\.style\.width/);
});
```

- [ ] **Step 2: Run render test and verify failure**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL because current `renderAdventureHud()` only sets emoji, title, dot classes, and vehicle `left`.

- [ ] **Step 3: Replace `renderAdventureHud()`**

Replace the function body with:

```js
function renderAdventureHud() {
  if (!window.Adventure || !adventureRun) return;
  const theme = Adventure.getTheme(adventureRun.family);
  const e = currentPlayer ? equippedEmojis(currentPlayer) : { vehicle: theme.targetEmoji, dino: '🦕' };
  const scene = $('adventure-scene');
  const landmarks = $('adventure-landmarks');
  const vehicle = $('adventure-vehicle');
  const boss = $('adventure-boss');
  const powerFill = $('adventure-power-fill');

  scene.className = `adventure-scene ${theme.sceneClass || 'adv-scene-adventure'}`;
  scene.dataset.routeStyle = theme.routeStyle || 'space-orbit';
  scene.classList.toggle('boss-arena', !!adventureRun.bossShown && !adventureRun.completed);
  vehicle.textContent = e.vehicle;
  boss.textContent = theme.bossEmoji;
  $('adventure-title').textContent = theme.name;

  landmarks.innerHTML = '';
  theme.landmarks.forEach((name, i) => {
    const mark = document.createElement('span');
    mark.className = `adventure-landmark landmark-${name}`;
    mark.style.left = `${10 + i * 28}%`;
    mark.style.height = `${42 + (i % 3) * 12}px`;
    landmarks.appendChild(mark);
  });

  document.querySelectorAll('.adv-dot').forEach((dot, i) => {
    dot.classList.toggle('done', i < adventureRun.step);
    dot.classList.toggle('active', i === Math.min(adventureRun.step, 4) && !adventureRun.completed);
    dot.classList.toggle('boss-ready', i === 4 && adventureRun.bossShown && !adventureRun.completed);
    dot.style.setProperty('--step-progress', i < adventureRun.step ? '1' : '0');
  });

  const positions = [
    { left: 7, top: 62 },
    { left: 27, top: 49 },
    { left: 47, top: 58 },
    { left: 66, top: 42 },
    { left: 84, top: 55 }
  ];
  const pos = positions[Math.min(adventureRun.step, positions.length - 1)];
  vehicle.style.left = pos.left + '%';
  vehicle.style.top = pos.top + '%';
  const power = Math.min(100, adventureRun.step * 22 + (adventureRun.bossShown ? 12 : 0));
  powerFill.style.width = power + '%';
}
```

- [ ] **Step 4: Run render test and verify pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit render logic**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: render themed adventure mini-worlds"
```

---

### Task 5: Add Charge, Impact, Speed, and Shockwave Effects

**Files:**
- Modify: `index.html`
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add failing animation helper test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('ultra adventure animation helpers exist and are used by answer flow', () => {
  const animationBlock = between('function showAdventureStep', '\n}\n\nfunction showBossFinisher');
  assert.match(animationBlock, /playAdventureCharge/);
  assert.match(animationBlock, /playAdventureImpact/);
  assert.match(animationBlock, /createAdventureBurst/);
  assert.match(animationBlock, /createSpeedLines/);
  assert.match(animationBlock, /createShockwave/);
  assert.match(animationBlock, /adventure-power-fill/);
  assert.match(animationBlock, /Promise\.allSettled/);
});
```

- [ ] **Step 2: Run animation helper test and verify failure**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL because current `showAdventureStep()` only creates sparks and shakes the scene.

- [ ] **Step 3: Add helper functions before `showAdventureStep()`**

Insert these helpers above `function showAdventureStep`:

```js
function createAdventureBurst(container, count, className) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const node = document.createElement('span');
    node.className = className || 'adv-spark';
    node.style.setProperty('--spark-x', `${18 + Math.random() * 68}%`);
    node.style.setProperty('--spark-y', `${18 + Math.random() * 62}%`);
    container.appendChild(node);
    nodes.push(node);
  }
  return nodes;
}

function createSpeedLines(container, count) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const node = document.createElement('span');
    node.className = 'adv-speed-line';
    node.style.top = `${16 + Math.random() * 64}%`;
    node.style.animationDelay = `${i * 18}ms`;
    container.appendChild(node);
    nodes.push(node);
  }
  return nodes;
}

function createShockwave(container, left, top) {
  const node = document.createElement('span');
  node.className = 'adv-shockwave';
  node.style.left = left;
  node.style.top = top;
  container.appendChild(node);
  return node;
}
```

- [ ] **Step 4: Add CSS for the helper nodes**

Add these CSS rules near the adventure HUD styles:

```css
    .adv-spark,
    .adv-speed-line,
    .adv-shockwave {
      position: absolute;
      pointer-events: none;
      z-index: 8;
    }
    .adv-spark {
      left: var(--spark-x, 50%);
      top: var(--spark-y, 50%);
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #fff7ad;
      box-shadow: 0 0 18px #fde047, 0 0 30px #fb923c;
      transform: translate(-50%, -50%);
    }
    .adv-speed-line {
      left: -30%;
      width: 44%;
      height: 4px;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), rgba(250,204,21,0.9));
      box-shadow: 0 0 12px rgba(250,204,21,0.78);
    }
    .adv-shockwave {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.82);
      box-shadow: 0 0 24px rgba(250,204,21,0.85);
      transform: translate(-50%, -50%);
    }
    .adventure-scene.ultra-hit {
      animation: advUltraShake 0.62s cubic-bezier(.36,.07,.19,.97);
    }
    @keyframes advUltraShake {
      0%,100% { transform: translate(0,0) rotate(0); }
      15% { transform: translate(3px,-2px) rotate(.35deg); }
      30% { transform: translate(-4px,2px) rotate(-.42deg); }
      48% { transform: translate(4px,1px) rotate(.34deg); }
      68% { transform: translate(-2px,-2px) rotate(-.24deg); }
    }
```

- [ ] **Step 5: Replace `showAdventureStep()` internals**

Keep the function signature. Replace the current non-reduced-motion body with this sequence:

```js
  const scene = $('adventure-scene');
  const effects = $('adventure-effects');
  const vehicle = $('adventure-vehicle');
  const powerFill = $('adventure-power-fill');
  if (!scene || !effects || !vehicle || !powerFill) {
    setTimeout(finish, 0);
    return;
  }

  const tempNodes = [];
  let fallback = null;
  const cleanup = onceDone(() => {
    clearTimeout(fallback);
    scene.classList.remove('ultra-hit');
    tempNodes.forEach(node => node.remove());
    finish();
  });

  try {
    playAdventureCharge(theme.id, streak);
    const chargeAnim = powerFill.animate([
      { filter: 'brightness(1)', transform: 'scaleX(1)' },
      { filter: 'brightness(1.8)', transform: 'scaleX(1.04)', offset: 0.56 },
      { filter: 'brightness(1)', transform: 'scaleX(1)' }
    ], { duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)' }).finished;

    const speedLines = createSpeedLines(effects, Math.min(14, 7 + Math.max(1, streak || 1)));
    tempNodes.push(...speedLines);
    const lineAnims = speedLines.map((line, i) => line.animate([
      { transform: 'translateX(0) skewX(-20deg)', opacity: 0 },
      { transform: 'translateX(92vw) skewX(-20deg)', opacity: 1, offset: 0.22 },
      { transform: 'translateX(122vw) skewX(-20deg)', opacity: 0 }
    ], { duration: 520, delay: i * 22, easing: 'linear', fill: 'forwards' }).finished);

    const vehicleAnim = vehicle.animate([
      { transform: 'translate(-50%, -50%) scale(1) rotate(-5deg)', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.35))' },
      { transform: 'translate(-78%, -42%) scale(0.92) rotate(-13deg)', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.75))', offset: 0.18 },
      { transform: 'translate(-12%, -78%) scale(1.42) rotate(14deg)', filter: 'drop-shadow(0 0 30px rgba(250,204,21,0.95))', offset: 0.48 },
      { transform: 'translate(-44%, -36%) scale(1.13) rotate(-6deg)', filter: 'drop-shadow(0 0 22px rgba(34,197,94,0.75))', offset: 0.72 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.35))' }
    ], { duration: 980, easing: 'cubic-bezier(.16,1,.3,1)' }).finished;

    setTimeout(() => {
      playAdventureImpact(theme.id, streak);
      scene.classList.add('ultra-hit');
      const shock = createShockwave(effects, '58%', '52%');
      tempNodes.push(shock);
      shock.animate([
        { transform: 'translate(-50%, -50%) scale(.2)', opacity: .95 },
        { transform: 'translate(-50%, -50%) scale(4.2)', opacity: 0 }
      ], { duration: 740, easing: 'ease-out', fill: 'forwards' });
      const sparks = createAdventureBurst(effects, Math.min(30, 14 + Math.max(1, streak || 1) * 3), 'adv-spark');
      tempNodes.push(...sparks);
      sparks.forEach((spark, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 42 + Math.random() * 76;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        spark.animate([
          { transform: 'translate(-50%, -50%) scale(.2)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1, offset: .2 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
        ], { duration: 720 + Math.random() * 300, delay: i * 14, easing: 'cubic-bezier(.22,.72,.15,1)', fill: 'forwards' });
      });
    }, 430);

    fallback = setTimeout(cleanup, 1450);
    Promise.allSettled([chargeAnim, vehicleAnim].concat(lineAnims)).then(() => setTimeout(cleanup, 220)).catch(cleanup);
  } catch (e) {
    cleanup();
  }
```

- [ ] **Step 6: Run animation helper test and verify pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit animation helpers**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: add ultra adventure answer effects"
```

---

### Task 6: Add Missing Sound Hooks

**Files:**
- Modify: `index.html`
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add failing sound coverage test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('ultra adventure audio has charge, impact, boss, and reward hooks', () => {
  const audioBlock = between('// ── 音效 ──', '// ── 全屏飞车动效');
  assert.match(audioBlock, /function playAdventureCharge/);
  assert.match(audioBlock, /function playAdventureImpact/);
  assert.match(audioBlock, /function playAdventureBoost/);
  assert.match(audioBlock, /function playBossEntranceSound/);
  assert.match(audioBlock, /function playBossHitSound/);
  assert.match(audioBlock, /function playBossDefeatSound/);
  assert.match(audioBlock, /function playRewardRain/);
  assert.match(audioBlock, /try \{/);
});
```

- [ ] **Step 2: Run sound coverage test and verify failure**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL because `playAdventureCharge` and `playAdventureImpact` do not exist yet.

- [ ] **Step 3: Add charge and impact sound functions**

Add these functions near `playAdventureBoost`:

```js
function playAdventureCharge(family, streak) {
  try {
    const s = Math.max(1, Math.min(5, streak || 1));
    playTone(360 + s * 70, 'sine', 0.10, 0.07 + s * 0.012);
    playTone(520 + s * 90, 'triangle', 0.16, 0.06 + s * 0.012, 0.08);
    if (family === 'fire') playNoiseBurst(0.12, 0.045, 0.04);
    if (family === 'adventure') playTone(160 + s * 45, 'sawtooth', 0.22, 0.05, 0.03);
  } catch (e) {}
}

function playAdventureImpact(family, streak) {
  try {
    const s = Math.max(1, Math.min(5, streak || 1));
    playTone(180 - s * 10, 'sawtooth', 0.16, 0.12);
    playTone(760 + s * 60, 'square', 0.08, 0.08, 0.04);
    playNoiseBurst(0.18 + s * 0.02, 0.08 + s * 0.01, 0.02);
    if (family === 'ambulance') playTone(940, 'sine', 0.14, 0.06, 0.12);
    if (family === 'everyday') playEverydayHorn();
  } catch (e) {}
}
```

- [ ] **Step 4: Make boost family-aware**

Update `playAdventureBoost(family, streak)` so the existing tone burst remains, and add:

```js
  if (family === 'police') playTone(920, 'square', 0.10, 0.06, 0.14);
  if (family === 'ambulance') playTone(700, 'sine', 0.16, 0.05, 0.10);
  if (family === 'fire') playNoiseBurst(0.18, 0.07, 0.08);
  if (family === 'adventure') playTone(1180, 'sawtooth', 0.18, 0.055, 0.10);
```

- [ ] **Step 5: Run sound coverage test and verify pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit sound hooks**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: add ultra adventure sound hooks"
```

---

### Task 7: Upgrade Boss Arena and Finisher Intensity

**Files:**
- Modify: `index.html`
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add failing boss arena test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('boss entrance and finisher use arena classes and synchronized sounds', () => {
  const bossEntrance = between('function showBossEntrance', '\n}\n\nfunction showAdventureIntro');
  assert.match(bossEntrance, /boss-arena/);
  assert.match(bossEntrance, /playBossEntranceSound\(theme\.id\)/);
  assert.match(bossEntrance, /adv-boss-arena-ring/);

  const finisher = between('function showBossFinisher', '\n}\n\nfunction speakQuestionWithAdventure');
  assert.match(finisher, /playBossHitSound\(theme\.id\)/);
  assert.match(finisher, /playBossDefeatSound\(theme\.id\)/);
  assert.match(finisher, /playRewardRain\(\)/);
  assert.match(finisher, /adv-finisher-burst/);
});
```

- [ ] **Step 2: Run boss test and verify failure**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: FAIL because the entrance overlay does not yet include `adv-boss-arena-ring`, and finisher does not include `adv-finisher-burst`.

- [ ] **Step 3: Enhance boss entrance markup**

In `showBossEntrance()`, before building the overlay, add:

```js
    const scene = $('adventure-scene');
    if (scene) scene.classList.add('boss-arena');
```

Replace the overlay `innerHTML` with:

```js
    overlay.innerHTML = `
      <div class="adv-boss-arena-ring"></div>
      <div class="adv-boss-card" style="border-color:${theme.fallbackColor || '#ffd600'}">
        <span class="adv-boss-emoji">${theme.bossEmoji}</span>
        <div class="adv-boss-name">${theme.bossName}</div>
      </div>`;
```

- [ ] **Step 4: Enhance finisher markup**

In `showBossFinisher()`, replace the overlay `innerHTML` with:

```js
    overlay.innerHTML = `
      <span class="adv-finisher-burst"></span>
      <span class="adv-finisher-vehicle">${vehicleEmoji}</span>
      <span class="adv-finisher-boss">${theme.bossEmoji}</span>
      <div class="adv-finisher-text">${theme.victoryLine}</div>`;
```

- [ ] **Step 5: Add CSS for arena ring and finisher burst**

Add near the existing boss/finisher CSS:

```css
    .adv-boss-arena-ring {
      position: absolute;
      width: min(70vw, 330px);
      height: min(70vw, 330px);
      border-radius: 50%;
      border: 14px solid rgba(255,255,255,0.18);
      background: conic-gradient(from 0deg, rgba(239,68,68,0.82), rgba(250,204,21,0.72), rgba(59,130,246,0.72), rgba(239,68,68,0.82));
      box-shadow: 0 0 72px rgba(239,68,68,0.70), inset 0 0 44px rgba(250,204,21,0.42);
      animation: advArenaSpin 0.9s linear infinite, advArenaPulse 1.1s ease-in-out infinite;
    }
    .adv-finisher-burst {
      position: absolute;
      left: 50%;
      top: 48%;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 8px solid rgba(255,255,255,0.76);
      box-shadow: 0 0 52px rgba(250,204,21,0.95);
      animation: advFinisherBurst 1.4s ease-out both;
    }
    @keyframes advArenaSpin { to { transform: rotate(360deg); } }
    @keyframes advArenaPulse {
      50% { filter: brightness(1.45); box-shadow: 0 0 96px rgba(239,68,68,0.92), inset 0 0 62px rgba(250,204,21,0.62); }
    }
    @keyframes advFinisherBurst {
      0% { transform: translate(-50%, -50%) scale(.2); opacity: .95; }
      100% { transform: translate(-50%, -50%) scale(6.5); opacity: 0; }
    }
```

- [ ] **Step 6: Run boss test and verify pass**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit boss upgrade**

Run:

```bash
git add index.html tests/index-adventure-flow.test.js
git commit -m "feat: intensify adventure boss arena"
```

---

### Task 8: Verify Speech Cancellation Still Wins

**Files:**
- Modify: `tests/index-adventure-flow.test.js`

- [ ] **Step 1: Add final static speech guard test**

Append this test to `tests/index-adventure-flow.test.js`:

```js
test('ultra answer flow still stops old speech before animation and new speech', () => {
  const submitPrefix = between('function submitAnswer() {', '\n\n  const q       = questions[currentIdx];');
  assert.match(submitPrefix, /if \(currentAnswer === ''\) return;\s+stopSpeech\(\);/);

  const correctAnswerBlock = between('  if (userAns === q.answer) {', '\n  } else {');
  assert.match(correctAnswerBlock, /showAdventureStep/);
  assert.match(correctAnswerBlock, /showBossFinisher/);
  assert.match(correctAnswerBlock, /goNext\(\[line\], false\)/);
  assert.doesNotMatch(correctAnswerBlock, /speak\(line,/);
  assert.doesNotMatch(correctAnswerBlock, /speakQueueAfterCurrent/);

  const questionSpeechBlock = between('function speakQuestionWithAdventure', '\n}\n\nfunction renderQuestion');
  assert.match(questionSpeechBlock, /const epoch = speechEpoch;/);
  assert.match(questionSpeechBlock, /if \(epoch !== speechEpoch\) return;/);
});
```

- [ ] **Step 2: Run speech guard test**

Run:

```bash
node --test tests/index-adventure-flow.test.js
```

Expected: PASS. If it fails, restore the existing `stopSpeech()` ordering and epoch guard before continuing.

- [ ] **Step 3: Commit test-only guard**

Run:

```bash
git add tests/index-adventure-flow.test.js
git commit -m "test: guard ultra adventure speech flow"
```

---

### Task 9: Run Automated Verification

**Files:**
- No source changes unless tests reveal a bug.

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
node --test tests/garage.test.js tests/adventure.test.js tests/index-adventure-flow.test.js
```

Expected: PASS with all tests passing.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Commit any verification fixes**

Only if Step 1 or Step 2 required fixes:

```bash
git add index.html adventure.js tests/adventure.test.js tests/index-adventure-flow.test.js
git commit -m "fix: stabilize ultra adventure map"
```

---

### Task 10: Browser Verification on Local Game

**Files:**
- Modify: `docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md`

- [ ] **Step 1: Open the current game page**

Use the Browser plugin against the user-provided game URL if still valid:

```text
http://localhost:4175/index.html
```

If that server is not running, start a local static server on an available port and open `/index.html`.

- [ ] **Step 2: Verify desktop police flow**

In the browser:

1. Start a new 乐乐 round with the default police vehicle.
2. Confirm the HUD has city/police styling, five numeric dots, vehicle, Boss, and power bar.
3. Stub or observe speech so submitting during narration cancels old speech immediately.
4. Answer one question correctly.
5. Confirm charge, speed lines, vehicle dash, impact particles, shockwave, power gain, and sound hooks fire.
6. Reach question 5.
7. Confirm Boss arena appears once and final finisher runs before result.

Expected: no console errors except possible favicon 404.

- [ ] **Step 3: Verify one non-default family**

Use garage/localStorage setup or UI to equip one non-default family, preferably `rocket` or `fire`.

Expected:

- `rocket` maps to `adventure` and shows space/orbit visual language.
- `fire` maps to `fire` and shows fire/rescue visual language.
- Theme name, Boss emoji, vehicle emoji, and route styling change automatically with equipped vehicle.

- [ ] **Step 4: Verify mobile layout**

Resize browser to a narrow mobile width such as 390x844.

Expected:

- HUD compresses to a film-strip shape.
- Question story, equation, answer display, and numpad remain visible and usable.
- Particles and speed lines do not cover the answer or confirm button long enough to block interaction.

- [ ] **Step 5: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce` if available.

Expected:

- Big shake and large movement are skipped.
- Dots, power, score, coins, Boss/result progression remain correct.
- No JavaScript errors.

- [ ] **Step 6: Update acceptance checklist**

Append this section to `docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md`:

```markdown
## 2026-05-31 Ultra 地图与动效复检

- [ ] 五个 family 都有主题小世界地图，不再只是简单进度条。
- [ ] 答对时旧语音立即停止，不会在动画或下一题中复活。
- [ ] 答对至少出现充能、座驾冲刺、速度线、撞击粒子、冲击波、能量条推进。
- [ ] 每个关键动画都有同步音效，AudioContext 失败不阻塞流程。
- [ ] 第 5 题 Boss 竞技场只大登场一次，终结技接结果页。
- [ ] 移动端地图不遮挡题目、答案和数字键盘。
- [ ] 视觉不依赖文字，孩子能靠数字点、座驾、Boss、颜色、路线、语音理解进度。
- [ ] `node --test tests/garage.test.js tests/adventure.test.js tests/index-adventure-flow.test.js` 通过。
```

- [ ] **Step 7: Commit verification checklist**

Run:

```bash
git add docs/superpowers/plans/2026-05-28-themed-adventure-acceptance-checklist.md
git commit -m "docs: record ultra adventure map verification"
```

---

## Final Verification

- [ ] Run `node --test tests/garage.test.js tests/adventure.test.js tests/index-adventure-flow.test.js`.
- [ ] Run `git diff --check`.
- [ ] Browser-check desktop and mobile layouts.
- [ ] Confirm speech cancellation by answering while narration is still active.
- [ ] Confirm the final worktree only contains intended changes; ignore unrelated `../.DS_Store`.
