const test = require('node:test');
const assert = require('node:assert/strict');
const Garage = require('../../garage.js');
const Themes = require('../scripts/themes.js');

test('all garage vehicles map to one of five v2 visual themes', () => {
  const vehicles = Garage.byKind('vehicle').map(it => it.id);
  assert.deepEqual(vehicles.sort(), [
    'ambulance',
    'fire',
    'heli',
    'police',
    'race',
    'rocket',
    'schoolbus',
    'taxi',
    'tractor',
    'train',
    'ufo'
  ].sort());

  vehicles.forEach(id => {
    const theme = Themes.themeForVehicleId(id);
    assert.ok(['police', 'ambulance', 'fire', 'everyday', 'adventure'].includes(theme.id), id);
    assert.ok(theme.cssClass.startsWith('theme-'), id);
    assert.ok(theme.bossEmoji, id);
    assert.ok(theme.energyLabel, id);
  });
});

test('daily and adventure vehicle groups match the design document', () => {
  ['schoolbus', 'taxi', 'train', 'tractor'].forEach(id => {
    assert.equal(Themes.themeForVehicleId(id).id, 'everyday');
  });
  ['race', 'heli', 'rocket', 'ufo'].forEach(id => {
    assert.equal(Themes.themeForVehicleId(id).id, 'adventure');
  });
});

test('unknown vehicle falls back to adventure theme', () => {
  assert.equal(Themes.themeForVehicleId('missing-car').id, 'adventure');
  assert.equal(Themes.themeForVehicleId(undefined).id, 'adventure');
});
