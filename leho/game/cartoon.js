'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Cartoon = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CHARACTERS = {
    lele: {
      id: 'lele',
      name: '蓝蓝',
      color: '#4aa3df',
      colorDeep: '#1665a8',
      patch: '#8ed1ff',
      accent: '#ffd166',
      voiceName: '蓝蓝'
    },
    haohao: {
      id: 'haohao',
      name: '橙橙',
      color: '#f5a14a',
      colorDeep: '#c45b1c',
      patch: '#ffd39a',
      accent: '#5fb7e8',
      voiceName: '橙橙'
    }
  };

  const SCENES = {
    livingRoom: {
      id: 'livingRoom',
      title: '客厅积木游戏',
      className: 'cartoon-scene-living-room',
      mapEmoji: '🧸',
      bossEmoji: '🧺',
      bossName: '乱糟糟玩具篮',
      props: ['🧱', '🧸', '🛋️', '🧺'],
      powerLabel: '游戏能量',
      introLines: ['欢迎来到客厅积木游戏！认真听题，一起搭高高。'],
      stepLines: ['积木搭高啦！', '玩具跳起来啦！', '沙发城堡快完成啦！', '准备收好玩具篮！'],
      bossLine: '乱糟糟玩具篮出现了！答对这一题，把它整理好！',
      victoryLine: '客厅整理好啦，游戏成功！'
    },
    backyard: {
      id: 'backyard',
      title: '后院气球游戏',
      className: 'cartoon-scene-backyard',
      mapEmoji: '🎈',
      bossEmoji: '🌬️',
      bossName: '调皮大风',
      props: ['🎈', '🧺', '🌿', '🪁'],
      powerLabel: '气球能量',
      introLines: ['后院游戏开始！听清楚气球有几个。'],
      stepLines: ['气球升起来啦！', '草地亮起来啦！', '风筝飞起来啦！', '准备挡住调皮大风！'],
      bossLine: '调皮大风来了！答对这一题，气球就安全啦！',
      victoryLine: '气球都安全啦，后院游戏成功！'
    },
    park: {
      id: 'park',
      title: '公园小路游戏',
      className: 'cartoon-scene-park',
      mapEmoji: '🛝',
      bossEmoji: '🕳️',
      bossName: '小泥坑',
      props: ['🛝', '🌳', '🛴', '🪨'],
      powerLabel: '公园能量',
      introLines: ['公园小路出发！一起数清楚。'],
      stepLines: ['滑梯亮起来啦！', '树叶跳舞啦！', '小车滑过去啦！', '准备跨过小泥坑！'],
      bossLine: '小泥坑挡住路了！答对这一题，就能跨过去！',
      victoryLine: '顺利穿过公园小路！'
    },
    kitchen: {
      id: 'kitchen',
      title: '厨房饼干游戏',
      className: 'cartoon-scene-kitchen',
      mapEmoji: '🍪',
      bossEmoji: '🥣',
      bossName: '大面糊碗',
      props: ['🍪', '🥛', '🍽️', '🥣'],
      powerLabel: '饼干能量',
      introLines: ['厨房饼干游戏开始！听听盘子里有多少。'],
      stepLines: ['饼干香起来啦！', '杯子排好队啦！', '盘子转起来啦！', '准备搅好大面糊！'],
      bossLine: '大面糊碗来了！答对这一题，把饼干做好！',
      victoryLine: '饼干烤好啦，厨房游戏成功！'
    },
    bedroom: {
      id: 'bedroom',
      title: '睡前星星游戏',
      className: 'cartoon-scene-bedroom',
      mapEmoji: '⭐',
      bossEmoji: '🌙',
      bossName: '困困月亮',
      props: ['⭐', '🛏️', '💡', '📘'],
      powerLabel: '星星能量',
      introLines: ['睡前星星游戏开始！慢慢听，认真算。'],
      stepLines: ['星星贴好啦！', '小灯亮起来啦！', '故事书打开啦！', '准备和困困月亮说晚安！'],
      bossLine: '困困月亮来了！答对这一题，就能说晚安！',
      victoryLine: '星星都亮啦，晚安游戏成功！'
    }
  };

  function scene(id) {
    return SCENES[id] || SCENES.livingRoom;
  }

  function sceneTitle(id) {
    return scene(id).title;
  }

  function sceneClass(id) {
    return scene(id).className;
  }

  function character(id) {
    return CHARACTERS[id] || CHARACTERS.lele;
  }

  function characterMarkup(id) {
    const c = character(id);
    return [
      `<span class="cartoon-dog cartoon-dog-${c.id}" aria-label="${c.name}" role="img" style="--dog-main:${c.color};--dog-deep:${c.colorDeep};--dog-patch:${c.patch};--dog-accent:${c.accent};">`,
      '<span class="dog-tail"></span>',
      '<span class="dog-body"></span>',
      '<span class="dog-head">',
      '<span class="dog-ear dog-ear-left"></span>',
      '<span class="dog-ear dog-ear-right"></span>',
      '<span class="dog-face-patch"></span>',
      '<span class="dog-eye dog-eye-left"></span>',
      '<span class="dog-eye dog-eye-right"></span>',
      '<span class="dog-muzzle"></span>',
      '<span class="dog-nose"></span>',
      '</span>',
      '</span>'
    ].join('');
  }

  function voiceLine(key, playerId) {
    const c = character(playerId);
    const lines = {
      homeIntro: '蓝蓝和橙橙准备玩数学游戏啦。点开始，我们一起听题。',
      playerPrompt: '谁来玩？点一下你的角色。',
      selected: `${c.voiceName}出发！认真听题，慢慢算。`,
      correct: '答对啦！太棒了！',
      wrong: '没关系，再听一遍，慢慢想。',
      finale: '游戏完成啦！今天也很会算。'
    };
    return lines[key] || '';
  }

  return {
    CHARACTERS,
    SCENES,
    character,
    characterMarkup,
    scene,
    sceneTitle,
    sceneClass,
    voiceLine
  };
});
