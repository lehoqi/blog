'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Cartoon = require('./cartoon');

test('cartoon exposes dog characters and action-adventure scenes', () => {
  assert.equal(Cartoon.CHARACTERS.lele.name, '布鲁伊');
  assert.equal(Cartoon.CHARACTERS.haohao.name, '宾果');
  assert.equal(Cartoon.sceneTitle('livingRoom'), '工程车积木工地');
  assert.equal(Cartoon.sceneClass('backyard'), 'cartoon-scene-backyard');
  assert.deepEqual(Cartoon.SCENES.backyard.props, ['🏎️', '🏁', '🚦', '🛞']);
  assert.match(Cartoon.SCENES.park.title, /恐龙/);
  assert.match(Cartoon.SCENES.kitchen.title, /机器人/);
  assert.match(Cartoon.SCENES.bedroom.title, /火箭|太空/);
});

test('characterMarkup returns accessible original dog character markup', () => {
  const markup = Cartoon.characterMarkup('lele');
  assert.match(markup, /cartoon-dog/);
  assert.match(markup, /aria-label="布鲁伊"/);
  assert.match(markup, /dog-ear/);
});

test('characterMarkup decorates character with equipped prop and costume', () => {
  const markup = Cartoon.characterMarkup('lele', {
    vehicle: { emoji: '🍪', name: '饼干盘' },
    costume: { emoji: '🌟', name: '星星披风' }
  });
  assert.match(markup, /cartoon-dog-prop/);
  assert.match(markup, /🍪/);
  assert.match(markup, /cartoon-dog-costume/);
  assert.match(markup, /🌟/);
  assert.match(markup, /aria-label="布鲁伊，饼干盘，星星披风"/);
});
