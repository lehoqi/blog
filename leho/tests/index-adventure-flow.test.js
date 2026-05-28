'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function between(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1, `Missing start marker: ${start}`);
  const to = html.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Missing end marker after ${start}: ${end}`);
  return html.slice(from, to);
}

test('wrong-answer recovery cannot bypass adventure settlement', () => {
  const wrongAnswerBlock = between('  } else {\n    wrongCount++;', '\n  }\n}\n\n// B1');
  assert.doesNotMatch(wrongAnswerBlock, /\$\('btn-next-q'\)\.classList\.remove\('hidden'\)/);

  const nextButtonHandler = between("$('btn-next-q').addEventListener('click'", "\n});");
  assert.doesNotMatch(nextButtonHandler, /currentIdx\+\+/);
  assert.doesNotMatch(nextButtonHandler, /showResult\(/);
  assert.doesNotMatch(nextButtonHandler, /renderQuestion\(/);
});

test('result settlement is idempotent before records or coins are saved', () => {
  const showResultBody = between('function showResult() {', '\n}\n\n// ── 结果页 PK');
  const guardIndex = showResultBody.indexOf('if (window.__resultShown) return;');
  assert.notEqual(guardIndex, -1, 'showResult must return when result was already shown');
  assert.ok(guardIndex < showResultBody.indexOf('saveRecord('), 'result guard must run before saveRecord');
  assert.ok(guardIndex < showResultBody.indexOf('Garage.roundCoins('), 'result guard must run before coin settlement');
});

test('final victory narration waits behind the current boss/question queue', () => {
  const correctAnswerBlock = between('  if (userAns === q.answer) {', '\n  } else {');
  assert.match(correctAnswerBlock, /speakQueueAfterCurrent\(\[theme\.victoryLine\], 0\.9\)/);
  assert.doesNotMatch(correctAnswerBlock, /speakQueue\(\[theme\.victoryLine\]/);
  assert.doesNotMatch(correctAnswerBlock, /speak\(line,/);
});
