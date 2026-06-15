'use strict';

var THEMES = {
  police: {
    id: 'police',
    name: '警车追捕',
    mapEmoji: '🏙️',
    bossEmoji: '🚧',
    bossName: '捣乱车',
    targetEmoji: '🚓',
    fallbackColor: '#1e88e5',
    sceneClass: 'adv-scene-police',
    landmarks: ['city-a', 'city-b', 'roadblock'],
    routeStyle: 'city-chase',
    powerLabel: '警灯能量',
    sounds: { charge: 'police-charge', dash: 'police-dash', impact: 'police-impact', arena: 'police-arena', finisher: 'police-finisher' },
    introLines: ['警车出动！追上捣乱车！'],
    stepLines: ['追近啦！继续加速！', '警灯亮起来！', '快抓住它了！', '准备最后一击！'],
    bossLine: '捣乱车来了！答对这一题，抓住它！',
    victoryLine: '破案成功！太厉害了！'
  },
  ambulance: {
    id: 'ambulance',
    name: '急救救援',
    mapEmoji: '🏥',
    bossEmoji: '🦠',
    bossName: '病毒云',
    targetEmoji: '🚑',
    fallbackColor: '#00a86b',
    sceneClass: 'adv-scene-ambulance',
    landmarks: ['hospital', 'medical-cross', 'green-lane'],
    routeStyle: 'rescue-lane',
    powerLabel: '急救能量',
    sounds: { charge: 'ambulance-charge', dash: 'ambulance-dash', impact: 'ambulance-impact', arena: 'ambulance-arena', finisher: 'ambulance-finisher' },
    introLines: ['救护车出发！把急救能量送到终点！'],
    stepLines: ['急救能量更多啦！', '道路打开啦！', '快到医院啦！', '准备净化病毒云！'],
    bossLine: '病毒云来了！答对这一题，净化它！',
    victoryLine: '急救成功！你是小英雄！'
  },
  fire: {
    id: 'fire',
    name: '消防救援',
    mapEmoji: '🏘️',
    bossEmoji: '🔥',
    bossName: '火焰怪',
    targetEmoji: '🚒',
    fallbackColor: '#f4511e',
    sceneClass: 'adv-scene-fire',
    landmarks: ['building-fire', 'hydrant', 'water-arc'],
    routeStyle: 'fire-rescue',
    powerLabel: '水柱能量',
    sounds: { charge: 'fire-charge', dash: 'fire-dash', impact: 'fire-impact', arena: 'fire-arena', finisher: 'fire-finisher' },
    introLines: ['消防车出动！答对五题，打败火焰怪！'],
    stepLines: ['水管接好啦！', '水柱更强啦！', '火变小啦！', '准备最后灭火！'],
    bossLine: '火焰怪来了！答对这一题，扑灭它！',
    victoryLine: '火灭啦！救援成功！'
  },
  everyday: {
    id: 'everyday',
    name: '安全到站',
    mapEmoji: '🛣️',
    bossEmoji: '🚦',
    bossName: '大堵车',
    targetEmoji: '🚌',
    fallbackColor: '#ffb300',
    sceneClass: 'adv-scene-everyday',
    landmarks: ['bus-stop', 'crosswalk', 'traffic-sign'],
    routeStyle: 'station-road',
    powerLabel: '到站能量',
    sounds: { charge: 'everyday-charge', dash: 'everyday-dash', impact: 'everyday-impact', arena: 'everyday-arena', finisher: 'everyday-finisher' },
    introLines: ['安全出发！答对五题，冲破大堵车！'],
    stepLines: ['第一站到了！', '乘客星星跳起来！', '路障被推开啦！', '准备安全到站！'],
    bossLine: '大堵车来了！答对这一题，冲过去！',
    victoryLine: '安全到站！棒极了！'
  },
  adventure: {
    id: 'adventure',
    name: '太空探险',
    mapEmoji: '🌌',
    bossEmoji: '☄️',
    bossName: '大陨石',
    targetEmoji: '🚀',
    fallbackColor: '#7c4dff',
    sceneClass: 'adv-scene-adventure',
    landmarks: ['star-gate', 'meteor-a', 'orbit-line'],
    routeStyle: 'space-orbit',
    powerLabel: '发射能量',
    sounds: { charge: 'adventure-charge', dash: 'adventure-dash', impact: 'adventure-impact', arena: 'adventure-arena', finisher: 'adventure-finisher' },
    introLines: ['准备发射！答对五题，冲过陨石区！'],
    stepLines: ['火箭加速啦！', '星星轨道亮起来！', '快穿过陨石区啦！', '准备最后发射！'],
    bossLine: '大陨石来了！答对这一题，冲破它！',
    victoryLine: '抵达终点！超厉害！'
  }
};

function getTheme(family) {
  return THEMES[family] || THEMES.adventure;
}

function createRun(family, total) {
  var count = Math.max(1, Math.floor(Number(total) || 5));
  return {
    family: getTheme(family).id,
    step: 0,
    bossShown: false,
    completed: false,
    advancing: false,
    settledQuestions: Array(count).fill(false)
  };
}

function _copyRun(run) {
  return {
    family: getTheme(run && run.family).id,
    step: Math.max(0, Math.floor(Number(run && run.step) || 0)),
    bossShown: !!(run && run.bossShown),
    completed: !!(run && run.completed),
    advancing: !!(run && run.advancing),
    settledQuestions: Array.isArray(run && run.settledQuestions) ? run.settledQuestions.slice() : Array(5).fill(false)
  };
}

function beginSettle(run, questionIndex) {
  var next = _copyRun(run);
  var i = Math.floor(Number(questionIndex) || 0);
  if (next.completed) return { ok: false, reason: 'completed', run: next };
  if (next.settledQuestions[i]) return { ok: false, reason: 'already-settled', run: next };
  if (next.advancing) return { ok: false, reason: 'advancing', run: next };
  next.advancing = true;
  next.settledQuestions[i] = true;
  return { ok: true, run: next };
}

function finishStep(run, questionIndex) {
  var next = _copyRun(run);
  var i = Math.floor(Number(questionIndex) || 0);
  next.step = Math.max(next.step, i + 1);
  next.advancing = false;
  if (i >= next.settledQuestions.length - 1) next.completed = true;
  return next;
}

function shouldShowBoss(run, questionIndex) {
  var next = _copyRun(run);
  var i = Math.floor(Number(questionIndex) || 0);
  return i === next.settledQuestions.length - 1 && !next.bossShown;
}

function markBossShown(run) {
  var next = _copyRun(run);
  next.bossShown = true;
  return next;
}

var Adventure = {
  THEMES: THEMES,
  getTheme: getTheme,
  createRun: createRun,
  beginSettle: beginSettle,
  finishStep: finishStep,
  shouldShowBoss: shouldShowBoss,
  markBossShown: markBossShown
};

if (typeof module !== 'undefined' && module.exports) module.exports = Adventure;
if (typeof window !== 'undefined') window.Adventure = Adventure;
