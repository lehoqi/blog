'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Dialogue = require('./dialogue');

test('dialogue provides short action lines for every scene moment', () => {
  const expectations = [
    ['livingRoom', /工程|吊车|推土|工地/],
    ['backyard', /赛车|赛道|冲线|轮胎/],
    ['park', /恐龙|化石|探险|脚印/],
    ['kitchen', /机器人|齿轮|电池|能量/],
    ['bedroom', /火箭|太空|卫星|燃料/]
  ];
  const moments = ['intro', 'correct', 'wrong', 'boss', 'victory'];

  for (const [scene, pattern] of expectations) {
    for (const moment of moments) {
      const lines = Dialogue.getLines(scene, moment, { step: 1, streak: 2 });
      assert.equal(Array.isArray(lines), true, `${scene}/${moment} should return lines`);
      assert.equal(lines.length >= 1, true, `${scene}/${moment} should not be empty`);
      assert.match(lines.map(line => line.text).join(''), pattern, `${scene}/${moment} should match scene`);
      for (const line of lines) {
        assert.match(line.speaker, /lele|haohao|boss/);
        assert.equal(line.text.length <= 20, true, `${scene}/${moment} line is too long: ${line.text}`);
      }
    }
  }
});

test('speechLines prefixes speaker names for automatic reading', () => {
  const lines = [
    { speaker: 'lele', text: '吊车准备好啦！' },
    { speaker: 'haohao', text: '我来数砖块！' },
    { speaker: 'boss', text: '先答对再过去！' }
  ];
  const speech = Dialogue.speechLines(lines, {
    lele: '布鲁伊',
    haohao: '宾果',
    boss: '堵路大砖墙'
  });

  assert.deepEqual(speech, [
    '布鲁伊说，吊车准备好啦！',
    '宾果说，我来数砖块！',
    '堵路大砖墙说，先答对再过去！'
  ]);
});

test('dialogue rotates deterministically by step and streak', () => {
  const first = Dialogue.getLines('backyard', 'correct', { step: 0, streak: 1 });
  const second = Dialogue.getLines('backyard', 'correct', { step: 1, streak: 1 });
  const combo = Dialogue.getLines('backyard', 'correct', { step: 1, streak: 4 });

  assert.notDeepEqual(first, second);
  assert.notDeepEqual(second, combo);
  assert.deepEqual(
    Dialogue.getLines('unknown-scene', 'intro', { step: 0 }),
    Dialogue.getLines('livingRoom', 'intro', { step: 0 })
  );
});
