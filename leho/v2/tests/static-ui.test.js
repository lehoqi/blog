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
