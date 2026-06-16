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
    '工程车积木工地',
    '🚧',
    '🧱',
    '堵路大砖墙',
    'cartoon-scene-living-room',
    ['roadblock', 'crane', 'tractor', 'brick-wall'],
    'construction-run',
    '工程能量',
    '工程车积木工地开工！听清题目，把路线修出来。',
    ['推土机冲出去啦！', '吊车把积木吊高啦！', '小挖机轰隆隆前进！', '准备撞开堵路大砖墙！'],
    '堵路大砖墙挡住工地！答对这一题，让工程队开路！',
    '工地路线修好啦，工程任务成功！'
  ),
  backyard: makeEpisodeTheme(
    'backyard',
    '后院赛车赛道',
    '🏎️',
    '🛞',
    '乱滚轮胎',
    'cartoon-scene-backyard',
    ['race-car', 'finish-flag', 'traffic-light', 'tire'],
    'race-track',
    '赛车能量',
    '后院赛车赛道点火！听清题目，准备冲过弯道。',
    ['赛车加速啦！', '红绿灯变绿啦！', '冲过小弯道！', '准备超过乱滚轮胎！'],
    '乱滚轮胎冲到赛道上！答对这一题，赛车就能超过它！',
    '赛车冲线啦，赛道任务成功！'
  ),
  park: makeEpisodeTheme(
    'park',
    '恐龙化石探险',
    '🦖',
    '🕳️',
    '大泥坑陷阱',
    'cartoon-scene-park',
    ['dino', 'fossil', 'pickaxe', 'scooter'],
    'dino-trail',
    '探险能量',
    '恐龙化石探险出发！一起数清楚，找到化石路线。',
    ['发现恐龙脚印啦！', '挖出化石碎片啦！', '滑板车冲过草坡！', '准备跳过大泥坑陷阱！'],
    '大泥坑陷阱挡住化石！答对这一题，就能安全跳过去！',
    '恐龙化石找到啦，探险任务成功！'
  ),
  kitchen: makeEpisodeTheme(
    'kitchen',
    '机器人能量站',
    '🤖',
    '⚙️',
    '卡住的大齿轮',
    'cartoon-scene-kitchen',
    ['robot', 'gear', 'battery', 'toolbox'],
    'robot-line',
    '机器人能量',
    '机器人能量站启动！听题补能量，让机器人动起来。',
    ['电池充好啦！', '机器人手臂转起来啦！', '能量块装箱啦！', '准备修好卡住的大齿轮！'],
    '大齿轮卡住啦！答对这一题，机器人就能继续工作！',
    '机器人能量站修好啦，任务成功！'
  ),
  bedroom: makeEpisodeTheme(
    'bedroom',
    '太空火箭基地',
    '🚀',
    '☄️',
    '飞来的陨石',
    'cartoon-scene-bedroom',
    ['rocket', 'planet', 'satellite', 'star'],
    'space-orbit',
    '火箭能量',
    '太空火箭基地倒计时！认真听题，准备发射。',
    ['火箭加燃料啦！', '卫星信号亮起来啦！', '穿过星星轨道！', '准备躲开飞来的陨石！'],
    '飞来的陨石出现了！答对这一题，火箭就能安全闪避！',
    '火箭发射成功，太空任务完成！'
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
