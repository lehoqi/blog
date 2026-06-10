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

test('layered adventure HUD keeps pre-upgrade selectors compatible', () => {
  const hudMarkup = between('<div class="adventure-hud" id="adventure-hud"', '\n    <div class="quiz-body">');
  const renderHudBody = between('function renderAdventureHud() {', '\n}\n\nfunction generateQuestion');

  if (/\$\('adventure-map'\)/.test(renderHudBody)) {
    assert.match(hudMarkup, /id="adventure-map"/);
  }
  assert.match(hudMarkup, /class="adventure-track" id="adventure-track"/);
});

test('legacy adventure track grid contains only route dots', () => {
  const hudMarkup = between('<div class="adventure-hud" id="adventure-hud"', '\n    <div class="quiz-body">');
  const trackStart = hudMarkup.search(/<div[^>]*class="[^"]*\badventure-track\b[^"]*"[^>]*>/);
  assert.notEqual(trackStart, -1, 'adventure HUD must keep an adventure-track dot container');

  const trackOpen = hudMarkup.slice(trackStart).match(/^<div[^>]*class="[^"]*\badventure-track\b[^"]*"[^>]*>/);
  assert.ok(trackOpen, 'adventure-track container must be a div');

  const trackEnd = hudMarkup.indexOf('</div>', trackStart + trackOpen[0].length);
  assert.notEqual(trackEnd, -1, 'adventure-track container must close before the quiz body');

  const trackMarkup = hudMarkup.slice(trackStart, trackEnd);
  assert.doesNotMatch(trackMarkup, /adv-route-beam/);
  assert.equal((trackMarkup.match(/class="adv-dot/g) || []).length, 5);
});

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

test('ultra adventure CSS is applied by render state and short-height layout', () => {
  const styleBlock = between('<style>', '\n  </style>');
  const shortHeightBlock = between('    @media (max-height: 700px) {', '\n    }\n\n    /* ===== 横屏适配 ===== */');
  assert.match(styleBlock, /@media \(max-height: 700px\)/);
  [
    '.adventure-hud',
    '.adventure-scene',
    '.adventure-landmark',
    '.adventure-vehicle',
    '.adventure-boss',
    '.adv-dot',
    '.adventure-power',
    '.adventure-title'
  ].forEach(selector => {
    assert.match(shortHeightBlock, new RegExp(selector.replace('.', '\\.')), `missing short-height CSS for ${selector}`);
  });

  const renderHudBody = between('function renderAdventureHud() {', '\n}\n\nfunction generateQuestion');
  assert.match(renderHudBody, /theme\.sceneClass/);
  assert.match(renderHudBody, /adventure-power-fill/);
  assert.match(renderHudBody, /powerFill\.style\.width/);
});

test('renderAdventureHud applies scene class, landmarks, route progress, and power width', () => {
  const renderBlock = between('function renderAdventureHud() {', '\n}\n\nfunction generateQuestion');
  assert.match(renderBlock, /theme\.sceneClass/);
  assert.match(renderBlock, /adventure-scene/);
  assert.match(renderBlock, /adventure-landmarks/);
  assert.match(renderBlock, /adventure-power-fill/);
  assert.match(renderBlock, /theme\.landmarks\.forEach/);
  assert.match(renderBlock, /dot\.style\.setProperty\('--step-progress'/);
  assert.match(renderBlock, /powerFill\.style\.width/);
  assert.match(renderBlock, /scene\.dataset\.routeStyle/);
  assert.match(renderBlock, /boss-ready/);
});

test('ultra theme route styles and landmarks have visible family-specific CSS', () => {
  const styleBlock = between('<style>', '\n  </style>');
  const adventureJs = fs.readFileSync(path.join(__dirname, '..', 'adventure.js'), 'utf8');
  const routeStyles = [...adventureJs.matchAll(/routeStyle: '([^']+)'/g)].map(match => match[1]);
  const landmarkNames = [...adventureJs.matchAll(/landmarks: \[([^\]]+)\]/g)]
    .flatMap(match => [...match[1].matchAll(/'([^']+)'/g)].map(nameMatch => nameMatch[1]));

  routeStyles.forEach(routeStyle => {
    assert.match(
      styleBlock,
      new RegExp(`data-route-style="${routeStyle}"[\\s\\S]*\\.adv-route-beam`),
      `missing route CSS for ${routeStyle}`
    );
  });

  landmarkNames.forEach(name => {
    const className = `.landmark-${name}`;
    assert.match(styleBlock, new RegExp(className.replace('.', '\\.')), `missing landmark CSS for ${name}`);
    assert.match(
      styleBlock,
      new RegExp(`${className.replace('.', '\\.')}::after[\\s\\S]*content:`),
      `landmark ${name} needs a non-text visual icon`
    );
  });
});

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

test('question generation uses weighted mixed question types without visible difficulty modes', () => {
  assert.match(html, /<script src="logic\/question-mix\.js"><\/script>/);

  const generationBlock = between('function generateQuestion()', '\nfunction generateQuestions');
  assert.match(generationBlock, /QuestionMix\.chooseQuestionType\(\)/);
  ['basic', 'carryBorrow', 'missing', 'compare', 'twoStep'].forEach(type => {
    assert.match(generationBlock, new RegExp(`case '${type}'`), `missing generator branch for ${type}`);
  });

  const startGameBlock = between('function startGame() {', "\n  const introTheme");
  assert.match(startGameBlock, /roundCorrectByIndex\s*=\s*\{\};/);
  assert.doesNotMatch(html, /id="difficulty/);
});

test('results persist per-question-type stats and ability trophies', () => {
  const saveRecordBlock = between('function saveRecord', '\nfunction clearRecords');
  assert.match(saveRecordBlock, /questionTypeStats/);

  const statsBlock = between('function getPlayerStats', '\n}\n\/\/ ── 车库数据');
  assert.match(statsBlock, /QuestionMix\.aggregateTypeStats\(records\)/);
  assert.match(statsBlock, /typeStats/);

  const correctAnswerBlock = between('  if (userAns === q.answer) {', '\n  } else {');
  assert.match(correctAnswerBlock, /roundCorrectByIndex\[currentIdx\]\s*=\s*true/);

  const showResultBlock = between('function showResult() {', '\n}\n\n// ── 结果页 PK');
  assert.match(showResultBlock, /QuestionMix\.buildRoundTypeStats\(questions, roundCorrectByIndex\)/);

  const medalBlock = between('const ALL_MEDALS = [', '\n];\n\nfunction topTrophiesForPlayer');
  [
    'trophy_streak_round',
    'trophy_carry_borrow',
    'trophy_missing',
    'trophy_compare',
    'trophy_two_step',
    'trophy_mixed_perfect'
  ].forEach(id => assert.match(medalBlock, new RegExp(`id: '${id}'`), `missing trophy ${id}`));
});

test('garage collection medals preserve legacy completion and add expanded completion', () => {
  const medalBlock = between('const ALL_MEDALS = [', '\n];\n\nfunction topTrophiesForPlayer');
  assert.match(
    medalBlock,
    /id: 'garage_master'[\s\S]*label: '车库大师'[\s\S]*ownedVehicleCount >= 11/,
    'garage_master should remain the legacy 11-vehicle completion medal'
  );
  assert.match(
    medalBlock,
    /id: 'mega_garage_master'[\s\S]*icon: '🏁'[\s\S]*label: '超级车库大师'[\s\S]*ownsAllVehicles === true/,
    'mega_garage_master should represent expanded full garage completion'
  );
});

test('player previews surface unlocked trophies as the child-facing reward', () => {
  assert.match(html, /id="lele-preview-trophies"/);
  assert.match(html, /id="haohao-preview-trophies"/);
  assert.match(html, /奖杯与勋章展示柜/);

  const trophyBlock = between('function topTrophiesForPlayer', '\n}\n\n// ── 排行榜');
  assert.match(trophyBlock, /id\.startsWith\('trophy_'\)/);
  assert.match(trophyBlock, /slice\(0, 3\)/);

  const previewBlock = between('function updatePlayerPreview() {', '\n}\n\n// ── 编辑名字');
  assert.match(previewBlock, /topTrophiesForPlayer\(pid\)/);
  assert.match(previewBlock, /preview-trophies/);
});

test('player select preview refreshes equipped avatar after garage changes', () => {
  assert.match(html, /id="lele-preview-avatar"/);
  assert.match(html, /id="haohao-preview-avatar"/);
  assert.match(html, /id="lele-preview-vehicle-tag"/);
  assert.match(html, /id="haohao-preview-vehicle-tag"/);

  const previewBlock = between('function updatePlayerPreview() {', '\n}\n\n// ── 编辑名字');
  assert.match(previewBlock, /\$\(`\$\{pid\}-preview-avatar`\)\.innerHTML\s*=\s*comboAvatar\(pid\)/);
  assert.match(previewBlock, /const vehicleItem = Garage\.getItem\(g\.equippedVehicle\)/);
  assert.match(previewBlock, /\$\(`\$\{pid\}-preview-vehicle-tag`\)\.textContent\s*=/);
});

test('mixed question wording keeps comparison direction aligned with shown equation', () => {
  const compareBlock = between('function generateCompareQuestion()', '\nfunction generateTwoStepQuestion');
  assert.doesNotMatch(compareBlock, /校车比公交车少多少位/);
  assert.match(compareBlock, /公交车比校车多多少位/);
});

test('wrong-answer hint range is not capped to the old 20以内 question set', () => {
  const wrongAnswerBlock = between('  } else {\n    wrongCount++;', '\n  }\n}\n\n// B1');
  assert.doesNotMatch(wrongAnswerBlock, /Math\.min\(20,\s*q\.answer\+3\)/);
  assert.match(wrongAnswerBlock, /answerHintRange\(q\)/);

  const hintBlock = between('function answerHintRange(q) {', '\n}\n\n// ── 提交答案 ──');
  assert.match(hintBlock, /answer \+ 3/);
});

test('correct answer uses a full-screen cinematic rush with combo escalation', () => {
  const styleBlock = between('<style>', '\n  </style>');
  [
    '.adv-cinematic',
    '.adv-cinematic-route',
    '.adv-cinematic-vehicle',
    '.adv-cinematic-afterimage',
    '.adv-cinematic-speed-line',
    '.adv-cinematic-shock',
    '.adv-combo-4'
  ].forEach(selector => {
    assert.match(styleBlock, new RegExp(selector.replace('.', '\\.')), `missing cinematic CSS for ${selector}`);
  });
  assert.match(styleBlock, /@keyframes advCinematicVehicle/);
  assert.match(styleBlock, /@keyframes advCinematicRoute/);
  assert.match(styleBlock, /@keyframes advCinematicShake/);
  assert.match(styleBlock, /advCinematicVehicle 1\.72s/);

  const cinematicBlock = between('function adventureComboTier', '\nfunction showAdventureStep');
  assert.match(cinematicBlock, /function createAdventureCinematicLayer/);
  assert.match(cinematicBlock, /function animateAdventureCinematic/);
  assert.match(cinematicBlock, /adventureComboTier\(streak\)/);
  assert.match(cinematicBlock, /const duration = 1680 \+ comboTier \* 150/);
  assert.match(cinematicBlock, /theme\.sceneClass/);
  assert.match(cinematicBlock, /theme\.routeStyle/);
  assert.match(cinematicBlock, /adv-cinematic-afterimage/);
  assert.match(cinematicBlock, /adv-cinematic-speed-line/);

  const animationBlock = between('function showAdventureStep', '\n}\n\nfunction showBossFinisher');
  assert.match(animationBlock, /const comboTier = adventureComboTier\(streak\)/);
  assert.match(animationBlock, /const cinematic = createAdventureCinematicLayer\(theme, vehicleEmoji, step, streak\)/);
  assert.match(animationBlock, /animateAdventureCinematic\(cinematic, theme, vehicleFace, travelPitch, streak\)/);
  assert.match(animationBlock, /playAdventureCinematicSound\(theme\.id, streak\)/);
  assert.match(animationBlock, /playAdventureComboSurge\(theme\.id, streak\)/);
  assert.match(animationBlock, /fallback = setTimeout\(cleanup, 3000\)/);
});

test('adventure map has persistent motion but reduced-motion disables it', () => {
  const styleBlock = between('<style>', '\n  </style>');
  assert.match(styleBlock, /\.adventure-scene::before/);
  assert.match(styleBlock, /\.adventure-sky/);
  assert.match(styleBlock, /\.adventure-landmark::after/);
  assert.match(styleBlock, /\.adv-route-beam/);
  assert.match(styleBlock, /\.adventure-boss/);
  assert.match(styleBlock, /@keyframes advSkyDrift/);
  assert.match(styleBlock, /@keyframes advRoutePulse/);
  assert.match(styleBlock, /@keyframes advLandmarkBlink/);
  assert.match(styleBlock, /@keyframes advBossBreathe/);

  const reducedMotionBlock = between('@media (prefers-reduced-motion: reduce)', '\n    }\n\n    @media (max-width: 360px)');
  ['.adv-cinematic', '.adventure-sky', '.adventure-landmark::after', '.adv-route-beam'].forEach(selector => {
    assert.match(reducedMotionBlock, new RegExp(selector.replace('.', '\\.')), `reduced-motion must disable ${selector}`);
  });
});

test('ultra adventure waits for burst effects before cleanup', () => {
  const animationBlock = between('function showAdventureStep', '\n}\n\nfunction showBossFinisher');
  assert.match(animationBlock, /const\s+effectAnims\s*=\s*\[\]/);
  assert.match(animationBlock, /const\s+shockAnim\s*=\s*shock\.animate\([\s\S]*?effectAnims\.push\(shockAnim\.finished\.catch\(\(\) => \{\}\)\)/);
  assert.match(animationBlock, /const\s+sparkAnim\s*=\s*spark\.animate\([\s\S]*?effectAnims\.push\(sparkAnim\.finished\.catch\(\(\) => \{\}\)\)/);
  assert.match(animationBlock, /Promise\.allSettled\(\[chargeAnim,\s*vehicleAnim\]\.concat\(lineAnims,\s*effectAnims\)\)/);
});

test('ultra vehicle rush follows route pose and faces forward', () => {
  const helperBlock = between('const ADVENTURE_VEHICLE_POSES', '\nfunction renderAdventureHud');
  assert.match(helperBlock, /function adventureVehiclePose\(step\)/);
  assert.match(helperBlock, /function adventureVehicleFace\(theme\)/);
  assert.match(helperBlock, /function adventureVehicleTransform\(theme, scale = 1, pitch = 0\)/);
  assert.match(helperBlock, /scaleX\(\$\{face\}\)/);

  const renderBlock = between('function renderAdventureHud() {', '\n}\n\nfunction generateQuestion');
  assert.match(renderBlock, /const pos = adventureVehiclePose\(adventureRun\.step\)/);
  assert.match(renderBlock, /vehicle\.style\.transform = adventureVehicleTransform\(theme\)/);

  const animationBlock = between('function showAdventureStep', '\n}\n\nfunction showBossFinisher');
  assert.match(animationBlock, /const startPose = adventureVehiclePose\(step\)/);
  assert.match(animationBlock, /const endPose = adventureVehiclePose\(step \+ 1\)/);
  assert.match(animationBlock, /const vehicleFace = adventureVehicleFace\(theme\)/);
  assert.ok(animationBlock.includes('left: `${startPose.left}%`'), 'vehicle animation must start from current route point');
  assert.ok(animationBlock.includes('top: `${startPose.top}%`'), 'vehicle animation must start from current route point');
  assert.ok(animationBlock.includes('left: `${endPose.left}%`'), 'vehicle animation must end at next route point');
  assert.ok(animationBlock.includes('top: `${endPose.top}%`'), 'vehicle animation must end at next route point');
  assert.doesNotMatch(animationBlock, /translate\(-12%, -78%\)/, 'vehicle should not use old in-place jump transform');
});

test('ultra adventure audio has charge, impact, boss, and reward hooks', () => {
  const audioBlock = between('// ── 音效 ──', '// ── 全屏飞车动效');
  assert.match(audioBlock, /function playAdventureCharge/);
  assert.match(audioBlock, /function playAdventureImpact/);
  assert.match(audioBlock, /function playAdventureBoost/);
  assert.match(audioBlock, /function playAdventureCinematicSound/);
  assert.match(audioBlock, /function playAdventureComboSurge/);
  assert.match(audioBlock, /function playBossEntranceSound/);
  assert.match(audioBlock, /function playBossHitSound/);
  assert.match(audioBlock, /function playBossDefeatSound/);
  assert.match(audioBlock, /function playRewardRain/);
  assert.match(audioBlock, /try \{/);

  const cinematicSoundBlock = between('function playAdventureCinematicSound', '\n}\n\nfunction playAdventureComboSurge');
  assert.match(cinematicSoundBlock, /playNoiseBurst\(0\.42/);
  assert.match(cinematicSoundBlock, /playTone\(260 \+ s \* 45/);
  assert.match(cinematicSoundBlock, /playTone\(900 \+ s \* 80/);
  assert.match(cinematicSoundBlock, /playAdventureWhoosh\(\)/);
});

test('animation audio resumes Web Audio before scheduling sounds', () => {
  const audioBlock = between('// ── 音效 ──', '// ── 全屏飞车动效');
  assert.equal((audioBlock.match(/function getAudioCtx\(/g) || []).length, 1, 'audio context helper should not be shadowed');
  assert.match(audioBlock, /function withAudioCtx\(schedule\)/);
  assert.match(audioBlock, /ctx\.state === 'suspended'/);
  assert.match(audioBlock, /ctx\.resume\(\)\.then\(\(\) => schedule\(ctx\)\)/);
  assert.match(audioBlock, /function bindAudioUnlock\(\)/);
  assert.match(audioBlock, /document\.addEventListener\('pointerdown', unlockAudio/);
  assert.match(audioBlock, /document\.addEventListener\('keydown', unlockAudio/);

  [
    'playTone',
    'playPoliceSiren',
    'playFireBell',
    'playEverydayHorn',
    'playAdventureWhoosh',
    'playAmbulanceSiren',
    'playNoiseBurst'
  ].forEach(fnName => {
    const fnBlock = between(`function ${fnName}`, '\n}\n');
    assert.match(fnBlock, /withAudioCtx\(ctx =>/, `${fnName} must schedule after audio resume`);
  });
});

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
  assert.match(finisher, /adv-finisher-route/);
  assert.match(finisher, /adv-finisher-flash/);
  assert.match(finisher, /adv-finisher-star/);
  assert.match(finisher, /createFinisherStars/);
  assert.match(finisher, /fallback = setTimeout\(cleanup, 3600\)/);
  assert.match(finisher, /duration: 3100/);
  assert.match(finisher, /playAdventureCinematicSound\(theme\.id, streak\)/);
  assert.match(finisher, /playAdventureComboSurge\(theme\.id, streak\)/);
});

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

test('result-page speech is cancellable when a new round starts quickly', () => {
  const showResultBody = between('function showResult() {', '\n}\n\n// ── 结果页 PK');
  assert.match(showResultBody, /const resultSpeechEpoch = speechEpoch;/);
  assert.match(showResultBody, /scheduleSpeech\(\(\) => speakQueue\(\[resultRead, Garage\.vResultCoins/);
  assert.doesNotMatch(showResultBody, /setTimeout\(\(\) => speakQueue\(\[resultRead/);

  const startGamePrefix = between('function startGame() {', '\n  questions');
  assert.match(startGamePrefix, /stopSpeech\(\);/);
});

test('delayed speech uses cancellable scheduler instead of raw timers', () => {
  assert.doesNotMatch(html, /setTimeout\(\(\) => speak(?:Queue)?\(/);
  const celebrateBlock = between('function showCelebrate(cb) {', '\n}\n\n// ── 游戏状态');
  const leaderboardBlock = between('function openLeaderboard() {', "\n}\n\n$('btn-settings-home')");
  assert.match(celebrateBlock, /scheduleSpeech\(\(\) => speak\(spokenText, 1\.0\), 400/);
  assert.match(leaderboardBlock, /scheduleSpeech\(\(\) => speak\(txt, 0\.9\), 400/);
});
