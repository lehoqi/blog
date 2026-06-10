(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../garage.js'));
  } else {
    root.V2Themes = factory(root.Garage);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Garage) {
  'use strict';

  const THEMES = {
    police: {
      id: 'police',
      name: '警车追击',
      cssClass: 'theme-police',
      bossEmoji: '🚧',
      bossName: '路障 boss',
      energyLabel: '警灯能量',
      victoryLine: '追击成功！'
    },
    ambulance: {
      id: 'ambulance',
      name: '急救救援',
      cssClass: 'theme-ambulance',
      bossEmoji: '🦠',
      bossName: '病毒云',
      energyLabel: '急救能量',
      victoryLine: '急救成功！'
    },
    fire: {
      id: 'fire',
      name: '消防救援',
      cssClass: 'theme-fire',
      bossEmoji: '🔥',
      bossName: '火焰 boss',
      energyLabel: '水柱能量',
      victoryLine: '火灭啦！'
    },
    everyday: {
      id: 'everyday',
      name: '日常交通',
      cssClass: 'theme-everyday',
      bossEmoji: '🚦',
      bossName: '大堵车',
      energyLabel: '到站能量',
      victoryLine: '安全到站！'
    },
    adventure: {
      id: 'adventure',
      name: '太空冒险',
      cssClass: 'theme-adventure',
      bossEmoji: '☄️',
      bossName: '大陨石',
      energyLabel: '发射能量',
      victoryLine: '抵达终点！'
    }
  };

  const VEHICLE_THEME = {
    police: 'police',
    ambulance: 'ambulance',
    fire: 'fire',
    schoolbus: 'everyday',
    taxi: 'everyday',
    car: 'everyday',
    suv: 'everyday',
    minibus: 'everyday',
    pickup: 'everyday',
    truck: 'everyday',
    motorcycle: 'everyday',
    tram: 'everyday',
    bullettrain: 'everyday',
    train: 'everyday',
    tractor: 'everyday',
    race: 'adventure',
    heli: 'adventure',
    rocket: 'adventure',
    ufo: 'adventure'
  };

  function themeForVehicleId(vehicleId) {
    const family = Garage && Garage.vehicleFamily ? Garage.vehicleFamily(vehicleId) : VEHICLE_THEME[vehicleId];
    const key = THEMES[family] ? family : 'adventure';
    return THEMES[key];
  }

  function comboForGarageEntry(entry, fallbackDino) {
    const vehicle = Garage && Garage.getItem ? Garage.getItem(entry && entry.equippedVehicle) : null;
    const dino = Garage && Garage.getItem ? Garage.getItem(entry && entry.equippedDino) : null;
    return {
      vehicleEmoji: vehicle ? vehicle.emoji : '🚀',
      dinoEmoji: dino ? dino.emoji : (fallbackDino || '🦕'),
      theme: themeForVehicleId(vehicle && vehicle.id)
    };
  }

  return { THEMES, VEHICLE_THEME, themeForVehicleId, comboForGarageEntry };
});
