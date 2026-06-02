(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../garage.js'), require('../../logic/question-mix.js'));
  } else {
    root.V2Rewards = factory(root.Garage, root.QuestionMix);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Garage, QuestionMix) {
  'use strict';

  const AWARDS = [
    { id: 'first_game', icon: '🎯', label: '初次冒险', kind: 'medal', check: st => st.games >= 1 },
    { id: 'perfect', icon: '💯', label: '满分达人', kind: 'medal', check: st => st.perfectGames >= 1 },
    { id: 'trophy_streak_round', icon: '🏆', label: '五题连胜杯', kind: 'trophy', source: 'perfect', check: st => st.perfectGames >= 1 },
    { id: 'trophy_carry_borrow', icon: '🥈', label: '进退位奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.carryBorrow.correct >= 3 },
    { id: 'trophy_missing', icon: '🧩', label: '缺数奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.missing.correct >= 1 },
    { id: 'trophy_compare', icon: '⚖️', label: '比较奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.compare.correct >= 1 },
    { id: 'trophy_two_step', icon: '🧠', label: '推理奖杯', kind: 'trophy', source: 'round', check: st => st.typeStats && st.typeStats.twoStep.correct >= 1 },
    { id: 'trophy_mixed_perfect', icon: '👑', label: '全能奖杯', kind: 'trophy', source: 'round', check: st => st.records && st.records.some(QuestionMix.hasMixedPerfectRound) },
    { id: 'five_games', icon: '✋', label: '五次挑战', kind: 'medal', check: st => st.games >= 5 },
    { id: 'ten_games', icon: '🏃', label: '勤奋小将', kind: 'medal', check: st => st.games >= 10 },
    { id: 'twenty_games', icon: '💪', label: '超级勤奋', kind: 'medal', check: st => st.games >= 20 },
    { id: 'stars_10', icon: '⭐', label: '10颗星星', kind: 'medal', check: st => st.totalStars >= 10 },
    { id: 'stars_30', icon: '🌟', label: '30颗星星', kind: 'medal', check: st => st.totalStars >= 30 },
    { id: 'stars_60', icon: '✨', label: '60颗星星', kind: 'medal', check: st => st.totalStars >= 60 },
    { id: 'stars_100', icon: '🌠', label: '100颗星星', kind: 'medal', check: st => st.totalStars >= 100 },
    { id: 'streak3', icon: '🔥', label: '三连满分', kind: 'medal', check: st => st.streak >= 3 },
    { id: 'streak5', icon: '🔥', label: '五连满分', kind: 'medal', check: st => st.streak >= 5 },
    { id: 'perfect5', icon: '🏆', label: '满分5次', kind: 'medal', check: st => st.perfectGames >= 5 },
    { id: 'fifty_games', icon: '🏅', label: '五十次挑战', kind: 'medal', check: st => st.games >= 50 },
    { id: 'stars_200', icon: '💫', label: '200颗星星', kind: 'medal', check: st => st.totalStars >= 200 },
    { id: 'perfect_10', icon: '👑', label: '满分十次', kind: 'medal', check: st => st.perfectGames >= 10 },
    { id: 'streak7', icon: '☄️', label: '七连满分', kind: 'medal', check: st => st.streak >= 7 },
    { id: 'police_10', icon: '🚓', label: '小小警长', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.police >= 10 },
    { id: 'police_30', icon: '🚔', label: '金牌警探', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.police >= 30 },
    { id: 'police_50', icon: '🎖️', label: '警界传奇', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.police >= 50 },
    { id: 'ambulance_10', icon: '🚑', label: '急救先锋', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.ambulance >= 10 },
    { id: 'ambulance_30', icon: '🏥', label: '金牌医生', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.ambulance >= 30 },
    { id: 'ambulance_50', icon: '🦸', label: '急救传奇', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.ambulance >= 50 },
    { id: 'fire_10', icon: '🚒', label: '消防小英雄', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.fire >= 10 },
    { id: 'fire_30', icon: '🧯', label: '烈焰克星', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.fire >= 30 },
    { id: 'everyday_10', icon: '🚌', label: '出行小达人', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.everyday >= 10 },
    { id: 'everyday_30', icon: '🎫', label: '金牌司机', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.everyday >= 30 },
    { id: 'adventure_10', icon: '🏁', label: '勇敢探险家', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.adventure >= 10 },
    { id: 'adventure_30', icon: '🛰️', label: '太空英雄', kind: 'medal', check: st => st.totalTagScores && st.totalTagScores.adventure >= 30 },
    { id: 'first_unlock', icon: '🔓', label: '第一次解锁', kind: 'medal', check: st => st.ownedTotal > 2 },
    { id: 'collector_5', icon: '🚙', label: '小小收藏家', kind: 'medal', check: st => st.ownedVehicleCount >= 5 },
    { id: 'garage_master', icon: '🏰', label: '车库大师', kind: 'medal', check: st => st.ownsAllVehicles === true },
    { id: 'dragon_rider', icon: '🐲', label: '驯龙高手', kind: 'medal', check: st => st.ownsDragon === true },
    { id: 'coin_saver_50', icon: '🪙', label: '小财主', kind: 'medal', check: st => st.lifetimeCoins >= 50 },
    { id: 'coin_saver_150', icon: '💰', label: '大富翁', kind: 'medal', check: st => st.lifetimeCoins >= 150 }
  ];

  function scoreToStars(score, total) {
    const safeTotal = Math.max(1, Math.floor(Number(total) || 1));
    const safeScore = Math.max(0, Math.min(safeTotal, Math.floor(Number(score) || 0)));
    const ratio = safeScore / safeTotal;
    if (ratio >= 1) return 5;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.6) return 3;
    if (ratio >= 0.4) return 2;
    return 1;
  }

  function emptyTagScores() {
    return { police: 0, ambulance: 0, general: 0, fire: 0, everyday: 0, adventure: 0 };
  }

  function aggregateRecords(records, garageEntry) {
    const list = Array.isArray(records) ? records : [];
    const totalTagScores = emptyTagScores();
    list.forEach(record => {
      const source = record && record.tagScores;
      if (!source || typeof source !== 'object') return;
      Object.keys(totalTagScores).forEach(tag => {
        totalTagScores[tag] += Math.max(0, Math.floor(Number(source[tag]) || 0));
      });
    });
    let streak = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].score === list[i].total) streak++;
      else break;
    }
    const owned = Array.isArray(garageEntry && garageEntry.owned) ? garageEntry.owned : [];
    return {
      records: list,
      games: list.length,
      totalStars: list.reduce((sum, r) => sum + (r.stars || 0), 0),
      perfectGames: list.filter(r => r.score === r.total).length,
      streak,
      typeStats: QuestionMix.aggregateTypeStats(list),
      totalTagScores,
      lifetimeCoins: Garage.lifetimeCoins(list),
      ownedVehicleCount: Garage.ownedCount(owned, 'vehicle'),
      ownedDinoCount: Garage.ownedCount(owned, 'dino'),
      ownedTotal: owned.length,
      ownsAllVehicles: Garage.ownsAll(owned, 'vehicle'),
      ownsDragon: owned.indexOf('dragon') !== -1
    };
  }

  function awardSet(stats) {
    return new Set(AWARDS.filter(a => a.check(stats)).map(a => a.id));
  }

  function sortUnlockedAwards(awards) {
    const sourceWeight = award => {
      if (award.kind === 'trophy' && award.source === 'round') return 0;
      if (award.kind === 'trophy') return 1;
      if (/unlock|collector|garage|dragon/.test(award.id)) return 2;
      return 3;
    };
    return awards.slice().sort((a, b) => sourceWeight(a) - sourceWeight(b));
  }

  function buildAbilityHighlights(typeStats) {
    const stats = typeStats || {};
    const out = [];
    if (stats.carryBorrow && stats.carryBorrow.total > 0 && stats.carryBorrow.correct === stats.carryBorrow.total) out.push('进退位题全对');
    if (stats.missing && stats.missing.total > 0 && stats.missing.correct === stats.missing.total) out.push('缺数题全对');
    if (stats.compare && stats.compare.total > 0 && stats.compare.correct === stats.compare.total) out.push('比较题全对');
    if (stats.twoStep && stats.twoStep.correct > 0) out.push('完成两步题');
    return out;
  }

  function calculateRoundSettlement(input) {
    const score = Math.max(0, Math.floor(Number(input.score) || 0));
    const total = Math.max(0, Math.floor(Number(input.total) || 0));
    const questionTypeStats = QuestionMix.buildRoundTypeStats(input.questions || [], input.correctByIndex || {});
    const record = {
      player: input.playerId,
      score,
      total,
      stars: scoreToStars(score, total || 1),
      date: new Date().toISOString(),
      tagScores: input.tagScores || {},
      questionTypeStats
    };
    const before = aggregateRecords(input.previousRecords || [], input.garageEntry);
    const after = aggregateRecords((input.previousRecords || []).concat(record), input.garageEntry);
    const beforeAwards = awardSet(before);
    const newAwards = sortUnlockedAwards(AWARDS.filter(a => !beforeAwards.has(a.id) && a.check(after)));
    return {
      record,
      score,
      total,
      stars: record.stars,
      coins: Garage.roundCoins(score, total),
      questionTypeStats,
      highlights: buildAbilityHighlights(questionTypeStats),
      newAwards
    };
  }

  return {
    AWARDS,
    scoreToStars,
    aggregateRecords,
    awardSet,
    sortUnlockedAwards,
    buildAbilityHighlights,
    calculateRoundSettlement
  };
});
