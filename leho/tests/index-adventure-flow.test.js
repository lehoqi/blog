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

test('answer submission cancels unfinished question narration before feedback or adventure speech', () => {
  const submitPrefix = between('function submitAnswer() {', '\n\n  const q       = questions[currentIdx];');
  assert.match(submitPrefix, /if \(currentAnswer === ''\) return;\s+stopSpeech\(\);/);
});

test('delayed question narration is cancellable when a child answers quickly', () => {
  const speechBlock = between('// ── 语音朗读 ──', "// ── 动画工具 ──");
  assert.match(speechBlock, /let speechDelayTimer = null;/);
  assert.match(speechBlock, /let speechEpoch = 0;/);
  assert.match(speechBlock, /function scheduleSpeech\(/);
  assert.match(speechBlock, /clearTimeout\(speechDelayTimer\)/);

  const questionSpeechBlock = between('function speakQuestionWithAdventure', '\n}\n\nfunction renderQuestion');
  assert.match(questionSpeechBlock, /scheduleSpeech\(\(\) => speak\(readText, 0\.8\)/);
  assert.doesNotMatch(questionSpeechBlock, /setTimeout\(\(\) => speak\(readText/);
  assert.doesNotMatch(questionSpeechBlock, /setTimeout\(\(\) => queue\(/);
});

test('correct-answer adventure narration starts fresh after the submitted question is stopped', () => {
  const correctAnswerBlock = between('  if (userAns === q.answer) {', '\n  } else {');
  assert.match(correctAnswerBlock, /speakQueue\(\[theme\.victoryLine\], 0\.9\)/);
  assert.match(correctAnswerBlock, /goNext\(\[line\], false\)/);
  assert.doesNotMatch(correctAnswerBlock, /speakQueueAfterCurrent/);
  assert.doesNotMatch(correctAnswerBlock, /speak\(line,/);
});
