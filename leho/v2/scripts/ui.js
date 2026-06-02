(function (root) {
  'use strict';

  const PLAYERS = {
    lele: { id: 'lele', name: '乐乐', fallbackDino: '🦕' },
    haohao: { id: 'haohao', name: '昊昊', fallbackDino: '🦖' }
  };

  let state = null;
  let answerText = '';
  let currentPlayerId = 'lele';
  const speech = root.V2Speech.createSpeechController();

  function $(id) { return document.getElementById(id); }

  function setPage(id) {
    document.querySelectorAll('.page').forEach(page => {
      const active = page.id === id;
      page.classList.toggle('active', active);
      page.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function safeGarage(playerId) {
    return root.V2Storage.getPlayerGarage(playerId);
  }

  function renderStage(combo) {
    const stage = $('adventure-stage');
    stage.className = `adventure-stage ${combo.theme.cssClass}`;
    $('stage-vehicle').textContent = `${combo.vehicleEmoji}${combo.dinoEmoji}`;
    $('stage-boss').textContent = combo.theme.bossEmoji;
  }

  function renderQuestion() {
    const q = root.V2GameState.currentQuestion(state);
    if (!q) return;
    $('round-player').textContent = PLAYERS[state.playerId].name;
    $('round-progress').textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
    $('round-score').textContent = `⭐ ${state.score}`;
    $('question-story').textContent = `${q.story}${q.question}`;
    $('question-equation').textContent = q.equationParts.join(' ');
    $('answer-display').textContent = answerText;
    $('feedback-message').textContent = '';
    $('stage-energy-fill').style.width = `${Math.round((state.currentIndex / state.questions.length) * 100)}%`;
    speech.speakQueue([`${q.story}${q.question}`, q.readEquation]);
  }

  function renderResult(settlement) {
    $('result-combo').textContent = $('stage-vehicle').textContent;
    $('result-title').textContent = settlement.score === settlement.total ? '完美通关' : '冒险完成';
    $('result-score').textContent = `${settlement.score} / ${settlement.total}`;
    $('result-stars').textContent = '⭐'.repeat(settlement.stars);
    $('result-coins').textContent = `本局 +${settlement.coins} 🪙`;
    $('result-awards').innerHTML = settlement.newAwards.map(a => {
      const awardClass = a.kind === 'trophy' ? 'award-chip trophy' : 'award-chip medal';
      return `<span class="${awardClass}">${a.icon} ${a.label}</span>`;
    }).join('');
    $('result-highlights').innerHTML = settlement.highlights.map(h => `<span class="highlight-chip">${h}</span>`).join('');
    setPage('page-result');
  }

  function finishRound() {
    const previousRecords = root.V2Storage.recordsForPlayer(state.playerId);
    const garage = root.V2Storage.getPlayerGarage(state.playerId);
    const settlement = root.V2Rewards.calculateRoundSettlement({
      playerId: state.playerId,
      score: state.score,
      total: state.questions.length,
      questions: state.questions,
      correctByIndex: state.correctByIndex,
      tagScores: state.tagScores,
      previousRecords,
      garageEntry: garage
    });
    root.V2Storage.saveRecord(settlement.record);
    root.V2Storage.addCoins(state.playerId, settlement.coins);
    renderResult(settlement);
  }

  function submitCurrentAnswer() {
    const result = root.V2GameState.submitAnswer(state, answerText);
    state = result.state;
    if (result.kind === 'wrong') {
      $('feedback-message').textContent = result.message;
      answerText = '';
      $('answer-display').textContent = '';
      root.V2Motion.applyMotionClass($('app-shell'), 'motion-wrong', root.V2Motion.MOTION_BUDGETS.wrong.maxMs);
      return;
    }
    if (result.kind !== 'correct') return;
    const tier = root.V2Motion.comboTier(result.streak);
    const feedbackClass = root.V2Motion.feedbackClassForQuestion(result.question);
    const motionName = state.currentIndex >= state.questions.length - 1 ? 'finisher' : (tier >= 3 ? 'combo' : 'correct');
    const shell = $('app-shell');
    shell.className = `app-shell combo-tier-${tier} ${feedbackClass}`;
    const duration = root.V2Motion.durationFor(motionName, root.V2Motion.prefersReducedMotion());
    root.V2Motion.applyMotionClass(shell, motionName === 'finisher' ? 'motion-finisher' : 'motion-correct', duration).then(() => {
      shell.classList.remove(feedbackClass);
      state = root.V2GameState.advanceAfterCorrect(state);
      answerText = '';
      if (state.status === 'completed') finishRound();
      else renderQuestion();
    });
  }

  function startRound(playerId) {
    speech.stop();
    currentPlayerId = playerId || currentPlayerId;
    const garage = safeGarage(currentPlayerId);
    const combo = root.V2Themes.comboForGarageEntry(garage, PLAYERS[currentPlayerId].fallbackDino);
    const questions = root.V2Questions.generateRound({ count: 5, family: combo.theme.id });
    state = root.V2GameState.createRound({ playerId: currentPlayerId, family: combo.theme.id, questions });
    answerText = '';
    setPage('page-game');
    renderStage(combo);
    renderQuestion();
  }

  function initNumpad() {
    const pad = $('numpad');
    if (!pad) return;
    pad.innerHTML = '';
    [1,2,3,4,5,6,7,8,9,0].forEach(n => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(n);
      button.dataset.digit = String(n);
      button.addEventListener('click', () => {
        answerText = `${answerText}${n}`.slice(0, 3);
        $('answer-display').textContent = answerText;
      });
      pad.appendChild(button);
    });
  }

  function renderTrophyHall() {
    const hall = $('trophy-hall');
    const groups = [
      { title: '能力奖杯', filter: a => a.kind === 'trophy' },
      { title: '长期勋章', filter: a => a.kind === 'medal' }
    ];
    hall.innerHTML = groups.map(group => {
      const awards = root.V2Rewards.AWARDS.filter(group.filter);
      return `<section class="trophy-group">
        <h3>${group.title}</h3>
        <div class="trophy-grid">
          ${awards.map(a => `<div class="trophy-card ${a.kind}" data-award="${a.id}">
            <span>${a.icon}</span>
            <strong>${a.label}</strong>
          </div>`).join('')}
        </div>
      </section>`;
    }).join('');
  }

  function init() {
    initNumpad();
    $('btn-start').addEventListener('click', () => setPage('page-player'));
    $('player-lele').addEventListener('click', () => startRound('lele'));
    $('player-haohao').addEventListener('click', () => startRound('haohao'));
    $('btn-submit').addEventListener('click', submitCurrentAnswer);
    $('btn-clear').addEventListener('click', () => { answerText = answerText.slice(0, -1); $('answer-display').textContent = answerText; });
    $('btn-toggle-voice').addEventListener('click', () => {
      const muted = speech.toggleMuted();
      $('btn-toggle-voice').textContent = muted ? '🔇' : '🔊';
    });
    $('btn-again').addEventListener('click', () => startRound(currentPlayerId));
    $('btn-open-trophies').addEventListener('click', () => { renderTrophyHall(); setPage('page-trophies'); });
    $('btn-result-trophies').addEventListener('click', () => { renderTrophyHall(); setPage('page-trophies'); });
    $('btn-trophies-back').addEventListener('click', () => setPage('page-home'));
  }

  root.V2UI = { setPage, initNumpad, startRound, renderQuestion, submitCurrentAnswer, renderResult, renderTrophyHall, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
