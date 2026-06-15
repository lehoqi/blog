'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Cartoon = require('./cartoon');

test('cartoon exposes dog characters and household scenes', () => {
  assert.equal(Cartoon.CHARACTERS.lele.name, '蓝蓝');
  assert.equal(Cartoon.CHARACTERS.haohao.name, '橙橙');
  assert.equal(Cartoon.sceneTitle('livingRoom'), '客厅积木游戏');
  assert.equal(Cartoon.sceneClass('backyard'), 'cartoon-scene-backyard');
  assert.equal(Array.isArray(Cartoon.SCENES.kitchen.props), true);
  assert.ok(Cartoon.SCENES.kitchen.props.length > 0);
});

test('characterMarkup returns accessible original dog character markup', () => {
  const markup = Cartoon.characterMarkup('lele');
  assert.match(markup, /cartoon-dog/);
  assert.match(markup, /aria-label="蓝蓝"/);
  assert.match(markup, /dog-ear/);
});
