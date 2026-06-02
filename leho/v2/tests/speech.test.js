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
