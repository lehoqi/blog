'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpeechPlan = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const QUESTION_PROMPT = '请听题。';
  const QUESTION_PAUSE_MS = 750;

  function pause(ms) {
    const value = Math.max(0, Math.floor(Number(ms) || QUESTION_PAUSE_MS));
    return { type: 'pause', pauseMs: value };
  }

  function question(readText, options) {
    const text = String(readText || '').trim();
    if (!text) return [];
    const pauseMs = options && Object.prototype.hasOwnProperty.call(options, 'pauseMs')
      ? options.pauseMs
      : QUESTION_PAUSE_MS;
    return [QUESTION_PROMPT, pause(pauseMs), text];
  }

  function appendQuestion(prefixLines, readText, options) {
    const prefix = Array.isArray(prefixLines) ? prefixLines.filter(Boolean) : [];
    return prefix.concat(question(readText, options));
  }

  function normalizeItems(lines, rate) {
    if (!Array.isArray(lines)) return [];
    return lines.reduce(function (items, item) {
      if (!item) return items;
      if (typeof item === 'object' && Number.isFinite(Number(item.pauseMs))) {
        items.push({ type: 'pause', pauseMs: Math.max(0, Math.floor(Number(item.pauseMs))) });
        return items;
      }
      items.push({ text: String(item), rate: rate });
      return items;
    }, []);
  }

  return {
    QUESTION_PROMPT,
    QUESTION_PAUSE_MS,
    pause,
    question,
    appendQuestion,
    normalizeItems
  };
});
