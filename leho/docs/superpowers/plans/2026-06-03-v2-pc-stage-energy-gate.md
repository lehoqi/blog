# V2 PC Stage Energy Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished PC-only left-stage experience where the answer number becomes an energy key, opens a themed gate, triggers precise animation/SFX feedback, and ends with a Boss shield finisher.

**Architecture:** Keep gameplay rules in existing state modules, and add focused stage/audio modules under `v2/scripts`. `ui.js` becomes the orchestration layer: it passes answer geometry, theme, combo tier, and final-question state into `StageEffects`, while `AudioController` keeps speech and SFX state separate.

**Tech Stack:** Plain HTML/CSS/JavaScript, Node built-in test runner, Web Audio API with dependency-injected schedulers for tests, existing V2 modules and browser verification through localhost.

---

## File Map

- Create `v2/scripts/audio-controller.js`: single UI-facing audio coordinator; voice mute and SFX mute stay independent.
- Create `v2/scripts/sfx.js`: short Web Audio SFX functions and a testable scheduler.
- Create `v2/scripts/stage-effects.js`: render/update stage layers and play correct/wrong/Boss animation timelines.
- Create `v2/styles/stage.css`: PC stage structure, themed gate, Boss shield, HUD, answer key layers.
- Create `v2/styles/stage-motion.css`: keyframes and motion state classes for answer launch, gate unlock, pass-through, wrong bounce, combo, Boss shield break.
- Create `v2/tests/audio-sfx.test.js`: unit tests for independent voice/SFX controls and SFX scheduling.
- Create `v2/tests/stage-effects.test.js`: unit tests for stage rendering and timeline contracts with a fake DOM.
- Modify `v2/index.html`: load new CSS/JS and expand the left stage DOM.
- Modify `v2/scripts/themes.js`: add gate/SFX theme fields without changing vehicle-family mapping.
- Modify `v2/scripts/ui.js`: replace direct `speech` orchestration with `AudioController` and `StageEffects`.
- Modify `v2/tests/static-ui.test.js`: static regression checks for new stage DOM, CSS links, script links, and UI wiring.
- Modify `v2/tests/themes.test.js`: require new theme fields for every vehicle family.

## Task 1: Audio Controller And SFX Contract

**Files:**
- Create: `v2/scripts/audio-controller.js`
- Create: `v2/scripts/sfx.js`
- Create: `v2/tests/audio-sfx.test.js`
- Modify: `v2/index.html`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Write failing audio/SFX tests**

Add `v2/tests/audio-sfx.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const AudioController = require('../scripts/audio-controller.js');
const Sfx = require('../scripts/sfx.js');

function createSpeechFake() {
  return {
    muted: false,
    spoken: [],
    stopped: 0,
    speakQueue(lines) { this.spoken.push(lines); },
    stop() { this.stopped += 1; },
    setMuted(next) { this.muted = !!next; },
    isMuted() { return this.muted; },
    toggleMuted() { this.setMuted(!this.muted); return this.muted; }
  };
}

test('voice mute does not mute sfx', () => {
  const speech = createSpeechFake();
  const sfx = Sfx.createSfx({ schedule: () => true });
  const audio = AudioController.createAudioController({ speech, sfx, now: () => 1000 });

  assert.equal(audio.isVoiceMuted(), false);
  assert.equal(audio.isSfxMuted(), false);

  audio.toggleVoiceMuted();

  assert.equal(audio.isVoiceMuted(), true);
  assert.equal(audio.isSfxMuted(), false);
  assert.equal(audio.playSfx('playGateUnlock', 'adventure'), true);
});

test('sfx mute does not mute voice', () => {
  const speech = createSpeechFake();
  const sfx = Sfx.createSfx({ schedule: () => true });
  const audio = AudioController.createAudioController({ speech, sfx, now: () => 1000 });

  audio.toggleSfxMuted();
  audio.speakQueue(['一道题']);

  assert.equal(audio.isSfxMuted(), true);
  assert.equal(audio.isVoiceMuted(), false);
  assert.deepEqual(speech.spoken, [['一道题']]);
  assert.equal(audio.playSfx('playNumberLaunch', 'police'), false);
});

test('audio controller ducks sfx while speech is active', () => {
  const scheduled = [];
  const speech = createSpeechFake();
  const sfx = Sfx.createSfx({ schedule: spec => { scheduled.push(spec); return true; } });
  let currentNow = 1000;
  const audio = AudioController.createAudioController({ speech, sfx, now: () => currentNow });

  audio.speakQueue(['很长的一句题目朗读']);
  audio.playSfx('playGatePass', 'fire');
  currentNow += 8000;
  audio.playSfx('playGatePass', 'fire');

  assert.equal(scheduled.length, 2);
  assert.equal(scheduled[0].volumeScale, 0.45);
  assert.equal(scheduled[1].volumeScale, 1);
});

test('sfx exposes every design sound hook and schedules theme-aware short specs', () => {
  const scheduled = [];
  const sfx = Sfx.createSfx({ schedule: spec => { scheduled.push(spec); return true; } });
  const names = [
    'playNumberLaunch',
    'playGateUnlock',
    'playGatePass',
    'playNodeLight',
    'playSoftLocked',
    'playComboCharge',
    'playBossShield',
    'playShieldBreak',
    'playFinalGate',
    'playVictoryBurst'
  ];

  names.forEach(name => assert.equal(typeof sfx[name], 'function', name));
  names.forEach(name => assert.equal(sfx[name]('adventure', { comboTier: 4 }), true));

  assert.equal(scheduled.length, names.length);
  scheduled.forEach(spec => {
    assert.equal(spec.theme, 'adventure');
    assert.ok(spec.durationMs > 0 && spec.durationMs <= 450, spec.name);
    assert.ok(spec.volumeScale > 0 && spec.volumeScale <= 1, spec.name);
    assert.ok(Array.isArray(spec.tones) && spec.tones.length >= 1, spec.name);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test v2/tests/audio-sfx.test.js
```

Expected: FAIL with `Cannot find module '../scripts/audio-controller.js'`.

- [ ] **Step 3: Implement `v2/scripts/sfx.js`**

Create `v2/scripts/sfx.js`:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.V2Sfx = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PROFILES = {
    police: { base: 520, wave: 'square', color: 'siren' },
    ambulance: { base: 440, wave: 'sine', color: 'soft' },
    fire: { base: 330, wave: 'sawtooth', color: 'water' },
    everyday: { base: 392, wave: 'triangle', color: 'signal' },
    adventure: { base: 660, wave: 'sine', color: 'space' }
  };

  const SOUND_SHAPES = {
    playNumberLaunch: { ratio: [1, 1.25], durationMs: 180, gain: 0.22 },
    playGateUnlock: { ratio: [1, 1.5, 2], durationMs: 260, gain: 0.24 },
    playGatePass: { ratio: [0.75, 1, 1.6], durationMs: 360, gain: 0.2 },
    playNodeLight: { ratio: [1.5, 2], durationMs: 170, gain: 0.18 },
    playSoftLocked: { ratio: [0.8, 0.68], durationMs: 220, gain: 0.14 },
    playComboCharge: { ratio: [1, 1.4, 1.8], durationMs: 330, gain: 0.24 },
    playBossShield: { ratio: [0.5, 0.75], durationMs: 320, gain: 0.18 },
    playShieldBreak: { ratio: [1.8, 1.2, 0.7], durationMs: 420, gain: 0.25 },
    playFinalGate: { ratio: [1, 1.33, 1.66, 2.25], durationMs: 450, gain: 0.28 },
    playVictoryBurst: { ratio: [1.25, 1.5, 2, 2.5], durationMs: 430, gain: 0.26 }
  };

  function themeProfile(theme) {
    return PROFILES[theme] || PROFILES.adventure;
  }

  function soundSpec(name, theme, options = {}) {
    const shape = SOUND_SHAPES[name] || SOUND_SHAPES.playNodeLight;
    const profile = themeProfile(theme);
    const comboBoost = Math.max(1, Math.min(5, Number(options.comboTier) || 1));
    const gain = Math.min(0.34, shape.gain + (comboBoost - 1) * 0.018);
    return {
      name,
      theme: profile === PROFILES.adventure && theme !== 'adventure' ? 'adventure' : (theme || 'adventure'),
      wave: profile.wave,
      color: profile.color,
      durationMs: shape.durationMs,
      gain,
      volumeScale: Math.max(0, Math.min(1, Number(options.volumeScale) || 1)),
      tones: shape.ratio.map((ratio, index) => ({
        frequency: Math.round(profile.base * ratio),
        offsetMs: Math.round(index * shape.durationMs / Math.max(2, shape.ratio.length + 1))
      }))
    };
  }

  function scheduleWithWebAudio(spec) {
    if (typeof window === 'undefined') return false;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    if (!scheduleWithWebAudio.ctx) scheduleWithWebAudio.ctx = new Ctor();
    const ctx = scheduleWithWebAudio.ctx;
    const start = ctx.currentTime;
    spec.tones.forEach(tone => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = spec.wave;
      oscillator.frequency.value = tone.frequency;
      gain.gain.setValueAtTime(0.0001, start + tone.offsetMs / 1000);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, spec.gain * spec.volumeScale), start + tone.offsetMs / 1000 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.durationMs / 1000);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start + tone.offsetMs / 1000);
      oscillator.stop(start + spec.durationMs / 1000 + 0.04);
    });
    return true;
  }

  function createSfx(options = {}) {
    let muted = false;
    const schedule = options.schedule || scheduleWithWebAudio;

    function play(name, theme, playOptions = {}) {
      if (muted) return false;
      return schedule(soundSpec(name, theme, playOptions));
    }

    const api = {
      isSfxMuted: () => muted,
      setSfxMuted: next => { muted = !!next; },
      toggleSfxMuted: () => { muted = !muted; return muted; },
      play: (name, theme, playOptions) => play(name, theme, playOptions)
    };

    Object.keys(SOUND_SHAPES).forEach(name => {
      api[name] = (theme, playOptions) => play(name, theme, playOptions);
    });

    return api;
  }

  return { createSfx, soundSpec, PROFILES };
});
```

- [ ] **Step 4: Implement `v2/scripts/audio-controller.js`**

Create `v2/scripts/audio-controller.js`:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.V2AudioController = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function estimateSpeechMs(lines) {
    const text = Array.isArray(lines) ? lines.filter(Boolean).join('') : '';
    return Math.max(1200, Math.min(6500, text.length * 180));
  }

  function createAudioController(options = {}) {
    const speech = options.speech;
    const sfx = options.sfx;
    const now = options.now || (() => Date.now());
    let speakingUntil = 0;

    function isSpeaking() {
      return now() < speakingUntil;
    }

    function speakQueue(lines, rate) {
      speakingUntil = now() + estimateSpeechMs(lines);
      if (speech && typeof speech.speakQueue === 'function') speech.speakQueue(lines, rate);
    }

    function stopSpeech() {
      speakingUntil = 0;
      if (speech && typeof speech.stop === 'function') speech.stop();
    }

    function setVoiceMuted(next) {
      if (speech && typeof speech.setMuted === 'function') speech.setMuted(next);
      if (next) speakingUntil = 0;
    }

    function isVoiceMuted() {
      return !!(speech && typeof speech.isMuted === 'function' && speech.isMuted());
    }

    function toggleVoiceMuted() {
      if (!speech || typeof speech.toggleMuted !== 'function') return false;
      const muted = speech.toggleMuted();
      if (muted) speakingUntil = 0;
      return muted;
    }

    function setSfxMuted(next) {
      if (sfx && typeof sfx.setSfxMuted === 'function') sfx.setSfxMuted(next);
    }

    function isSfxMuted() {
      return !!(sfx && typeof sfx.isSfxMuted === 'function' && sfx.isSfxMuted());
    }

    function toggleSfxMuted() {
      return !!(sfx && typeof sfx.toggleSfxMuted === 'function' && sfx.toggleSfxMuted());
    }

    function playSfx(name, theme, playOptions = {}) {
      if (!sfx || typeof sfx[name] !== 'function') return false;
      const volumeScale = playOptions.volumeScale != null ? playOptions.volumeScale : (isSpeaking() ? 0.45 : 1);
      return sfx[name](theme, { ...playOptions, volumeScale });
    }

    return {
      speakQueue,
      stopSpeech,
      setVoiceMuted,
      isVoiceMuted,
      toggleVoiceMuted,
      setSfxMuted,
      isSfxMuted,
      toggleSfxMuted,
      isSpeaking,
      playSfx
    };
  }

  return { createAudioController, estimateSpeechMs };
});
```

- [ ] **Step 5: Link new scripts in `v2/index.html`**

Modify the script list near the bottom of `v2/index.html` so SFX and audio controller load before `ui.js`:

```html
  <script src="scripts/motion.js"></script>
  <script src="scripts/speech.js"></script>
  <script src="scripts/sfx.js"></script>
  <script src="scripts/audio-controller.js"></script>
  <script src="scripts/ui.js"></script>
```

- [ ] **Step 6: Add static script-link regression**

In `v2/tests/static-ui.test.js`, extend the array in `v2 index loads shared legacy logic before v2 modules` to include:

```js
'scripts/sfx.js',
'scripts/audio-controller.js',
```

Add assertions that `sfx.js` is loaded after `speech.js` and before `audio-controller.js`, and that `audio-controller.js` is before `ui.js`:

```js
const speechIndex = html.indexOf('scripts/speech.js');
const sfxIndex = html.indexOf('scripts/sfx.js');
const audioIndex = html.indexOf('scripts/audio-controller.js');
const uiIndex = html.indexOf('scripts/ui.js');
assert.ok(speechIndex < sfxIndex, 'sfx should load after speech');
assert.ok(sfxIndex < audioIndex, 'audio controller should load after sfx');
assert.ok(audioIndex < uiIndex, 'audio controller should load before ui');
```

- [ ] **Step 7: Run tests**

Run:

```bash
node --test v2/tests/audio-sfx.test.js v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add v2/scripts/audio-controller.js v2/scripts/sfx.js v2/tests/audio-sfx.test.js v2/tests/static-ui.test.js v2/index.html
git commit -m "feat: add v2 stage audio controls"
```

## Task 2: Stage DOM And Theme Data

**Files:**
- Modify: `v2/index.html`
- Modify: `v2/scripts/themes.js`
- Modify: `v2/tests/static-ui.test.js`
- Modify: `v2/tests/themes.test.js`

- [ ] **Step 1: Write failing static/theme tests**

In `v2/tests/static-ui.test.js`, add a test:

```js
test('v2 stage exposes energy gate layers', () => {
  const html = read('index.html');
  [
    'stage-background',
    'stage-depth-route',
    'stage-gate',
    'stage-gate-core',
    'stage-gate-label',
    'stage-node-track',
    'stage-answer-layer',
    'stage-effects-layer',
    'stage-vehicle-wrap',
    'stage-boss-wrap',
    'stage-boss-shield',
    'stage-energy-fill'
  ].forEach(id => assert.match(html, new RegExp(`id="${id}"`), id));
});
```

In `v2/tests/themes.test.js`, extend `themes cover every vehicle family with required non-text gameplay fields`:

```js
assert.ok(theme.gateClass, `missing gateClass for ${id}`);
assert.ok(theme.gateLabel, `missing gateLabel for ${id}`);
assert.ok(theme.answerColor, `missing answerColor for ${id}`);
assert.ok(theme.sfxProfile, `missing sfxProfile for ${id}`);
assert.ok(theme.shieldClass, `missing shieldClass for ${id}`);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test v2/tests/static-ui.test.js v2/tests/themes.test.js
```

Expected: FAIL because the new stage ids and theme fields do not exist.

- [ ] **Step 3: Expand the stage DOM**

Replace the current `adventure-stage` contents in `v2/index.html` with:

```html
      <div class="adventure-stage theme-adventure" id="adventure-stage">
        <div class="stage-background" id="stage-background" aria-hidden="true"></div>
        <div class="stage-depth-route" id="stage-depth-route" aria-hidden="true"></div>
        <div class="stage-node-track" id="stage-node-track" aria-label="关卡进度"></div>
        <div class="stage-gate gate-adventure" id="stage-gate" aria-hidden="true">
          <div class="stage-gate-core" id="stage-gate-core"></div>
          <span class="stage-gate-label" id="stage-gate-label">星门</span>
        </div>
        <div class="stage-answer-layer" id="stage-answer-layer" aria-hidden="true"></div>
        <div class="stage-effects-layer" id="stage-effects-layer" aria-hidden="true"></div>
        <span class="stage-vehicle stage-vehicle-wrap" id="stage-vehicle-wrap">
          <span id="stage-vehicle">🚀🦕</span>
        </span>
        <span class="stage-boss stage-boss-wrap" id="stage-boss-wrap">
          <span class="stage-boss-shield" id="stage-boss-shield" aria-hidden="true"></span>
          <span id="stage-boss">☄️</span>
        </span>
        <div class="stage-energy" aria-hidden="true"><span id="stage-energy-fill"></span></div>
      </div>
```

- [ ] **Step 4: Add theme gate fields**

Modify each object in `v2/scripts/themes.js`:

```js
police: {
  id: 'police',
  name: '警车追击',
  cssClass: 'theme-police',
  gateClass: 'gate-police',
  gateLabel: '警灯门',
  answerColor: '#79c7ff',
  shieldClass: 'shield-roadblock',
  sfxProfile: 'police',
  bossEmoji: '🚧',
  bossName: '路障 boss',
  energyLabel: '警灯能量',
  victoryLine: '追击成功！'
},
ambulance: {
  id: 'ambulance',
  name: '急救救援',
  cssClass: 'theme-ambulance',
  gateClass: 'gate-ambulance',
  gateLabel: '急救门',
  answerColor: '#9fffe0',
  shieldClass: 'shield-virus',
  sfxProfile: 'ambulance',
  bossEmoji: '🦠',
  bossName: '病毒云',
  energyLabel: '急救能量',
  victoryLine: '急救成功！'
},
fire: {
  id: 'fire',
  name: '消防救援',
  cssClass: 'theme-fire',
  gateClass: 'gate-fire',
  gateLabel: '水柱门',
  answerColor: '#78d8ff',
  shieldClass: 'shield-flame',
  sfxProfile: 'fire',
  bossEmoji: '🔥',
  bossName: '火焰 boss',
  energyLabel: '水柱能量',
  victoryLine: '火灭啦！'
},
everyday: {
  id: 'everyday',
  name: '日常交通',
  cssClass: 'theme-everyday',
  gateClass: 'gate-everyday',
  gateLabel: '信号门',
  answerColor: '#ffe36d',
  shieldClass: 'shield-traffic',
  sfxProfile: 'everyday',
  bossEmoji: '🚦',
  bossName: '大堵车',
  energyLabel: '到站能量',
  victoryLine: '安全到站！'
},
adventure: {
  id: 'adventure',
  name: '太空冒险',
  cssClass: 'theme-adventure',
  gateClass: 'gate-adventure',
  gateLabel: '星门',
  answerColor: '#c4b5fd',
  shieldClass: 'shield-meteor',
  sfxProfile: 'adventure',
  bossEmoji: '☄️',
  bossName: '大陨石',
  energyLabel: '发射能量',
  victoryLine: '抵达终点！'
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
node --test v2/tests/static-ui.test.js v2/tests/themes.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v2/index.html v2/scripts/themes.js v2/tests/static-ui.test.js v2/tests/themes.test.js
git commit -m "feat: add v2 energy gate stage structure"
```

## Task 3: Stage Effects Module

**Files:**
- Create: `v2/scripts/stage-effects.js`
- Create: `v2/tests/stage-effects.test.js`
- Modify: `v2/index.html`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Write failing stage-effects tests**

Add `v2/tests/stage-effects.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const StageEffects = require('../scripts/stage-effects.js');

function fakeElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    style: {},
    children: [],
    dataset: {},
    className: '',
    classList: {
      values: new Set(),
      add(...names) { names.forEach(name => this.values.add(name)); },
      remove(...names) { names.forEach(name => this.values.delete(name)); },
      toggle(name, force) { force ? this.values.add(name) : this.values.delete(name); },
      contains(name) { return this.values.has(name); }
    },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren(...next) { this.children = next; },
    getBoundingClientRect() { return { left: 300, top: 200, width: 80, height: 40 }; }
  };
}

function fakeDocument() {
  const ids = {};
  const required = [
    'adventure-stage',
    'stage-background',
    'stage-depth-route',
    'stage-node-track',
    'stage-gate',
    'stage-gate-core',
    'stage-gate-label',
    'stage-answer-layer',
    'stage-effects-layer',
    'stage-vehicle-wrap',
    'stage-vehicle',
    'stage-boss-wrap',
    'stage-boss-shield',
    'stage-boss',
    'stage-energy-fill'
  ];
  required.forEach(id => { ids[id] = fakeElement(id); });
  return {
    ids,
    getElementById(id) { return ids[id] || null; },
    createElement(tag) {
      const el = fakeElement(tag);
      el.tagName = tag.toUpperCase();
      return el;
    }
  };
}

const theme = {
  id: 'adventure',
  cssClass: 'theme-adventure',
  gateClass: 'gate-adventure',
  gateLabel: '星门',
  bossEmoji: '☄️',
  shieldClass: 'shield-meteor',
  answerColor: '#c4b5fd',
  sfxProfile: 'adventure'
};

test('renderStage writes theme, gate, nodes, vehicle, boss, and energy', () => {
  const doc = fakeDocument();
  const stage = StageEffects.createStageEffects({ document: doc, reducedMotion: () => false });

  stage.renderStage({ theme, vehicleEmoji: '🚀', dinoEmoji: '🦕', index: 2, total: 5, comboTier: 3, isBoss: false });

  assert.equal(doc.ids['adventure-stage'].className, 'adventure-stage theme-adventure gate-adventure combo-tier-3');
  assert.equal(doc.ids['stage-vehicle'].textContent, '🚀🦕');
  assert.equal(doc.ids['stage-boss'].textContent, '☄️');
  assert.equal(doc.ids['stage-gate-label'].textContent, '星门');
  assert.equal(doc.ids['stage-energy-fill'].style.width, '40%');
  assert.equal(doc.ids['stage-node-track'].children.length, 5);
  assert.equal(doc.ids['stage-node-track'].children[0].dataset.state, 'done');
  assert.equal(doc.ids['stage-node-track'].children[2].dataset.state, 'current');
});

test('playCorrect creates answer key from source rect and schedules sfx', async () => {
  const doc = fakeDocument();
  const calls = [];
  const stage = StageEffects.createStageEffects({
    document: doc,
    reducedMotion: () => false,
    sfx: { playSfx: (...args) => { calls.push(args); return true; } },
    wait: () => Promise.resolve()
  });
  stage.renderStage({ theme, vehicleEmoji: '🚀', dinoEmoji: '🦕', index: 0, total: 5, comboTier: 1, isBoss: false });

  const result = await stage.playCorrect({
    answer: 18,
    theme,
    comboTier: 2,
    isFinal: false,
    sourceRect: { left: 820, top: 350, width: 92, height: 52 }
  });

  assert.equal(result.kind, 'correct');
  assert.ok(result.durationMs >= 900 && result.durationMs <= 1300);
  assert.equal(doc.ids['stage-answer-layer'].children.length, 1);
  assert.equal(doc.ids['stage-answer-layer'].children[0].textContent, '18');
  assert.deepEqual(calls.map(call => call[0]), ['playNumberLaunch', 'playGateUnlock', 'playGatePass', 'playNodeLight']);
});

test('final correct uses boss shield and final gate sounds', async () => {
  const doc = fakeDocument();
  const calls = [];
  const stage = StageEffects.createStageEffects({
    document: doc,
    reducedMotion: () => false,
    sfx: { playSfx: (...args) => { calls.push(args); return true; } },
    wait: () => Promise.resolve()
  });
  stage.renderStage({ theme, vehicleEmoji: '🚀', dinoEmoji: '🦕', index: 4, total: 5, comboTier: 5, isBoss: true });

  const result = await stage.playCorrect({
    answer: 42,
    theme,
    comboTier: 5,
    isFinal: true,
    sourceRect: { left: 820, top: 350, width: 92, height: 52 }
  });

  assert.equal(result.kind, 'final');
  assert.ok(result.durationMs >= 1800 && result.durationMs <= 2200);
  assert.deepEqual(calls.map(call => call[0]), ['playNumberLaunch', 'playShieldBreak', 'playFinalGate', 'playVictoryBurst']);
});

test('playWrong is short and does not play gate unlock', async () => {
  const doc = fakeDocument();
  const calls = [];
  const stage = StageEffects.createStageEffects({
    document: doc,
    reducedMotion: () => false,
    sfx: { playSfx: (...args) => { calls.push(args); return true; } },
    wait: () => Promise.resolve()
  });

  const result = await stage.playWrong({ theme });

  assert.equal(result.kind, 'wrong');
  assert.ok(result.durationMs >= 350 && result.durationMs <= 600);
  assert.deepEqual(calls.map(call => call[0]), ['playSoftLocked']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test v2/tests/stage-effects.test.js
```

Expected: FAIL with `Cannot find module '../scripts/stage-effects.js'`.

- [ ] **Step 3: Implement `v2/scripts/stage-effects.js`**

Create `v2/scripts/stage-effects.js`:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.V2StageEffects = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const NORMAL_MS = 1180;
  const COMBO_MS = 1480;
  const FINAL_MS = 2050;
  const WRONG_MS = 430;
  const REDUCED_MS = 260;

  function rectFrom(input) {
    if (input && input.sourceRect) return input.sourceRect;
    if (input && input.answerElement && typeof input.answerElement.getBoundingClientRect === 'function') {
      return input.answerElement.getBoundingClientRect();
    }
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  function createStageEffects(options = {}) {
    const documentRef = options.document || (typeof document !== 'undefined' ? document : null);
    const reducedMotion = options.reducedMotion || (() => false);
    const wait = options.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const sfx = options.sfx || null;
    let lastTheme = null;

    function $(id) {
      return documentRef && documentRef.getElementById ? documentRef.getElementById(id) : null;
    }

    function playSfx(name, theme, extra) {
      if (sfx && typeof sfx.playSfx === 'function') sfx.playSfx(name, theme.sfxProfile || theme.id, extra);
    }

    function makeNode(index, currentIndex) {
      const node = documentRef.createElement('span');
      node.className = 'stage-node';
      node.dataset.index = String(index);
      node.dataset.state = index < currentIndex ? 'done' : (index === currentIndex ? 'current' : 'locked');
      node.textContent = String(index + 1);
      return node;
    }

    function renderStage(input) {
      const theme = input.theme;
      lastTheme = theme;
      const stage = $('adventure-stage');
      const nodeTrack = $('stage-node-track');
      if (stage) stage.className = `adventure-stage ${theme.cssClass} ${theme.gateClass} combo-tier-${input.comboTier || 1}`;
      if ($('stage-vehicle')) $('stage-vehicle').textContent = `${input.vehicleEmoji}${input.dinoEmoji}`;
      if ($('stage-boss')) $('stage-boss').textContent = theme.bossEmoji;
      if ($('stage-gate-label')) $('stage-gate-label').textContent = theme.gateLabel;
      if ($('stage-energy-fill')) $('stage-energy-fill').style.width = `${Math.round((input.index / input.total) * 100)}%`;
      if ($('stage-boss-wrap')) $('stage-boss-wrap').classList.toggle('is-boss', !!input.isBoss);
      if ($('stage-boss-shield')) $('stage-boss-shield').className = `stage-boss-shield ${theme.shieldClass || ''}`;
      if (nodeTrack && documentRef && typeof documentRef.createElement === 'function') {
        const nodes = Array.from({ length: input.total }, (_, index) => makeNode(index, input.index));
        nodeTrack.replaceChildren(...nodes);
      }
    }

    function addAnswerKey(answer, sourceRect, theme) {
      const layer = $('stage-answer-layer');
      if (!layer || !documentRef || typeof documentRef.createElement !== 'function') return null;
      const key = documentRef.createElement('span');
      key.className = 'stage-answer-key';
      key.textContent = String(answer);
      key.style.setProperty ? key.style.setProperty('--answer-color', theme.answerColor) : (key.style.answerColor = theme.answerColor);
      key.style.left = `${Math.round(sourceRect.left + sourceRect.width / 2)}px`;
      key.style.top = `${Math.round(sourceRect.top + sourceRect.height / 2)}px`;
      layer.appendChild(key);
      return key;
    }

    async function playCorrect(input) {
      const theme = input.theme || lastTheme;
      const final = !!input.isFinal;
      const durationMs = reducedMotion() ? REDUCED_MS : (final ? FINAL_MS : (input.comboTier >= 3 ? COMBO_MS : NORMAL_MS));
      addAnswerKey(input.answer, rectFrom(input), theme);
      const stage = $('adventure-stage');
      if (stage) stage.classList.add(final ? 'stage-motion-final' : 'stage-motion-correct');
      if (final) {
        playSfx('playNumberLaunch', theme, { comboTier: input.comboTier });
        playSfx('playShieldBreak', theme, { comboTier: input.comboTier });
        playSfx('playFinalGate', theme, { comboTier: input.comboTier });
        playSfx('playVictoryBurst', theme, { comboTier: input.comboTier });
      } else {
        playSfx('playNumberLaunch', theme, { comboTier: input.comboTier });
        playSfx('playGateUnlock', theme, { comboTier: input.comboTier });
        playSfx('playGatePass', theme, { comboTier: input.comboTier });
        playSfx('playNodeLight', theme, { comboTier: input.comboTier });
      }
      await wait(durationMs);
      if (stage) stage.classList.remove('stage-motion-correct', 'stage-motion-final');
      return { kind: final ? 'final' : 'correct', durationMs };
    }

    async function playWrong(input = {}) {
      const theme = input.theme || lastTheme;
      const durationMs = reducedMotion() ? REDUCED_MS : WRONG_MS;
      const stage = $('adventure-stage');
      if (stage) stage.classList.add('stage-motion-wrong');
      if (theme) playSfx('playSoftLocked', theme, {});
      await wait(durationMs);
      if (stage) stage.classList.remove('stage-motion-wrong');
      return { kind: 'wrong', durationMs };
    }

    function playBossIntro(input = {}) {
      const theme = input.theme || lastTheme;
      const stage = $('adventure-stage');
      if (stage) stage.classList.add('stage-motion-boss-intro');
      if (theme) playSfx('playBossShield', theme, {});
      return { kind: 'boss-intro', durationMs: reducedMotion() ? REDUCED_MS : 700 };
    }

    function reset() {
      const answerLayer = $('stage-answer-layer');
      const effectsLayer = $('stage-effects-layer');
      if (answerLayer) answerLayer.replaceChildren();
      if (effectsLayer) effectsLayer.replaceChildren();
    }

    return { renderStage, playCorrect, playWrong, playBossIntro, reset };
  }

  return { createStageEffects, rectFrom };
});
```

- [ ] **Step 4: Link script in `v2/index.html`**

Add `stage-effects.js` after `audio-controller.js` and before `ui.js`:

```html
  <script src="scripts/audio-controller.js"></script>
  <script src="scripts/stage-effects.js"></script>
  <script src="scripts/ui.js"></script>
```

- [ ] **Step 5: Add static script regression**

In `v2/tests/static-ui.test.js`, add `'scripts/stage-effects.js'` to the script list and assert ordering:

```js
const stageIndex = html.indexOf('scripts/stage-effects.js');
assert.ok(audioIndex < stageIndex, 'stage effects should load after audio controller');
assert.ok(stageIndex < uiIndex, 'stage effects should load before ui');
```

- [ ] **Step 6: Run tests**

Run:

```bash
node --test v2/tests/stage-effects.test.js v2/tests/static-ui.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add v2/scripts/stage-effects.js v2/tests/stage-effects.test.js v2/index.html v2/tests/static-ui.test.js
git commit -m "feat: add v2 energy gate stage effects"
```

## Task 4: PC Stage Visuals And Motion

**Files:**
- Create: `v2/styles/stage.css`
- Create: `v2/styles/stage-motion.css`
- Modify: `v2/index.html`
- Modify: `v2/styles/arcade.css`
- Modify: `v2/styles/motion.css`
- Modify: `v2/tests/static-ui.test.js`

- [ ] **Step 1: Write failing static CSS tests**

In `v2/tests/static-ui.test.js`, add:

```js
test('energy gate css defines PC stage layers and precision motion', () => {
  const html = read('index.html');
  const stageCss = read('styles/stage.css');
  const stageMotion = read('styles/stage-motion.css');

  assert.match(html, /styles\/stage\.css/);
  assert.match(html, /styles\/stage-motion\.css/);
  assert.match(stageCss, /\.stage-gate/);
  assert.match(stageCss, /\.stage-answer-key/);
  assert.match(stageCss, /\.stage-boss-shield/);
  assert.match(stageCss, /\.gate-police/);
  assert.match(stageCss, /\.gate-ambulance/);
  assert.match(stageCss, /\.gate-fire/);
  assert.match(stageCss, /\.gate-everyday/);
  assert.match(stageCss, /\.gate-adventure/);
  assert.match(stageMotion, /@keyframes v2AnswerKeyToGate/);
  assert.match(stageMotion, /@keyframes v2GateUnlock/);
  assert.match(stageMotion, /@keyframes v2VehicleGatePass/);
  assert.match(stageMotion, /@keyframes v2ShieldBreak/);
  assert.match(stageMotion, /prefers-reduced-motion/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because the new CSS files are not linked and do not exist.

- [ ] **Step 3: Link CSS files**

In `v2/index.html`, add after `themes.css`:

```html
  <link rel="stylesheet" href="styles/stage.css">
  <link rel="stylesheet" href="styles/stage-motion.css">
```

- [ ] **Step 4: Create `v2/styles/stage.css`**

Create the PC-focused stage styles:

```css
.adventure-stage {
  isolation: isolate;
  background: #071426;
  border: 1px solid rgba(255,255,255,.24);
}
.stage-background,
.stage-depth-route,
.stage-gate,
.stage-answer-layer,
.stage-effects-layer,
.stage-vehicle-wrap,
.stage-boss-wrap {
  position: absolute;
  pointer-events: none;
}
.stage-background {
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 68% 18%, rgba(255,255,255,.38), transparent 16%),
    linear-gradient(180deg, rgba(255,255,255,.08), transparent);
}
.stage-depth-route {
  left: -18%;
  right: -18%;
  bottom: -30%;
  z-index: 1;
  height: 58%;
  background:
    linear-gradient(90deg, transparent 47%, rgba(255,255,255,.65) 49% 51%, transparent 53%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.12) 0 1px, transparent 1px 72px),
    linear-gradient(180deg, rgba(255,255,255,.18), rgba(4,12,24,.9));
  transform: perspective(720px) rotateX(62deg);
}
.stage-node-track {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 24px;
  z-index: 7;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.stage-node {
  width: 26px;
  height: 26px;
  justify-self: center;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #061426;
  background: rgba(255,255,255,.45);
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 0 0 rgba(255,255,255,0);
}
.stage-node[data-state="done"],
.stage-node[data-state="current"] {
  background: #ffd45c;
  box-shadow: 0 0 24px rgba(255,212,92,.9);
}
.stage-gate {
  right: 12%;
  top: 17%;
  z-index: 3;
  width: min(30%, 190px);
  aspect-ratio: 1 / 1.25;
  border-radius: 50%;
  display: grid;
  place-items: center;
  transform: rotate(-8deg);
  filter: drop-shadow(0 0 34px rgba(125,211,252,.75));
}
.stage-gate::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: conic-gradient(from 0deg, #38bdf8, #fde047, #f472b6, #38bdf8);
}
.stage-gate-core {
  position: relative;
  z-index: 1;
  width: 68%;
  height: 68%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.24), rgba(4,12,24,.92) 64%);
  box-shadow: inset 0 0 34px rgba(255,255,255,.28);
}
.stage-gate-label {
  position: absolute;
  bottom: -18px;
  z-index: 2;
  color: #e0f2fe;
  font-weight: 900;
  text-shadow: 0 3px 10px rgba(0,0,0,.55);
}
.stage-answer-layer,
.stage-effects-layer {
  inset: 0;
  z-index: 8;
  overflow: visible;
}
.stage-answer-key {
  position: fixed;
  z-index: 100;
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #061426;
  background: var(--answer-color, #fde047);
  font-size: 32px;
  font-weight: 900;
  box-shadow: 0 0 34px color-mix(in srgb, var(--answer-color, #fde047), white 18%);
}
.stage-vehicle-wrap {
  left: 9%;
  bottom: 18%;
  z-index: 5;
}
.stage-boss-wrap {
  right: 13%;
  top: 20%;
  z-index: 4;
}
.stage-boss-shield {
  position: absolute;
  inset: -18px;
  display: none;
  border-radius: 50%;
  border: 7px solid rgba(125,211,252,.85);
  box-shadow: 0 0 42px rgba(125,211,252,.8), inset 0 0 28px rgba(255,255,255,.2);
}
.stage-boss-wrap.is-boss .stage-boss-shield {
  display: block;
}
.gate-police .stage-gate::before { background: conic-gradient(from 0deg, #2f7dff, #ff4b5c, #ffffff, #2f7dff); }
.gate-ambulance .stage-gate::before { background: conic-gradient(from 0deg, #20e3a2, #ffffff, #73fbd3, #20e3a2); }
.gate-fire .stage-gate::before { background: conic-gradient(from 0deg, #38bdf8, #ffffff, #ff7a2f, #38bdf8); }
.gate-everyday .stage-gate::before { background: conic-gradient(from 0deg, #22c55e, #fde047, #38bdf8, #22c55e); }
.gate-adventure .stage-gate::before { background: conic-gradient(from 0deg, #8b5cf6, #38bdf8, #fde047, #8b5cf6); }
```

- [ ] **Step 5: Create `v2/styles/stage-motion.css`**

Create motion states and keyframes:

```css
@keyframes v2AnswerKeyToGate {
  0% { transform: translate(0, 0) scale(.82); opacity: 0; }
  18% { opacity: 1; }
  70% { transform: translate(-34vw, -18vh) scale(1.08); opacity: 1; }
  100% { transform: translate(-42vw, -24vh) scale(.3); opacity: 0; }
}
@keyframes v2GateUnlock {
  0%, 100% { transform: rotate(-8deg) scale(1); filter: drop-shadow(0 0 34px rgba(125,211,252,.75)); }
  45% { transform: rotate(22deg) scale(1.08); filter: drop-shadow(0 0 58px rgba(255,212,92,1)); }
}
@keyframes v2VehicleGatePass {
  0% { transform: translateX(0) translateY(0) scale(1); }
  42% { transform: translateX(20vw) translateY(-3vh) scale(1.12); }
  78% { transform: translateX(36vw) translateY(-7vh) scale(.72); opacity: 1; }
  100% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
}
@keyframes v2WrongGateBump {
  0%, 100% { transform: translateX(0); }
  35% { transform: translateX(-8px); }
  65% { transform: translateX(6px); }
}
@keyframes v2ShieldBreak {
  0% { transform: scale(1); opacity: 1; }
  45% { transform: scale(1.18) rotate(8deg); opacity: .85; }
  100% { transform: scale(1.45) rotate(-14deg); opacity: 0; }
}
.stage-motion-correct .stage-answer-key { animation: v2AnswerKeyToGate 640ms cubic-bezier(.22,1,.36,1) forwards; }
.stage-motion-correct .stage-gate { animation: v2GateUnlock 780ms cubic-bezier(.22,1,.36,1); }
.stage-motion-correct .stage-vehicle-wrap { animation: v2VehicleGatePass 1050ms cubic-bezier(.22,1,.36,1); }
.stage-motion-wrong .stage-gate { animation: v2WrongGateBump 420ms ease-in-out; }
.stage-motion-final .stage-answer-key { animation: v2AnswerKeyToGate 720ms cubic-bezier(.22,1,.36,1) forwards; }
.stage-motion-final .stage-boss-shield { animation: v2ShieldBreak 760ms cubic-bezier(.22,1,.36,1) forwards; }
.stage-motion-final .stage-gate { animation: v2GateUnlock 1100ms cubic-bezier(.22,1,.36,1) 420ms both; }
.stage-motion-final .stage-vehicle-wrap { animation: v2VehicleGatePass 1400ms cubic-bezier(.22,1,.36,1) 520ms both; }
.combo-tier-3 .stage-gate,
.combo-tier-4 .stage-gate,
.combo-tier-5 .stage-gate { filter: drop-shadow(0 0 54px rgba(255,212,92,.9)); }
@media (prefers-reduced-motion: reduce) {
  .stage-answer-key,
  .stage-gate,
  .stage-vehicle-wrap,
  .stage-boss-shield {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 6: Remove duplicate old stage sky visuals from `arcade.css`**

In `v2/styles/arcade.css`, remove or neutralize the old `.stage-sky`, `.stage-sky::after`, `.stage-vehicle`, and `.stage-boss` visual rules that conflict with `stage.css`. Keep layout rules for `.adventure-stage`, `.stage-energy`, `#stage-energy-fill`, and PC grid.

The resulting old-stage block should keep only:

```css
.adventure-stage { position: relative; overflow: hidden; border-radius: 8px; min-height: 110px; box-shadow: var(--shadow), 0 0 42px rgba(27, 140, 255, .22); }
.stage-energy { position: absolute; left: 16px; right: 16px; bottom: 12px; height: 12px; border-radius: 999px; background: rgba(255,255,255,.32); overflow: hidden; z-index: 9; }
#stage-energy-fill { display: block; width: 0%; height: 100%; background: linear-gradient(90deg, #65ff7a, #fff176, #ff8a2a); }
```

- [ ] **Step 7: Run tests and CSS check**

Run:

```bash
node --test v2/tests/static-ui.test.js
git diff --check
```

Expected: PASS and no whitespace errors.

- [ ] **Step 8: Commit**

```bash
git add v2/index.html v2/styles/stage.css v2/styles/stage-motion.css v2/styles/arcade.css v2/tests/static-ui.test.js
git commit -m "feat: style v2 pc energy gate stage"
```

## Task 5: UI Integration With Stage And Audio

**Files:**
- Modify: `v2/scripts/ui.js`
- Modify: `v2/tests/static-ui.test.js`
- Modify: `v2/tests/audio-sfx.test.js`
- Modify: `v2/tests/stage-effects.test.js`

- [ ] **Step 1: Write failing UI wiring static test**

In `v2/tests/static-ui.test.js`, add:

```js
test('ui wires stage effects, answer geometry, and separate audio controls', () => {
  const ui = read('scripts/ui.js');
  assert.match(ui, /V2Sfx\.createSfx/);
  assert.match(ui, /V2AudioController\.createAudioController/);
  assert.match(ui, /V2StageEffects\.createStageEffects/);
  assert.match(ui, /toggleVoiceMuted/);
  assert.doesNotMatch(ui, /toggleSfxMuted\(\).*btn-toggle-voice/s);
  assert.match(ui, /answerElement:\s*\$\('answer-display'\)/);
  assert.match(ui, /playCorrect/);
  assert.match(ui, /playWrong/);
  assert.match(ui, /playBossIntro/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test v2/tests/static-ui.test.js
```

Expected: FAIL because `ui.js` still creates `speech` directly and does not call new modules.

- [ ] **Step 3: Replace direct speech constant in `ui.js`**

Change:

```js
const speech = root.V2Speech.createSpeechController();
```

to:

```js
const speech = root.V2Speech.createSpeechController();
const sfx = root.V2Sfx.createSfx();
const audio = root.V2AudioController.createAudioController({ speech, sfx });
const stageEffects = root.V2StageEffects.createStageEffects({
  document,
  sfx: audio,
  reducedMotion: root.V2Motion.prefersReducedMotion
});
let activeCombo = null;
let bossIntroIndex = -1;
```

- [ ] **Step 4: Replace `renderStage(combo)` implementation**

Replace the existing `renderStage` function with:

```js
function renderStage(combo) {
  if (!state || !combo) return;
  activeCombo = combo;
  const isBoss = state.currentIndex === state.questions.length - 1;
  stageEffects.renderStage({
    theme: combo.theme,
    vehicleEmoji: combo.vehicleEmoji,
    dinoEmoji: combo.dinoEmoji,
    index: state.currentIndex,
    total: state.questions.length,
    comboTier: root.V2Motion.comboTier(state.correctStreak || 1),
    isBoss
  });
  if (isBoss && bossIntroIndex !== state.currentIndex) {
    bossIntroIndex = state.currentIndex;
    stageEffects.playBossIntro({ theme: combo.theme });
  }
}
```

- [ ] **Step 5: Route question speech through `audio` and render stage on every question**

In `renderQuestion()`, replace:

```js
$('stage-energy-fill').style.width = `${Math.round((state.currentIndex / state.questions.length) * 100)}%`;
speech.speakQueue([`${q.story}${q.question}`, q.readEquation]);
```

with:

```js
if (activeCombo) renderStage(activeCombo);
audio.speakQueue([`${q.story}${q.question}`, q.readEquation]);
```

- [ ] **Step 6: Route wrong answer through `StageEffects`**

In `submitCurrentAnswer()`, replace the wrong branch:

```js
root.V2Motion.applyMotionClass($('app-shell'), 'motion-wrong', root.V2Motion.MOTION_BUDGETS.wrong.maxMs);
return;
```

with:

```js
stageEffects.playWrong({
  theme: activeCombo.theme,
  answerElement: $('answer-display')
});
root.V2Motion.applyMotionClass($('app-shell'), 'motion-wrong', root.V2Motion.MOTION_BUDGETS.wrong.maxMs);
return;
```

- [ ] **Step 7: Route correct answer through `StageEffects`**

Replace the correct-answer animation block:

```js
const duration = root.V2Motion.durationFor(motionName, root.V2Motion.prefersReducedMotion());
root.V2Motion.applyMotionClass(shell, motionName === 'finisher' ? 'motion-finisher' : 'motion-correct', duration).then(() => {
  shell.classList.remove(feedbackClass);
  state = root.V2GameState.advanceAfterCorrect(state);
  answerText = '';
  if (state.status === 'completed') finishRound();
  else renderQuestion();
});
```

with:

```js
const duration = root.V2Motion.durationFor(motionName, root.V2Motion.prefersReducedMotion());
const submittedAnswer = answerText;
const isFinal = state.currentIndex >= state.questions.length - 1;
Promise.all([
  root.V2Motion.applyMotionClass(shell, motionName === 'finisher' ? 'motion-finisher' : 'motion-correct', duration),
  stageEffects.playCorrect({
    answer: submittedAnswer,
    theme: activeCombo.theme,
    comboTier: tier,
    isFinal,
    answerElement: $('answer-display')
  })
]).then(() => {
  shell.classList.remove(feedbackClass);
  state = root.V2GameState.advanceAfterCorrect(state);
  answerText = '';
  if (state.status === 'completed') finishRound();
  else renderQuestion();
});
```

- [ ] **Step 8: Reset stage/audio correctly when starting a round**

In `startRound(playerId)`, replace:

```js
speech.stop();
```

with:

```js
audio.stopSpeech();
stageEffects.reset();
bossIntroIndex = -1;
```

Keep the existing `renderStage(combo); renderQuestion();` order after state is created.

- [ ] **Step 9: Keep top button voice-only**

Replace:

```js
const muted = speech.toggleMuted();
$('btn-toggle-voice').textContent = muted ? '🔇' : '🔊';
```

with:

```js
const muted = audio.toggleVoiceMuted();
$('btn-toggle-voice').textContent = muted ? '🔇' : '🔊';
```

Do not call `audio.toggleSfxMuted()` from this button.

- [ ] **Step 10: Run integration tests**

Run:

```bash
node --test v2/tests/*.test.js
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add v2/scripts/ui.js v2/tests/static-ui.test.js
git commit -m "feat: wire v2 energy gate gameplay flow"
```

## Task 6: Verification And PC Browser Dry-Run

**Files:**
- Modify only if verification reveals defects in files touched by Tasks 1-5.

- [ ] **Step 1: Run V2 tests**

Run:

```bash
node --test v2/tests/*.test.js
```

Expected: all V2 tests pass.

- [ ] **Step 2: Run legacy tests**

Run:

```bash
node --test tests/question-mix.test.js tests/garage.test.js tests/adventure.test.js
```

Expected: all legacy tests pass.

- [ ] **Step 3: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 4: Start local server for browser verification**

Run:

```bash
python3 -m http.server 4174
```

Expected: server starts at `http://localhost:4174`. If port `4174` is busy, use `4175` and update the URL below.

- [ ] **Step 5: Browser dry-run at 1280x720**

Open:

```text
http://localhost:4174/v2/index.html
```

Use a 1280x720 viewport. Verify:

- Home start button is clickable.
- Player selection opens and both players are clickable.
- Game page shows the left stage with energy gate, nodes, vehicle, Boss, and energy bar.
- On correct answer, the visible answer number becomes a key and moves toward the gate.
- Gate unlock and vehicle pass-through animation complete before the next question.
- On wrong answer, gate does not open and feedback is soft.
- On final question, Boss shield appears and final correct answer triggers shield break/final gate.
- Toggling the top `🔊/🔇` button stops speech but does not stop SFX.
- Question panel, numpad, and OK button remain visible and unblocked.

- [ ] **Step 6: Inspect browser console**

Expected:

- No JavaScript errors.
- A missing `/favicon.ico` 404 is acceptable and not related to this task.

- [ ] **Step 7: Commit verification fixes if needed**

If browser verification found defects, fix them with narrow patches and commit:

```bash
git add v2
git commit -m "fix: polish v2 energy gate stage"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Digital answer key flight: Task 3 implements `answerElement/sourceRect`; Task 5 passes `answerElement`.
- Energy gate visual: Task 2 adds DOM/theme fields; Task 4 adds CSS/motion.
- Boss shield finisher: Task 2 adds shield DOM/theme class; Task 3 adds final timeline; Task 4 adds shield break motion; Task 5 triggers final state.
- SFX with speech independent mute: Task 1 implements `AudioController` and `Sfx`; Task 5 wires top button as voice-only.
- PC-only focus: Task 4 styles PC stage without creating a mobile-specific redesign; Task 6 verifies 1280x720.
- Reduced motion: Task 3 returns reduced durations; Task 4 includes reduced-motion CSS.
- Tests and browser verification: every implementation task has failing tests first; Task 6 covers full dry-run.

Placeholder scan:

- No placeholder markers or vague implementation-only-later steps are present.
- All new function names used later are defined in earlier tasks.
- Every command includes an expected result.

Type consistency:

- `StageEffects.playCorrect({ answer, theme, comboTier, isFinal, sourceRect, answerElement })` matches the design document.
- `AudioController` keeps `toggleVoiceMuted` separate from `toggleSfxMuted`.
- `Sfx` exposes the ten design sound hooks and a generic `play(name, theme, options)` helper.
