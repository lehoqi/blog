'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Cartoon = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CHARACTERS = {
    lele: {
      id: 'lele',
      name: '布鲁伊',
      color: '#4aa3df',
      colorDeep: '#1665a8',
      patch: '#8ed1ff',
      accent: '#ffd166',
      voiceName: '布鲁伊'
    },
    haohao: {
      id: 'haohao',
      name: '宾果',
      color: '#f5a14a',
      colorDeep: '#c45b1c',
      patch: '#ffd39a',
      accent: '#5fb7e8',
      voiceName: '宾果'
    }
  };

  const SCENES = {
    livingRoom: {
      id: 'livingRoom',
      title: '工程车积木工地',
      className: 'cartoon-scene-living-room',
      mapEmoji: '🚧',
      bossEmoji: '🧱',
      bossName: '堵路大砖墙',
      props: ['🚧', '🏗️', '🚜', '🧱'],
      powerLabel: '工程能量',
      introLines: ['工程车积木工地开工！认真听题，把路线修出来。'],
      stepLines: ['推土机出发啦！', '吊车把积木吊高啦！', '小挖机轰隆隆前进！', '准备撞开堵路大砖墙！'],
      bossLine: '堵路大砖墙挡住工地！答对这一题，让工程队开路！',
      victoryLine: '工地路线修好啦，工程任务成功！'
    },
    backyard: {
      id: 'backyard',
      title: '后院赛车赛道',
      className: 'cartoon-scene-backyard',
      mapEmoji: '🏎️',
      bossEmoji: '🛞',
      bossName: '乱滚轮胎',
      props: ['🏎️', '🏁', '🚦', '🛞'],
      powerLabel: '赛车能量',
      introLines: ['后院赛车赛道点火！听清题目，准备冲过弯道。'],
      stepLines: ['赛车加速啦！', '红绿灯变绿啦！', '冲过小弯道！', '准备超过乱滚轮胎！'],
      bossLine: '乱滚轮胎冲到赛道上！答对这一题，赛车就能超过它！',
      victoryLine: '赛车冲线啦，赛道任务成功！'
    },
    park: {
      id: 'park',
      title: '恐龙化石探险',
      className: 'cartoon-scene-park',
      mapEmoji: '🦖',
      bossEmoji: '🕳️',
      bossName: '大泥坑陷阱',
      props: ['🦖', '🦴', '⛏️', '🛴'],
      powerLabel: '探险能量',
      introLines: ['恐龙化石探险出发！一起数清楚，找到化石路线。'],
      stepLines: ['发现恐龙脚印啦！', '挖出化石碎片啦！', '滑板车冲过草坡！', '准备跳过大泥坑陷阱！'],
      bossLine: '大泥坑陷阱挡住化石！答对这一题，就能安全跳过去！',
      victoryLine: '恐龙化石找到啦，探险任务成功！'
    },
    kitchen: {
      id: 'kitchen',
      title: '机器人能量站',
      className: 'cartoon-scene-kitchen',
      mapEmoji: '🤖',
      bossEmoji: '⚙️',
      bossName: '卡住的大齿轮',
      props: ['🤖', '⚙️', '🔋', '🧰'],
      powerLabel: '机器人能量',
      introLines: ['机器人能量站启动！听题补能量，让机器人动起来。'],
      stepLines: ['电池充好啦！', '机器人手臂转起来啦！', '能量块装箱啦！', '准备修好卡住的大齿轮！'],
      bossLine: '大齿轮卡住啦！答对这一题，机器人就能继续工作！',
      victoryLine: '机器人能量站修好啦，任务成功！'
    },
    bedroom: {
      id: 'bedroom',
      title: '太空火箭基地',
      className: 'cartoon-scene-bedroom',
      mapEmoji: '🚀',
      bossEmoji: '☄️',
      bossName: '飞来的陨石',
      props: ['🚀', '🪐', '🛰️', '⭐'],
      powerLabel: '火箭能量',
      introLines: ['太空火箭基地倒计时！认真听题，准备发射。'],
      stepLines: ['火箭加燃料啦！', '卫星信号亮起来啦！', '穿过星星轨道！', '准备躲开飞来的陨石！'],
      bossLine: '飞来的陨石出现了！答对这一题，火箭就能安全闪避！',
      victoryLine: '火箭发射成功，太空任务完成！'
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function equipmentBadge(kind, item) {
    if (!item || !item.emoji) return '';
    return `<span class="cartoon-dog-${kind}" aria-hidden="true">${escapeHtml(item.emoji)}</span>`;
  }

  function characterMarkup(id, equipment) {
    const c = character(id);
    const prop = equipment && equipment.vehicle;
    const costume = equipment && (equipment.costume || equipment.dino);
    const label = [c.name, prop && prop.name, costume && costume.name]
      .filter(Boolean)
      .join('，');
    return [
      `<span class="cartoon-dog cartoon-dog-${c.id}" aria-label="${escapeHtml(label)}" role="img" style="--dog-main:${c.color};--dog-deep:${c.colorDeep};--dog-patch:${c.patch};--dog-accent:${c.accent};">`,
      '<span class="dog-art">',
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
      equipmentBadge('costume', costume),
      equipmentBadge('prop', prop),
      '</span>',
      '</span>'
    ].join('');
  }

  function voiceLine(key, playerId) {
    const c = character(playerId);
    const lines = {
      homeIntro: '布鲁伊和宾果准备玩数学游戏啦。点开始，我们一起听题。',
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
