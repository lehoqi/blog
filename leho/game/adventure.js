'use strict';

function makeEpisodeTheme(id, name, mapEmoji, bossEmoji, bossName, sceneClass, landmarks, routeStyle, powerLabel, intro, steps, bossLine, victory) {
  return {
    id: id,
    name: name,
    mapEmoji: mapEmoji,
    bossEmoji: bossEmoji,
    bossName: bossName,
    targetEmoji: '🐶',
    fallbackColor: '#4aa3df',
    sceneClass: sceneClass,
    landmarks: landmarks,
    routeStyle: routeStyle,
    powerLabel: powerLabel,
    sounds: { charge: 'cartoon-charge', dash: 'cartoon-dash', impact: 'cartoon-impact', arena: 'cartoon-arena', finisher: 'cartoon-finisher' },
    introLines: [intro],
    stepLines: steps,
    bossLine: bossLine,
    victoryLine: victory
  };
}

var THEMES = {
  livingRoom: makeEpisodeTheme(
    'livingRoom',
    '客厅积木游戏',
    '🧸',
    '🧺',
    '乱糟糟玩具篮',
    'cartoon-scene-living-room',
    ['blocks', 'sofa', 'toy-basket'],
    'living-room-path',
    '游戏能量',
    '客厅积木游戏开始！听清楚题目，一起搭高高。',
    ['积木搭高啦！', '玩具跳起来啦！', '沙发城堡快完成啦！', '准备整理玩具篮！'],
    '乱糟糟玩具篮来了！答对这一题，把玩具整理好！',
    '客厅整理好啦，游戏成功！'
  ),
  backyard: makeEpisodeTheme(
    'backyard',
    '后院气球游戏',
    '🎈',
    '🌬️',
    '调皮大风',
    'cartoon-scene-backyard',
    ['balloons', 'picnic', 'kite'],
    'backyard-path',
    '气球能量',
    '后院气球游戏开始！认真听题，气球就不会飞走。',
    ['气球升起来啦！', '草地亮起来啦！', '风筝飞起来啦！', '准备挡住调皮大风！'],
    '调皮大风来了！答对这一题，气球就安全啦！',
    '气球都安全啦，后院游戏成功！'
  ),
  park: makeEpisodeTheme(
    'park',
    '公园小路游戏',
    '🛝',
    '🕳️',
    '小泥坑',
    'cartoon-scene-park',
    ['slide', 'tree', 'scooter'],
    'park-path',
    '公园能量',
    '公园小路出发！一起数清楚。',
    ['滑梯亮起来啦！', '树叶跳舞啦！', '小车滑过去啦！', '准备跨过小泥坑！'],
    '小泥坑挡住路了！答对这一题，就能跨过去！',
    '顺利穿过公园小路！'
  ),
  kitchen: makeEpisodeTheme(
    'kitchen',
    '厨房饼干游戏',
    '🍪',
    '🥣',
    '大面糊碗',
    'cartoon-scene-kitchen',
    ['cookies', 'milk', 'mixing-bowl'],
    'kitchen-path',
    '饼干能量',
    '厨房饼干游戏开始！听听盘子里有多少。',
    ['饼干香起来啦！', '杯子排好队啦！', '盘子转起来啦！', '准备搅好大面糊！'],
    '大面糊碗来了！答对这一题，把饼干做好！',
    '饼干烤好啦，厨房游戏成功！'
  ),
  bedroom: makeEpisodeTheme(
    'bedroom',
    '睡前星星游戏',
    '⭐',
    '🌙',
    '困困月亮',
    'cartoon-scene-bedroom',
    ['stars', 'lamp', 'book'],
    'bedroom-path',
    '星星能量',
    '睡前星星游戏开始！慢慢听，认真算。',
    ['星星贴好啦！', '小灯亮起来啦！', '故事书打开啦！', '准备和困困月亮说晚安！'],
    '困困月亮来了！答对这一题，就能说晚安！',
    '星星都亮啦，晚安游戏成功！'
  )
};

THEMES.police = THEMES.livingRoom;
THEMES.ambulance = THEMES.backyard;
THEMES.fire = THEMES.kitchen;
THEMES.everyday = THEMES.park;
THEMES.adventure = THEMES.bedroom;

function getTheme(family) {
  return THEMES[family] || THEMES.livingRoom;
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
