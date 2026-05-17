# 设计文档：换车 → 题库/主题联动（全套）

- 日期：2026-05-17
- 状态：已定稿（用户已逐节批准设计），待评审
- 关联：建立在「车库解锁系统」+「勋章扩充」之上。这是用户在第一期"纯换装"决策后，主动要求把主题与装备座驾联动（反转 garage spec §8 的 preferTag 固定绑定）。

## 1. 背景与现状（精确接入点）

`index.html` 单文件，5 岁不识字玩家。当前主题系统：

- `STORIES_ADD` / `STORIES_SUB`（index.html ~1604+）：故事模板数组，元素 `(a,b)=>({text, q, tag?})`，`tag` 取 `'police'|'ambulance'` 或缺省（通用）。
- `pickStory(pool, preferTag)`（~1597）：`preferTag` 非空时 60% 概率从 `tag===preferTag` 的子集抽，否则全随机。**机制不改。**
- `generateQuestion()`（~1608）：`const preferTag = currentPlayer ? PLAYERS[currentPlayer].preferTag : null;` —— 主题固定绑玩家（乐乐=police，昊昊=ambulance），**与装备车无关**（用户的抱怨点）。
- `showCelebrate`（~1748）：`isThemeQ = currentPlayer && curQ.tag && PLAYERS[currentPlayer].preferTag===curQ.tag` → 选 `CELEBRATE_POLICE`/`CELEBRATE_AMBULANCE`，否则 `CELEBRATE_TEXTS`。
- `submitAnswer`（~2541 tagScores；~2577 isThemeMatch）：`qTag=q.tag||'general'`；`isThemeMatch = currentPlayer && q.tag && PLAYERS[currentPlayer].preferTag===q.tag` → `showVehicleRush(vEmoji,vType,streak,goNext)`（vType=q.tag；无 opts → 默认警笛+「破案/急救成功」文案）。`showVehicleRush` 已被 garage 改造为可接受可选 `{text,sound}`（默认值保留原行为）。
- `tagScores`：`startGame`/`saveRecord` 初始化 `{police:0,ambulance:0,general:0}`；`getPlayerStats` 汇总 `totalTagScores` 同三键。
- 勋章（已交付，共 28 枚，含 medalStats/snapshotMedals 通用结构）：`police_10/30/50`、`ambulance_10/30/50` 读 `st.totalTagScores.police|ambulance`。
- `getTitle(stats, playerId)`（~1455）：`TITLES` 按 `PLAYERS[playerId].preferTag`（police/ambulance/default）。
- 车库（已交付）：`getPlayerGarage(pid).equippedVehicle` = 座驾 id（如 `'police'`/`'rocket'`）；`Garage` 纯模块（garage.js）。garage `DEFAULTS`：乐乐默认 `police`、昊昊默认 `ambulance`（与 `preferTag` 一致 → 零回归基础）。
- SFX：`playPoliceSiren()` / `playAmbulanceSiren()`（Web Audio 合成，模板可参考）。

## 2. 目标 / 非目标

**目标**：玩家当前主题 = 其**装备座驾所属主题族**（替换固定 `preferTag`）。新增 3 个主题族（fire/everyday/adventure），每族配全套：故事题库 + 庆祝语 + 飞车文案 + 专属合成音效 + 称号 + 勋章。默认装备 🚓/🚑 的玩家行为与改动前逐位一致（零回归）。

**非目标**：不改 `pickStory` 权重机制；不改车库/答题计分/结果页结构；不做"每辆车独立主题"（按族）；police/ambulance 既有内容/音效/勋章一律不动。

## 3. 硬约束（项目级）

- **C1**：所有新故事题、庆祝语经现有 `speak`/`speakQueue` 朗读（5 岁不识字，靠听+图标）；量词正确、20 以内加减、句式与现有警车题一致、首字符带该族 emoji。
- **C2**：每族专属音效要"酷炫"且与现有警笛同调性（Web Audio 合成，非静音依赖）。
- **C3 零回归**：family ∈ {police, ambulance} 时，故事权重 / 庆祝语 / 飞车文案+警笛 / 称号 / tagScore 键 / 既有 28+ 勋章，全部与改动前**逐位一致**。
- **C4**：纯逻辑（族映射、currentFamily、tagScore 计分）可 `node --test`；UI/音效/文案靠浏览器验收；必须含"默认车零回归"专项用例。

## 4. 主题族模型

新增常量 `VEHICLE_FAMILY`（座驾 id → 族 id）：

| 族 id | 座驾 id（emoji） | 主题 | 专属音效 |
|---|---|---|---|
| `police` | police 🚓 | 警车（**不动**） | 现有 `playPoliceSiren` |
| `ambulance` | ambulance 🚑 | 急救（**不动**） | 现有 `playAmbulanceSiren` |
| `fire` | fire 🚒 | 消防灭火/出警 | 新 `playFireBell`（交替双音「叮铃铃」，方波） |
| `everyday` | schoolbus 🚌 / taxi 🚕 / train 🚂 / tractor 🚜 | 出行·上下乘客/拉货 | 新 `playEverydayHorn`（友好双音喇叭「叮—叮」，三角波） |
| `adventure` | race 🏎️ / heli 🚁 / rocket 🚀 / ufo 🛸 | 竞速/太空探险·发射冲刺 | 新 `playAdventureWhoosh`（频率上扫「咻——」+ 点火噗，锯齿/正弦） |

**映射归属**：族映射是纯逻辑 → 放 `garage.js` 暴露 `Garage.vehicleFamily(vehicleId)`（返回族 id；未知/缺省 → `'general'`），可 `node --test`。index.html 的 `currentFamily()` 仅做包装：`if(!currentPlayer) return null; try { return Garage.vehicleFamily(getPlayerGarage(currentPlayer).equippedVehicle); } catch(e){ if(typeof console!=='undefined') console.warn('[currentFamily] fallback:',e); return 'general'; }`（`currentPlayer` 为空 → `null`，与现在 `preferTag=null` 等价 → 全随机）。

## 5. 内容规格（3 个新族各一套）

每新族需作者撰写：

- **加法故事 6 条 + 减法故事 6 条**：`(a,b)=>({text:'<族emoji> …${a}…${b}…', q:'…多少…？', tag:'<族id>'})`。量词与场景严格匹配（如校车"位/个乘客"、火箭"颗星球/个外星人"、消防"处火/只小猫"）。20 以内（加法 a∈[1,15],b∈[1,20-a]；减法 a∈[2,20],b∈[1,a]，沿用 `generateQuestion` 现有取值）。
- **庆祝语 3 条**：`CELEBRATE_<FAMILY>`（如 adventure：「🚀 发射成功！冲出大气层！」「🏎️ 冲线第一！太快啦！」「🛸 探索成功！你是小宇航员！」）。
- **飞车文案 1 条**：`RUSH_TEXT[family]`（如 fire：「🚒 火灭啦！救援成功！」everyday：「🚌 安全到站！棒极了！」adventure：「🚀 抵达终点！超厉害！」）。
- **称号 6 档**：`TITLES[family]`（仿 police 六档：新手→…→传奇，带族 emoji）。

样例（锁定语气，实现期补全到各 6 条；下面每族示意 2 条）：

- fire 加：`🚒 消防车出动！先扑灭了 ${a} 处火，又扑灭了 ${b} 处，` q:`一共扑灭多少处火？`；fire 减：`🚒 消防员救出 ${a} 只小猫，已经送走 ${b} 只，` q:`还剩多少只没送？`
- everyday 加：`🚌 校车接了 ${a} 位小朋友，又上来 ${b} 位，` q:`车上一共多少位小朋友？`；everyday 减：`🚕 出租车上有 ${a} 位乘客，到站下了 ${b} 位，` q:`车上还剩多少位？`
- adventure 加：`🚀 火箭收集了 ${a} 颗星星，又收集了 ${b} 颗，` q:`一共收集多少颗星星？`；adventure 减：`🛸 飞碟带了 ${a} 个外星朋友，送回家 ${b} 个，` q:`还剩多少个外星朋友？`

（完整 36 条加减 + 9 庆祝 + 3 飞车 + 3×6 称号在实现计划里逐条给出，spec 只锁规格与语气。）

## 6. 引擎改动（最小接线，保 C3）

1. `garage.js` 新增纯函数 `Garage.vehicleFamily(vehicleId)`（内部一张 `VEHICLE_FAMILY` 表，未知→`'general'`）；index.html 新增 `currentFamily()` 包装（§4）。
2. `generateQuestion`：`const preferTag = currentPlayer ? PLAYERS[currentPlayer].preferTag : null;` → `const preferTag = currentFamily();`（变量名沿用，传给不变的 `pickStory`）。新族故事按 §5 追加进 `STORIES_ADD/STORIES_SUB`，`tag` 用族 id。
3. `showCelebrate`：将 police/ambulance 分支改为查表 `CELEBRATE_BY_FAMILY = { police:CELEBRATE_POLICE, ambulance:CELEBRATE_AMBULANCE, fire:…, everyday:…, adventure:… }`；`isThemeQ = currentPlayer && curQ.tag && curQ.tag===currentFamily()`；命中则用 `CELEBRATE_BY_FAMILY[curQ.tag]`，否则 `CELEBRATE_TEXTS`。police/ambulance 数组内容**不动**（只是被纳入表）。
4. `submitAnswer`：`isThemeMatch = !!q.tag && q.tag===currentFamily()`。`showVehicleRush` 调用：
   - family ∈ {police,ambulance}：**保持现状调用**（vType=q.tag，**不传 opts** → 默认警笛+原文案，零回归）。
   - family ∈ {fire,everyday,adventure}：`showVehicleRush(equippedEmoji, q.tag, streak, goNext, { text: RUSH_TEXT[q.tag], sound: SFX_BY_FAMILY[q.tag] })`。
5. `tagScores`：初始化对象与 `getPlayerStats.totalTagScores` 增加 `fire/everyday/adventure` 三键（值 0）；计分 `tagScores[q.tag||'general']++` 逻辑不变（多了几个 key）。
6. `getTitle`：`TITLES` 增 `fire/everyday/adventure` 三套六档；键选择改为 `VEHICLE_FAMILY[getPlayerGarage(playerId).equippedVehicle] || 'default'`（容错回退 `default`）。称号跟装备族走。

## 7. 勋章联动（+6 枚 → 28 → 34）

`ALL_MEDALS` 追加（仿 `police_10/30`，读 `st.totalTagScores.<family>`，单调累计）：

| id | icon | label | check |
|---|---|---|---|
| fire_10 | 🚒 | 消防小英雄 | st.totalTagScores && st.totalTagScores.fire >= 10 |
| fire_30 | 🧯 | 烈焰克星 | st.totalTagScores && st.totalTagScores.fire >= 30 |
| everyday_10 | 🚌 | 出行小达人 | st.totalTagScores && st.totalTagScores.everyday >= 10 |
| everyday_30 | 🎫 | 金牌司机 | st.totalTagScores && st.totalTagScores.everyday >= 30 |
| adventure_10 | 🏁 | 勇敢探险家 | st.totalTagScores && st.totalTagScores.adventure >= 10 |
| adventure_30 | 🛰️ | 太空英雄 | st.totalTagScores && st.totalTagScores.adventure >= 30 |

`medalStats`/`snapshotMedals` 已通用（spread `getPlayerStats`），只要 §6.5 让 `totalTagScores` 含新键即可，**无需改 medalStats**。静态占位 `已解锁 0 / 28` → `已解锁 0 / 34`（当前 28 枚 + 这 6 = 34；运行时本就用 `ALL_MEDALS.length`，仅静态文案）。6 个新图标与现有 28 枚无碰撞（5 岁靠图标区分）。现有 police/ambulance 勋章零回归。

## 8. 零回归保证（C3 细化）

默认装备 🚓 的乐乐 / 🚑 的昊昊：`currentFamily()` 返回 `police`/`ambulance`（= 旧 `preferTag`，因 garage DEFAULTS 与 preferTag 一致）→ 故事权重、`CELEBRATE_BY_FAMILY[police]`=原数组、`showVehicleRush` 走无 opts 默认分支（原警笛+原文案）、`tagScores.police`、`TITLES.police`、police/ambulance 勋章 —— 全部与改动前逐位一致。新行为仅在玩家主动换非默认车后出现。无玩家/异常 → `general`/`default` 回退（与现状等价）。

## 9. 测试与验收

- **纯逻辑单测**（`garage.js` 加纯函数 `Garage.vehicleFamily(vehicleId)`，`tests/garage.test.js` 覆盖映射全表 + 未知 id→'general'）。
- **验收标准**：
  1. **零回归**：清数据默认开局（乐乐/昊昊各一局），故事/庆祝/飞车+警笛/称号/tagScore/既有勋章与改动前一致；现有 garage tests 全绿。
  2. 乐乐装备 fire/everyday/adventure 任一车 → 该局故事明显出对应族（≥60% 命中，与现机制一致）、庆祝语/飞车文案/音效为该族、称号切到该族。
  3. 攒够族题数 → fire_10/everyday_10/adventure_10 等 6 枚勋章可解锁并参与车库/结算庆祝（复用已交付路径）；勋章柜 `/ 34`。
  4. 全程语音（新故事/庆祝经 speak/speakQueue 不截断）；静音静默；reduced-motion 飞车退化但状态/计分正确。
  5. 切回默认车 → 行为回到 police/ambulance（族随装备实时变）。
- 工具：`node --test tests/garage.test.js` + chrome-devtools MCP。

## 10. 可调项（评审/实现期）

具体故事文案与数量（每族加减各 6，可微调 4~8）、庆祝/飞车措辞、各族音效音色参数、称号文案、勋章 icon/阈值（10/30）。
