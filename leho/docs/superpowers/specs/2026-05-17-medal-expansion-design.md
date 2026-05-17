# 设计文档：扩充勋章系统

- 日期：2026-05-17
- 状态：已定稿（用户已口头批准设计），待评审
- 关联：建立在「车库解锁系统第一期」之上（`docs/superpowers/specs/2026-05-17-garage-unlock-system-design.md`）

## 1. 背景与现状

`index.html` 单文件游戏，面向 5 岁不识字孩子。现有勋章系统：

- `ALL_MEDALS`（index.html:2839）= 16 枚，每枚 `{ id, icon, label, check: st => boolean }`。
- `check(st)` 收到的 `st` = `getPlayerStats(playerId)`，字段：`totalStars, totalScore, games, perfectGames, streak, records, totalTagScores{police,ambulance,general}`。**不含车库数据。**
- 调用 `m.check(...)` 的 3 处：`detectNewMedals(playerId)`（:2681，结算前快照）、`findNewlyUnlocked(playerId, beforeSet)`（:2687，结算后）、`renderLeaderboard`（:2914，对 lele/haohao 各 `m.check`）。
- 新解锁勋章仅在**答题结算页** `showResult` 检测，并经 `resultRead` 语音播报 + `new-medal-box` 视觉展示。
- 勋章柜在排行榜页渲染（locked 灰显、显示归属玩家），进度文案运行时用 `ALL_MEDALS.length`；HTML 静态占位仍写死 `已解锁 0 / 12 枚勋章`（仅初始静态值，运行时正确）。
- 车库系统（已交付）提供 `getPlayerGarage(pid)` → `{coins, owned[], equippedVehicle, equippedDino}`；`Garage.roundCoins(score,total)`、`Garage.byKind('vehicle')`、`Garage.getItem(id)` 等纯函数可用。

## 2. 目标 / 非目标

**目标**：新增 12 枚勋章（16 → 28），含「现有类型更高档位」与「车库/收集主题」；车库类勋章在车库页解锁/装备后**当场庆祝**；老勋章与结算流程零回归。

**非目标**：不改勋章柜布局；不改结算页 `new-medal-box` 行为（仅换数据源）；不修既有 `streak3/streak5` 的非单调性（见 §4）；不涉及"装备座驾影响题库主题"（属另一独立工作，见关联备注，不在本 spec）。

## 3. 数据接入：统一 `medalStats(playerId)`

新增 `medalStats(pid)`，返回老字段 + 车库派生字段：

```
{ ...getPlayerStats(pid),                 // 老字段原样
  coinsNow:        getPlayerGarage(pid).coins,
  lifetimeCoins:   Σ over records of Garage.roundCoins(r.score, r.total),
  ownedVehicleCount: 已拥有且 kind==='vehicle' 的数量,
  ownedDinoCount:    已拥有且 kind==='dino' 的数量,
  ownedTotal:        owned.length,
  ownsAllVehicles:   Garage.byKind('vehicle') 全部在 owned 中,
  ownsDragon:        owned 含 'dragon' }
```

把上述 **3 处** `getPlayerStats(pid)` 调用替换为 `medalStats(pid)`。老 16 枚 `check` 只读老字段（`medalStats` 透传）→ **零回归**；新勋章读新字段。

**为何不用 `check(st, garage)` 双参**：会动到每个老勋章的语义/签名且 3 处调用仍要取车库，更脏。统一 stats 对象是单一数据源、DRY，且对老勋章透明。

## 4. 单调性原则

金币会被花掉 → 币类勋章用 **`lifetimeCoins`（历史累计赚取，从 records 派生 `Garage.roundCoins`，只增不减）**，不用 `coinsNow`。收集类基于 `owned`（只增；唯一减少途径是"清除记录"，那会整体重置，可接受）。→ 新勋章一旦解锁不再变灰。

既有 `streak3/streak5` 用瞬时 `st.streak`，断连会在勋章柜变灰——**既有行为，本次明确不动**（避免扩大范围/回归风险）。`coinsNow` 仅作潜在调试用途，不被任何勋章 `check` 使用。

## 5. 新增勋章清单（12 枚）

**现有类型·更高档（仅用老字段，无新依赖）：**

| id | icon | label | check |
|---|---|---|---|
| fifty_games | 🏅 | 五十次挑战 | st.games >= 50 |
| stars_200 | 💫 | 200颗星星 | st.totalStars >= 200 |
| perfect_10 | 👑 | 满分十次 | st.perfectGames >= 10 |
| streak7 | ☄️ | 七连满分 | st.streak >= 7 |
| police_50 | 🎖️ | 警界传奇 | st.totalTagScores && st.totalTagScores.police >= 50 |
| ambulance_50 | 🦸 | 急救传奇 | st.totalTagScores && st.totalTagScores.ambulance >= 50 |（评审期定为 🦸，避免与 perfect5 的 🏆 撞图标，§9 允许）

**车库/收集主题（用新字段）：**

| id | icon | label | check |
|---|---|---|---|
| first_unlock | 🔓 | 第一次解锁 | st.ownedTotal > 2 |
| collector_5 | 🚙 | 小小收藏家 | st.ownedVehicleCount >= 5 |
| garage_master | 🏰 | 车库大师 | st.ownsAllVehicles |
| dragon_rider | 🐲 | 驯龙高手 | st.ownsDragon |
| coin_saver_50 | 🪙 | 小财主 | st.lifetimeCoins >= 50 |
| coin_saver_150 | 💰 | 大富翁 | st.lifetimeCoins >= 150 |

追加到 `ALL_MEDALS` 数组末尾（保持现有顺序，新条目在后；勋章柜按数组顺序渲染）。

## 6. 车库当场庆祝（复用检测，DRY）

抽取共享检测：`snapshotMedals(pid)` → `Set` of 当前满足的 medal id（即现有 `detectNewMedals` 内 `beforeSet` 的逻辑，基于 `medalStats`）。

`handleGarageCellTap` 中，解锁与装备两条「状态已提交」分支，在 `setPlayerGarage` 之后：

1. `before = snapshotMedals(pid)`（在提交前取；实现上：进入分支即快照 → 提交 → 比对）
2. 提交后 `after = snapshotMedals(pid)`，`newMedals = ALL_MEDALS.filter(m => !before.has(m.id) && m.check(medalStats(pid)))`
3. 若 `newMedals` 非空：排在该次解锁四幕 / 装备冲击波动画**之后**，触发**简洁勋章庆祝**：
   - 视觉：勋章 `icon` 居中放大弹入（复用 `element.animate` 弹跳）+ 一圈金色 `Particle('star')` + `fwLoop`；多枚则依次。
   - 语音：经 `speakQueue`，每枚一句「获得新勋章！<label>」。
   - 纯装饰，不阻塞；`prefers-reduced-motion` 下仅语音。
4. 结算页 `showResult` 现有 `new-medal-box` + `resultRead` 路径**保持不变**，仅其底层 `detectNewMedals`/`findNewlyUnlocked` 改用 `medalStats`（行为等价，且现在也会捕捉车库类勋章作为兜底）。

## 7. 非读者 & 杂项（满足项目硬约束）

- 12 枚均配清晰 emoji 图标；新解锁经语音播报 `label`（与现有一致，孩子靠图标 + 听）。
- 庆祝语音走 `speakQueue`（不被截断）；受 `voiceMuted` 控制；UI 无语音也可辨（勋章柜图标+灰显/高亮）。
- 顺手修正静态占位：`<div class="medal-progress">已解锁 0 / 12 枚勋章</div>` → `已解锁 0 / 28 枚勋章`（仅静态初值；运行时本就用 `ALL_MEDALS.length`，保持）。

## 8. 测试与验收

- **纯逻辑可单测**：`lifetimeCoins` 累计、收集计数/`ownsAllVehicles`/`ownsDragon` 的派生最好实现为 `garage.js` 纯函数（如 `Garage.lifetimeCoins(records)`、`Garage.ownsAll(owned,'vehicle')`），用 `node --test` 覆盖；`medalStats` 组装层在 index.html，靠浏览器验收。
- **验收标准**：
  1. 老 16 枚行为与改动前完全一致（默认/历史数据下勋章柜、结算解锁播报不变）——零回归。
  2. 28 枚全部在勋章柜正确显示锁定/解锁与归属；进度文案 `X / 28`。
  3. 车库内解锁第 3 件（超默认）即时弹出 `first_unlock` 庆祝 + 语音；攒够 lifetimeCoins 触发币类勋章；集齐座驾触发 `garage_master`。
  4. 币类勋章基于 lifetimeCoins：花光金币后勋章**不**变灰。
  5. 语音不截断、静音静默；reduced-motion 下状态/解锁正确、仅省动画。
  6. 清除记录后所有新勋章随之归零（与既有一致）。
- 工具：`node --test tests/garage.test.js` + chrome-devtools MCP 浏览器验收。

## 9. 可调项

具体 emoji、阈值（50/200/10/7/50；2/5/50/150）、庆祝时长/形式，评审期可微调。
