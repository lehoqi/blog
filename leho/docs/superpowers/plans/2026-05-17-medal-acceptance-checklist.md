# 勋章扩充系统 — 最终验收清单

- 日期：2026-05-17
- 任务：Medal Task 5（最终验收），仅验证，不修改代码
- 参考规格：`docs/superpowers/specs/2026-05-17-medal-expansion-design.md` §8

---

## Step 1：单元测试

命令：`node --test tests/garage.test.js`

```
ℹ tests 22
ℹ pass 22
ℹ fail 0
ℹ duration_ms 49.38
```

**结果：全部 22 条通过，0 失败。**

覆盖：CATALOG 唯一性/必填字段、§7 内容校验、DEFAULTS、migrationCoins 上限/下限、initEntry、normalize（多种边界）、economy 常量、roundCoins（完美/不可能场景）、owns/isEquipped/canAfford 边界、unlock/equip 纯函数、voice-line builder 精确字符串、lifetimeCoins 单调性、ownedCount、ownsAll。

---

## Step 2：浏览器验收（chrome-devtools MCP vs `file:///…/index.html`）

### Criterion 1 — 旧 16 枚零回归 PASS

**方法：**
1. 种入 lele 2 条记录（`player:'lele', score:5, total:5, stars:5, tagScores:{police:5}`）→ 重载 → 打开排行榜。
2. 清除数据 → 重装语音桩 → 点击 `pick-lele` → 连续答对 5 题（全部 12+3=15 类型，自动解析 + 点击确认）→ 等待结算页。

**实测：**

- 勋章柜验证：seeding 后 `#medal-grid .medal-item.unlocked` = 4 枚，文本分别为：
  - `🎯 初次冒险 乐乐`（first_game）
  - `💯 满分达人 乐乐`（perfect）
  - `⭐ 10颗星星 乐乐`（stars_10）
  - `🚓 小小警长 乐乐`（police_10）
- 结算页新勋章：`#new-medal-box` 变为 `display:block`，`#new-medal-list` 含 `初次冒险` + `满分达人` 两枚。
- `window.__spoken` 含：`"哇！乐乐满分！你答对了全部5道题！你真是数学小天才！恭喜解锁新勋章：初次冒险、满分达人！"` — 包含"解锁"+"勋章"关键词。

**verdict：PASS**

---

### Criterion 2 — 28 枚显示，进度 X / 28 PASS

**方法：** `localStorage.clear()` → 重载 → 打开排行榜。

**实测：**
- `#medal-grid .medal-item` count = **28**
- `.medal-progress` textContent = **"已解锁 0 / 28 枚勋章"**
- `#medal-grid .medal-item.unlocked` count = **0**（新鲜数据）

**verdict：PASS**

---

### Criterion 3 — 车库当场庆祝 PASS

**方法：**
1. 种入 lele coins=60、owned=[police, brontosaurus]（默认2件）→ 重载 → 安装语音桩 → 打开 lele 车库。
2. 点击 `[data-id=rocket]` 第一次（confirm 阶段） → 第二次（购买）→ 等待 7 s。
3. 种入 lele owned = 全部11辆车 + brontosaurus + trex + dragon → 重载 → 打开排行榜。

**实测（in-place celebration）：**
- 首次：rocket 点击后 coins 从 60 → 20（扣 40），`window.__spoken` 含：`"获得新勋章！第一次解锁"`
- 旧字段验证：7s 后语音队列确认"第一次解锁"出现，无截断。

**实测（排行榜校验集齐）：**
- `#medal-grid .medal-item.unlocked` 含（仅车库类4枚）：
  - `🔓 第一次解锁 乐乐`（first_unlock）
  - `🚙 小小收藏家 乐乐`（collector_5）
  - `🏰 车库大师 乐乐`（garage_master）
  - `🐲 驯龙高手 乐乐`（dragon_rider）

**verdict：PASS**

---

### Criterion 4 — 金币勋章单调（花光金币后不变灰） PASS

**方法：**
1. 种入 lele 4条记录（score=5, total=5 每条）→ lifetimeCoins = 4×15 = **60**（≥50 触发 coin_saver_50）。
2. 种入 lele garage.coins = **5**（远低于 50）→ 重载 → 打开排行榜。
3. `medalStats('lele')` 返回 `{lifetimeCoins:60, coinsNow:5}` → coin_saver_50 解锁 ✓
4. 将 garage.coins 设为 **0** → 重载 → 重新打开排行榜。

**实测：**
- 步骤 2 后：`medalStats('lele')` = `{lifetimeCoins:60, coinsNow:5}` — 两个字段独立。
- coin_saver_50（小财主）在排行榜中 **UNLOCKED**（6 枚已解锁之一）。
- coins 归零后重载：`{lifetimeCoins:60, coinsNow:0}`；coin_saver_50 **依然 UNLOCKED**。

**verdict：PASS**

---

### Criterion 5 — 语音队列 / 静音 / reduced-motion PASS

**方法：**
- 语音队列：清除 localStorage → 重载 → 安装语音桩 → 点击"开始冒险"进入玩家选择页 → 等 500 ms。
- 静音：点击 `#mute-btn` → 再次触发导航动作（btn-start click）。
- reduced-motion：monkey-patch `window.matchMedia` 使 `(prefers-reduced-motion: reduce)` 返回 `matches:true` → 在车库页购买 ambulance（两次点击）→ 等待 3 s → 检查 console errors。

**实测：**

**语音队列（进入玩家选择页，前3句顺序）：**
```
["谁来挑战？点击你的头像吧！", "乐乐有 0 个金币", "昊昊有 0 个金币"]
```
- 顺序正确，无截断，无额外内容插入。

**静音：**
- 点击 `#mute-btn` 前：icon=🔊，class=""
- 点击后：icon=🔇，class="muted"
- 随后触发 btn-start 导航：`window.__spoken` 新增 0 条（静音生效）。

**reduced-motion（购买 ambulance）：**
- `localStorage.dino_math_garage.lele.owned` 新增 `"ambulance"`，coins 60→45（状态已提交）。
- `window.__spoken` 含 `"获得新勋章！第一次解锁"`（勋章语音仍触发）。
- `list_console_messages(types:["error","warn"])` = **无任何错误**。

**verdict：PASS**

---

### Criterion 6 — 清除记录后所有勋章归零 PASS

**方法：** 在排行榜页 stub `window.confirm = () => true` → 点击 `#btn-clear-data` → 等待 500 ms → 复查排行榜。

**实测（在已有勋章状态下）：**
- 清除前：1 枚已解锁，进度"已解锁 1 / 28 枚勋章"
- 清除后（同页面）：
  - `#medal-grid .medal-item.unlocked` count = **0**
  - `.medal-progress` textContent = **"已解锁 0 / 28 枚勋章"**
  - `localStorage.getItem('dino_math_records')` = **null**
  - `localStorage.getItem('dino_math_garage')` = 默认值（lele coins:0, owned:[police,brontosaurus]; haohao owned:[ambulance,trex]）

**verdict：PASS**

---

## 总体结论

| Criterion | 结果 |
|---|---|
| 1. 旧16枚零回归 + 结算新勋章播报 | PASS |
| 2. 28枚显示，进度 X / 28 | PASS |
| 3. 车库当场庆祝 + 集齐勋章 | PASS |
| 4. 金币勋章单调（lifetimeCoins 不随消费变灰） | PASS |
| 5. 语音队列 / 静音 / reduced-motion 无报错 | PASS |
| 6. 清除记录后所有勋章归零 | PASS |

**整体结论：DONE** — 全部 6 项验收标准均通过，无失败项，无遗留问题。

node 单测：22/22 全绿。浏览器验收：6/6 PASS。本次为纯验证，未修改 index.html 或 garage.js。
