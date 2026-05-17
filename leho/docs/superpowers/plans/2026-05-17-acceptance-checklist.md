# 验收清单：车库解锁系统（第一期）

- 日期：2026-05-17
- 任务：Task 15 最终验收（仅验证，不修改 index.html / garage.js）
- 规格参考：`docs/superpowers/specs/2026-05-17-garage-unlock-system-design.md` §13

---

## 一、Node 单元测试结果

命令：`node --test tests/garage.test.js`

```
✔ CATALOG has unique ids and required fields
✔ CATALOG contents match spec §7
✔ DEFAULTS per player
✔ migrationCoins caps at 60, floors, never negative
✔ initEntry seeds defaults + migration coins + migrated flag
✔ normalize: missing/!migrated -> fresh init (migration once)
✔ normalize: repairs bad fields, keeps defaults owned, clamps coins
✔ initEntry/normalize: unknown playerId falls back to lele defaults
✔ normalize: non-object raw -> fresh init
✔ normalize: dedupes corrupt duplicate owned ids
✔ economy constants
✔ roundCoins: per-correct + perfect bonus only when all correct
✔ roundCoins: impossible correct>total does not grant perfect bonus
✔ owns / isEquipped
✔ canAfford boundary: equal price counts as affordable
✔ unlock: returns NEW entry, deducts, adds owned; null on bad input
✔ equip: sets slot by kind, requires owned, returns NEW entry; null otherwise
✔ isEquipped / canAfford return false for unknown id
✔ voice-line builders produce exact spec §10.2 strings

ℹ tests 19 | pass 19 | fail 0 | cancelled 0 | skipped 0 | todo 0
ℹ duration_ms 42.23ms
```

**结果：19/19 全部通过。**

---

## 二、§13 验收标准逐项核对（Chrome DevTools MCP 对 file:///…/index.html）

### C1 — 全程语音 + 队列不截断 + 静音静默

**PASS**

- 方法：安装 speechSynthesis stub（`window.__spoken` 记录播报文字），清空 storage，点击「开始冒险」进入选玩家页。
- 实测 `window.__spoken`：
  ```
  ["谁来挑战？点击你的头像吧！", "乐乐有 0 个金币", "昊昊有 0 个金币"]
  ```
  正好 3 条，与 §10.2 队列文案吻合，未互相截断。
- 点「🔧 我的车库」（乐乐），spoken 新增：`"这是乐乐的车库，你有 0 个金币，快来挑一辆车吧！"` ✓
- 点正在装备的警车格：spoken = `["你正在开警车，真酷！"]` ✓
- 点不够买的飞碟格（0 金币 vs 60 价格）：spoken = `["飞碟要 60 个金币，你还差 60 个，再答对几题就能买啦！"]` ✓
- 点静音按钮（`#mute-btn` class 变为 `"muted"`，文本变 🔇），再触发任意操作：`window.__spoken = []`，无新条目 ✓

---

### C2 — 赚币/解锁/装备动画 + reduced-motion 退化不报错

**PASS**

- 方法：seed lele coins=60，进车库，点击火箭格两次解锁。
  - 第一次：spoken `"火箭，要 40 个金币，你够啦，再点一下就解锁！"`，cell class 变为 `"garage-cell locked afford confirm"` ✓
  - 第二次：spoken `"太棒了！火箭是你的啦！"`；`#celebrate-overlay.className = "show"`；`.garage-spotlight` DOM 元素出现；localStorage lele.coins = 20，owned 包含 `"rocket"` ✓
- Reduced-motion 测试：通过 `navigate_page` initScript monkey-patch `matchMedia` 使 `prefers-reduced-motion` 返回 `matches: true`，seed coins=60，解锁直升机（🚁，价格 30）：
  - spoken `"太棒了！直升机是你的啦！"`；lele.coins = 30；owned 包含 `"heli"` ✓
  - `list_console_messages(types: ["error"])` → 无错误 ✓

---

### C3 — 星星零回归（⭐/星星塔/排行榜完全不变）

**PASS**

- 方法：清空 storage，以乐乐身份完整打完一局（5 题全对）。
- 结果页：`5/5`，5 颗 ⭐，显示「本局 +15 🪙」，`comboAvatar('lele')` 包含 🚓（默认装备保持不变）✓
- 点「排行榜」：star-tower (`#star-tower-arena`) 和 medal-cabinet 均正常渲染；`#tower-dino` 头像 innerHTML 包含 🚓🦕 ✓
- 进度条 `#progress-dino` = `"🚓"`，`#quiz-dino` innerHTML 含 🚓 ✓
- 答题/飞车特效未见 JS 错误（`list_console_messages(["error"])` 为空）✓

---

### C4 — 金币/解锁/装备按玩家隔离 + 每局只入账一次

**PASS**

- 方法：清空 storage，乐乐打完一局 5 题全对（5×2+5=15 金币）。
- 实测：`lele.coins = 15` ✓（精确等于 15，非 30）
- `haohao` 条目：`{coins: 0, owned: ["ambulance","trex"], equippedVehicle: "ambulance", equippedDino: "trex", migrated: true}`
  - haohao 金币为 0（从未参与，符合「undefined OR coins 0」条件）✓
  - haohao 从未参与答题，owned 仅默认项 ✓
- 幂等性：结果页「本局 +15 🪙」文案仅出现一次，saveRecord 路径唯一；金币精确 15 不重复进账 ✓

---

### C5 — 装备传播（选玩家/答题/进度条/排行榜一致）

**PASS**

- 方法：seed lele.equippedVehicle = `"rocket"`（owned 含 rocket），重载页面。
- `window.comboAvatar('lele')` HTML：`<span class="combo-avatar"><span>🚀</span><span class="dino-badge">🦕</span></span>` ✓
- 进入答题页：`#quiz-dino` innerHTML 含 🚀；`#progress-dino.textContent = "🚀"` ✓（§8 绕过点 1 & 2 均已修复）
- 打完一局后进排行榜：`#star-tower-arena .tower-dino` innerHTML 含 🚀 ✓
- 飞车特效使用装备头像而非写死 🚓/🚑（已参数化，默认值保留原行为）✓

---

### C6 — CATALOG 单一来源 / 无 emoji 编码假阴

**PASS**

- 方法：seed lele coins=99，进车库，点击 race（🏎️，含 U+FE0F 变体选择符）格两次解锁，再点一次装备。
- 解锁后 localStorage 检查：
  ```json
  { "owned": ["police","brontosaurus","rocket","race"], "equippedVehicle": "race" }
  ```
  owned 包含字符串 `"race"`（id），不含 🏎️ 字符 ✓
- `window.comboAvatar('lele')` HTML 含 `🏎️` ✓（CATALOG 解析 id → emoji 无编码问题）
- equippedVehicle 存储为 `"race"` 而非 emoji，确认 id-based 存储无 emoji 编码坑 ✓

---

### C7 — 无语音也可操作（C4 视觉通道）

**PASS**

- 方法：启用静音（`#mute-btn` class = `"muted"`）+ stub speechSynthesis.speak 为 no-op，seed lele coins=30，进车库。
- 视觉线索验证（无任何音频）：
  - fire 格（价格 15，coins 30 ≥ 15）：cell class = `"garage-cell locked afford"`，内部有 `<span class="gc-price-afford">🪙 15</span>`（绿色）✓
  - ufo 格（价格 60，coins 30 < 60）：cell class = `"garage-cell locked"`，内部有 `<span class="gc-price-noafford">🪙 60</span>`（红色）✓
  - race 格（当前装备）：class = `"garage-cell owned equipped"`，显示 `✓ 正在开` ✓
- 纯点击解锁 fire（两次点击）：`lele.coins = 15`，`owned` 包含 `"fire"` ✓
- 点击装备 fire：`lele.equippedVehicle = "fire"` ✓
- 全程无音频，操作全部成功 ✓

---

### C8 — localStorage 离线 + 迁移仅一次 + 清除重置

**PASS（含一处规格偏差，见备注）**

- 方法：设置 8 条 lele 记录（每条 score:5/total:5），totalScore=40；移除 dino_math_garage；重载页面。
- 进入乐乐车库：`lele.coins = 40` = min(60, floor(40×1)) ✓，`lele.migrated = true` ✓
- 再次进出车库：`lele.coins` 仍为 40（未重复补偿，migrated flag 起效）✓
- 点「清除所有记录」（stub confirm=true）：
  - `dino_math_records` 已删除 ✓
  - `dino_math_garage` 重置：`lele.coins=0`，`lele.owned=["police","brontosaurus"]`，`lele.equippedVehicle="police"` ✓
  - 所有数据回归初始状态，再次进入车库将以 totalScore=0 起点 ✓
- **规格偏差（轻微）**：清除后 `lele.migrated` 仍为 `true`（实现保留了 migrated 标志）。规格 §12 称「migrated 重置」，但由于 records 已清（totalScore=0），即便 migrated=false 重新迁移也只能得到 0 金币，功能结果与规格预期完全一致。属实现细节偏差，不影响用户可观测行为。

---

## 三、总体评定

**DONE_WITH_CONCERNS（一处轻微规格偏差）**

| # | 标准 | 结论 | 关键证据 |
|---|------|------|---------|
| 1 | 全程语音 + 队列不截断 + 静音静默 | **PASS** | spoken = 3 条队列文案，muted 后 spoken = [] |
| 2 | 赚币/解锁/装备动画 + reduced-motion 退化 | **PASS** | celebrate-overlay.show + spotlight + coins 正确扣减；reduced-motion 下无 JS 错误 |
| 3 | 星星零回归 | **PASS** | 5/5 + ⭐×5 + star-tower + medal-cabinet 正常渲染；无 JS 错误 |
| 4 | 玩家隔离 + 每局入账一次 | **PASS** | lele.coins=15 精确；haohao.coins=0 且从未参与 |
| 5 | 装备传播至所有头像位 | **PASS** | quiz-dino / progress-dino / leaderboard tower-dino 均含 🚀 |
| 6 | CATALOG 单一来源 / 无 emoji 编码假阴 | **PASS** | owned=["race"]（id），equippedVehicle="race"，comboAvatar 含 🏎️ |
| 7 | 无语音也可操作 | **PASS** | gc-price-afford(绿)/gc-price-noafford(红)/equipped(勾) 可视；纯点击完成解锁装备 |
| 8 | localStorage 离线 + 迁移仅一次 + 清除重置 | **PASS** | migration coins=40；二次进入 coins 不变；clear 后 coins=0/defaults only |

**唯一 known-limitation**：C8 清除数据后 `migrated` 标志保留 `true`（规格称应重置）。由于同时清空了 records，重新迁移金额也是 0，功能等价，但与规格 §12 措辞有轻微出入。建议在后续迭代中在 clear 路径里将 `migrated` 置为 `false`（约 1 行改动）。
