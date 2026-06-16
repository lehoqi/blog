'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Adventure = require('./adventure');
const Garage = require('./garage');

test('adventure themes use action scenes for boys', () => {
  const expected = [
    ['livingRoom', /工程|工地/, '🚧'],
    ['backyard', /赛车|赛道/, '🏎️'],
    ['park', /恐龙/, '🦖'],
    ['kitchen', /机器人/, '🤖'],
    ['bedroom', /火箭|太空/, '🚀']
  ];

  for (const [id, titlePattern, mapEmoji] of expected) {
    const theme = Adventure.getTheme(id);
    assert.match(theme.name, titlePattern, `${id} should use an action theme`);
    assert.equal(theme.mapEmoji, mapEmoji);
    assert.equal(theme.landmarks.length >= 3, true);
    assert.match(theme.introLines[0] + theme.stepLines.join('') + theme.bossLine, /冲|赛|工程|恐龙|机器人|火箭|任务/);
  }
});

test('starter garage props are action themed', () => {
  assert.match(Garage.getItem('police').name, /工程|挖机|推土/);
  assert.equal(Garage.getItem('police').emoji, '🚜');
  assert.match(Garage.getItem('ambulance').name, /赛车|赛道/);
  assert.equal(Garage.getItem('ambulance').emoji, '🏎️');
  assert.match(Garage.getItem('fire').name, /机器人|电池|能量/);
  assert.equal(Garage.getItem('fire').emoji, '🤖');
});

test('garage props route to matching action scenes', () => {
  assert.equal(Garage.vehicleFamily('tractor'), 'police');
  assert.equal(Garage.vehicleFamily('race'), 'ambulance');
  assert.equal(Garage.vehicleFamily('pickup'), 'fire');
  assert.equal(Garage.vehicleFamily('schoolbus'), 'everyday');
  assert.equal(Garage.vehicleFamily('tram'), 'adventure');
  assert.equal(Garage.vehicleFamily('rocket'), 'adventure');
});
