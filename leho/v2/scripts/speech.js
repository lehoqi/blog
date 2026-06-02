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
