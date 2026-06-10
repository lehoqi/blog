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

  function renderPlayerSelect() {
    const names = root.V2Storage.loadNames();
    Object.values(PLAYERS).forEach(player => {
      const garage = safeGarage(player.id);
      const combo = root.V2Themes.comboForGarageEntry(garage, player.fallbackDino);
      $(`${player.id}-combo`).textContent = `${combo.vehicleEmoji}${combo.dinoEmoji}`;
      const nameEl = document.querySelector(`#player-${player.id} .player-name`);
      if (nameEl) nameEl.textContent = names[player.id] || player.name;
    });
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

  function renderGarage() {
    const garage = root.V2Storage.getPlayerGarage(currentPlayerId);
    const names = root.V2Storage.loadNames();
    $('garage-player-name').textContent = names[currentPlayerId] || PLAYERS[currentPlayerId].name;
    $('garage-coins').textContent = garage.coins;
    $('garage-grid').innerHTML = root.Garage.CATALOG.map(item => {
      const owned = root.Garage.owns(garage, item.id);
      const equipped = root.Garage.isEquipped(garage, item.id);
      const afford = root.Garage.canAfford(garage, item.id);
      const stateText = equipped ? '正在使用' : (owned ? '点我换上' : `🪙 ${item.price}`);
      const locked = owned ? '' : 'locked';
      const affordClass = !owned && afford ? 'afford' : '';
      return `<button class="garage-cell ${item.kind} ${locked} ${affordClass} ${equipped ? 'equipped' : ''}" type="button" data-item="${item.id}">
        <span class="garage-emoji">${item.emoji}</span>
        <strong>${item.name}</strong>
        <span>${stateText}</span>
      </button>`;
    }).join('');
  }

  function handleGarageCellTap(id) {
    const item = root.Garage.getItem(id);
    if (!item) return;
    const garage = root.V2Storage.getPlayerGarage(currentPlayerId);
    let next = null;
    if (root.Garage.owns(garage, id)) next = root.Garage.equip(garage, id);
    else next = root.Garage.unlock(garage, id);
    if (!next) {
      $('garage-message').textContent = `${item.name}还不能解锁，再赚一些金币吧！`;
      return;
    }
    root.V2Storage.setPlayerGarage(currentPlayerId, next);
    $('garage-message').textContent = `${item.name}准备好了！`;
    renderGarage();
  }

  function openGarage() {
    renderGarage();
    setPage('page-garage');
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
    $('btn-start').addEventListener('click', () => { renderPlayerSelect(); setPage('page-player'); });
    $('player-lele').addEventListener('click', () => startRound('lele'));
    $('player-haohao').addEventListener('click', () => startRound('haohao'));
    $('btn-submit').addEventListener('click', submitCurrentAnswer);
    $('btn-clear').addEventListener('click', () => { answerText = answerText.slice(0, -1); $('answer-display').textContent = answerText; });
    $('btn-toggle-voice').addEventListener('click', () => {
      const muted = speech.toggleMuted();
      $('btn-toggle-voice').textContent = muted ? '🔇' : '🔊';
    });
    $('btn-again').addEventListener('click', () => startRound(currentPlayerId));
    $('btn-open-garage').addEventListener('click', openGarage);
    $('btn-result-garage').addEventListener('click', openGarage);
    $('btn-garage-back').addEventListener('click', () => { renderPlayerSelect(); setPage('page-player'); });
    $('garage-grid').addEventListener('click', event => {
      const cell = event.target.closest('[data-item]');
      if (cell) handleGarageCellTap(cell.dataset.item);
    });
    $('btn-open-trophies').addEventListener('click', () => { renderTrophyHall(); setPage('page-trophies'); });
    $('btn-result-trophies').addEventListener('click', () => { renderTrophyHall(); setPage('page-trophies'); });
    $('btn-trophies-back').addEventListener('click', () => setPage('page-home'));
  }

  root.V2UI = { setPage, initNumpad, renderPlayerSelect, startRound, renderQuestion, submitCurrentAnswer, renderResult, renderTrophyHall, renderGarage, handleGarageCellTap, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
