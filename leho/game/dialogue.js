'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Dialogue = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCENE_DIALOGUES = {
    livingRoom: {
      intro: [
        [{ speaker: 'lele', text: '工程队出发！' }, { speaker: 'haohao', text: '吊车举高高！' }],
        [{ speaker: 'haohao', text: '工地任务来了！' }, { speaker: 'lele', text: '推土机准备！' }]
      ],
      correct: [
        [{ speaker: 'lele', text: '推土机冲啦！' }, { speaker: 'haohao', text: '工程砖数对啦！' }],
        [{ speaker: 'haohao', text: '吊车抓稳啦！' }, { speaker: 'lele', text: '工地又前进！' }],
        [{ speaker: 'lele', text: '工程连击开路！' }, { speaker: 'haohao', text: '大砖墙快让开！' }]
      ],
      wrong: [
        [{ speaker: 'haohao', text: '工地慢慢数。' }, { speaker: 'lele', text: '再看工程砖！' }],
        [{ speaker: 'lele', text: '推土机先停。' }, { speaker: 'haohao', text: '砖块再数遍！' }]
      ],
      boss: [
        [{ speaker: 'boss', text: '大砖墙挡路！' }, { speaker: 'lele', text: '工程队不怕！' }],
        [{ speaker: 'boss', text: '先答对再过！' }, { speaker: 'haohao', text: '吊车来开路！' }]
      ],
      victory: [
        [{ speaker: 'lele', text: '工地通车啦！' }, { speaker: 'haohao', text: '工程任务成功！' }],
        [{ speaker: 'haohao', text: '砖墙变桥啦！' }, { speaker: 'lele', text: '工程队胜利！' }]
      ]
    },
    backyard: {
      intro: [
        [{ speaker: 'haohao', text: '赛车点火啦！' }, { speaker: 'lele', text: '赛道看我的！' }],
        [{ speaker: 'lele', text: '绿灯准备！' }, { speaker: 'haohao', text: '冲线开始！' }]
      ],
      correct: [
        [{ speaker: 'haohao', text: '赛车加速！' }, { speaker: 'lele', text: '赛道数对啦！' }],
        [{ speaker: 'lele', text: '弯道冲过去！' }, { speaker: 'haohao', text: '轮胎追不上！' }],
        [{ speaker: 'haohao', text: '赛车连击冲线！' }, { speaker: 'lele', text: '冠军速度！' }]
      ],
      wrong: [
        [{ speaker: 'lele', text: '赛车先刹车。' }, { speaker: 'haohao', text: '赛道再数数！' }],
        [{ speaker: 'haohao', text: '别急着冲线。' }, { speaker: 'lele', text: '看清赛车旗！' }]
      ],
      boss: [
        [{ speaker: 'boss', text: '轮胎挡赛道！' }, { speaker: 'haohao', text: '赛车要超车！' }],
        [{ speaker: 'boss', text: '别想冲线！' }, { speaker: 'lele', text: '赛道由我开！' }]
      ],
      victory: [
        [{ speaker: 'haohao', text: '赛车冲线啦！' }, { speaker: 'lele', text: '赛道冠军！' }],
        [{ speaker: 'lele', text: '轮胎让路啦！' }, { speaker: 'haohao', text: '赛车任务成功！' }]
      ]
    },
    park: {
      intro: [
        [{ speaker: 'lele', text: '恐龙脚印！' }, { speaker: 'haohao', text: '化石探险走！' }],
        [{ speaker: 'haohao', text: '恐龙谷集合！' }, { speaker: 'lele', text: '探险队出发！' }]
      ],
      correct: [
        [{ speaker: 'lele', text: '化石找到了！' }, { speaker: 'haohao', text: '恐龙脚印亮！' }],
        [{ speaker: 'haohao', text: '探险又前进！' }, { speaker: 'lele', text: '化石数对啦！' }],
        [{ speaker: 'lele', text: '恐龙连击！' }, { speaker: 'haohao', text: '探险冲坡！' }]
      ],
      wrong: [
        [{ speaker: 'haohao', text: '探险先停下。' }, { speaker: 'lele', text: '再数化石块！' }],
        [{ speaker: 'lele', text: '恐龙脚印慢数。' }, { speaker: 'haohao', text: '答案会出现！' }]
      ],
      boss: [
        [{ speaker: 'boss', text: '泥坑挡化石！' }, { speaker: 'lele', text: '探险队跳过！' }],
        [{ speaker: 'boss', text: '恐龙路断啦！' }, { speaker: 'haohao', text: '化石队不怕！' }]
      ],
      victory: [
        [{ speaker: 'lele', text: '化石找齐啦！' }, { speaker: 'haohao', text: '恐龙任务成功！' }],
        [{ speaker: 'haohao', text: '探险胜利！' }, { speaker: 'lele', text: '恐龙谷通关！' }]
      ]
    },
    kitchen: {
      intro: [
        [{ speaker: 'lele', text: '机器人启动！' }, { speaker: 'haohao', text: '能量电池来！' }],
        [{ speaker: 'haohao', text: '齿轮准备！' }, { speaker: 'lele', text: '机器人开工！' }]
      ],
      correct: [
        [{ speaker: 'lele', text: '电池充满！' }, { speaker: 'haohao', text: '机器人动啦！' }],
        [{ speaker: 'haohao', text: '齿轮转起来！' }, { speaker: 'lele', text: '能量数对啦！' }],
        [{ speaker: 'lele', text: '机器人连击！' }, { speaker: 'haohao', text: '能量爆满！' }]
      ],
      wrong: [
        [{ speaker: 'haohao', text: '机器人待机。' }, { speaker: 'lele', text: '电池再数遍！' }],
        [{ speaker: 'lele', text: '齿轮先慢转。' }, { speaker: 'haohao', text: '能量看清楚！' }]
      ],
      boss: [
        [{ speaker: 'boss', text: '齿轮卡住啦！' }, { speaker: 'lele', text: '机器人修它！' }],
        [{ speaker: 'boss', text: '能量别想过！' }, { speaker: 'haohao', text: '电池冲上去！' }]
      ],
      victory: [
        [{ speaker: 'lele', text: '机器人修好！' }, { speaker: 'haohao', text: '能量站胜利！' }],
        [{ speaker: 'haohao', text: '齿轮全转啦！' }, { speaker: 'lele', text: '机器人任务成！' }]
      ]
    },
    bedroom: {
      intro: [
        [{ speaker: 'lele', text: '火箭倒计时！' }, { speaker: 'haohao', text: '太空出发！' }],
        [{ speaker: 'haohao', text: '卫星信号亮！' }, { speaker: 'lele', text: '火箭准备！' }]
      ],
      correct: [
        [{ speaker: 'lele', text: '火箭加速！' }, { speaker: 'haohao', text: '燃料数对啦！' }],
        [{ speaker: 'haohao', text: '卫星锁定！' }, { speaker: 'lele', text: '太空路线开！' }],
        [{ speaker: 'lele', text: '火箭连击！' }, { speaker: 'haohao', text: '冲出太空！' }]
      ],
      wrong: [
        [{ speaker: 'haohao', text: '火箭先稳住。' }, { speaker: 'lele', text: '燃料再数遍！' }],
        [{ speaker: 'lele', text: '太空别着急。' }, { speaker: 'haohao', text: '看清燃料星！' }]
      ],
      boss: [
        [{ speaker: 'boss', text: '陨石挡火箭！' }, { speaker: 'lele', text: '太空闪避！' }],
        [{ speaker: 'boss', text: '火箭别想过！' }, { speaker: 'haohao', text: '卫星来导航！' }]
      ],
      victory: [
        [{ speaker: 'lele', text: '火箭发射啦！' }, { speaker: 'haohao', text: '太空任务成功！' }],
        [{ speaker: 'haohao', text: '卫星欢呼！' }, { speaker: 'lele', text: '火箭通关！' }]
      ]
    }
  };

  function sceneData(sceneId) {
    return SCENE_DIALOGUES[sceneId] || SCENE_DIALOGUES.livingRoom;
  }

  function getLines(sceneId, moment, options) {
    const opts = options || {};
    const exchanges = sceneData(sceneId)[moment] || [];
    if (!exchanges.length) return [];
    const step = Math.max(0, Math.floor(Number(opts.step) || 0));
    const streakBoost = Math.max(0, Math.floor(Number(opts.streak) || 0)) >= 3 ? 2 : 0;
    const index = (step + streakBoost) % exchanges.length;
    return exchanges[index].map(function (line) {
      return { speaker: line.speaker, text: line.text };
    });
  }

  function speakerName(speaker, names) {
    const map = names || {};
    if (speaker === 'lele') return map.lele || '布鲁伊';
    if (speaker === 'haohao') return map.haohao || '宾果';
    if (speaker === 'boss') return map.boss || '大反派';
    return map[speaker] || '伙伴';
  }

  function speechLines(lines, names) {
    if (!Array.isArray(lines)) return [];
    return lines
      .filter(function (line) { return line && line.text; })
      .map(function (line) {
        return speakerName(line.speaker, names) + '说，' + line.text;
      });
  }

  return {
    SCENE_DIALOGUES: SCENE_DIALOGUES,
    getLines: getLines,
    speechLines: speechLines
  };
});
