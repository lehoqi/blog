# 主题冒险闯关验收清单

- 日期：2026-05-28
- 关联设计：`docs/superpowers/specs/2026-05-28-themed-adventure-upgrade-design.md`
- 用途：实现和验收时逐项检查，防止遗漏动画、音效、语音和非文字可玩性。

## 1. 逻辑一致性

- [x] 一局仍然只有 5 题。
- [x] 答错不推进冒险进度。
- [x] 每题只有首次答对推进一次冒险进度。
- [x] 答对瞬间锁住提交入口，快速连点确认按钮或连按 Enter 不会重复计分、重复金币、重复动画。
- [x] 第 1-4 题播放冲刺段。
- [x] 第 5 题进入 Boss/终点段。
- [x] Boss 登场每局只出现一次，重试第 5 题不重复打断。
- [x] 通关结算只执行一次，不重复发金币、星星或勋章。
- [x] 冒险状态只存在当前局内存，不改变 records/garage 存档结构。
- [x] 清除记录后，现有 records/names/garage 行为不变。

## 2. 酷炫动画覆盖

- [x] 冒险入场有明显动画：座驾入场、主题背景、粒子或闪光。
- [x] 答对第 1-4 题有明显冲刺动画：车辆移动、拖尾、速度线或粒子。
- [x] 答对冲刺主动画不少于 600ms，且座驾有明显屏幕位移。
- [x] 连对有增强：速度、粒子、震屏、闪光或音效层次随 streak 增强。
- [x] 第 5 题 Boss 登场有强反馈：压暗、放大、砸入、警报或鼓点。
- [x] Boss 登场和通关奖励都是全屏级表现，不是局部小弹窗。
- [x] Boss 受击或终结技有主题差异，不是五族完全同一效果。
- [x] Boss 击败有明显结果：爆炸、净化、逃跑、碎裂或星云化。
- [x] 通关奖励有大反馈：烟花、金币雨、车辆凯旋或全屏庆祝。
- [x] 每个关键动画至少包含 2 类反馈：屏幕级运动/遮罩、粒子/闪光、震屏/缩放、主题音效。
- [x] reduced-motion 下动画降级但状态正确。
- [x] 所有动画都有超时兜底，不会卡住下一题或结果页。

## 3. 音效覆盖

- [x] 冒险入场播放主题启动音效。
- [x] 答对冲刺播放主题冲刺音效。
- [x] 连对增强时音效也增强或叠加。
- [x] Boss 登场播放警报、鼓点或低频冲击音。
- [x] Boss 受击播放攻击/撞击/治疗/喷水/爆裂等音效。
- [x] Boss 击败播放胜利音效。
- [x] 金币雨或奖励播放奖励音效。
- [x] 音效不受语音静音按钮控制，保持现有警笛一致性。
- [x] AudioContext 不可用时静默失败，不影响流程。

## 4. 语音覆盖

- [x] 每个新增按钮或可见提示都有对应语音。
- [x] 冒险入场目标有语音。
- [x] 地图主题和 Boss 名称有语音。
- [x] Boss 登场有语音。
- [x] 第 5 题语音使用单一队列播报 Boss 提示和题目朗读，不被后续 `speak()` 打断。
- [x] 答对冲刺或阶段推进有语音，且不掐断题目语音。
- [x] Boss 击败和通关奖励有语音。
- [x] 结果页新增冒险文案接入 `speakQueue`。
- [x] 多句播报使用 `speakQueue`，不连续裸调 `speak` 互相截断。
- [x] 语音静音后，所有语音静默，流程仍可玩。

## 5. 非文字可玩性

- [x] 主题靠 emoji、颜色、背景和音效区分，不只靠文字标题。
- [x] 进度靠 5 段进度点、座驾位置或数字表达。
- [x] Boss 状态靠大图标、颜色、动作或数字表达。
- [x] Boss/终点使用 5 段能量槽表达蓄力和最终一击，不实现含糊的多回合血量系统。
- [x] 奖励靠金币、星星、烟花、勋章图标表达。
- [x] 儿童不读文字也能知道：现在在第几步、是否答对、是否打败 Boss、是否获得奖励。
- [x] 新增文字不遮挡题目数字、答案区或数字键盘。

## 6. 五族完整性

- [x] `police` 有地图、Boss、冲刺、终结、音效、语音。
- [x] `ambulance` 有地图、Boss、冲刺、终结、音效、语音。
- [x] `fire` 有地图、Boss、冲刺、终结、音效、语音。
- [x] `everyday` 有地图、Boss、冲刺、终结、音效、语音。
- [x] `adventure` 有地图、Boss、冲刺、终结、音效、语音。
- [x] 每个 family 的 `ADVENTURE_THEMES` 配置满足字段契约：名称、地图 emoji、Boss emoji、Boss 名、入场语音、4 条阶段语音、Boss 语音、胜利语音和音效函数齐全。
- [x] 装备不同 family 座驾后，冒险主题自动切换。
- [x] 未知或异常 family 安全回退，不报错卡死。

## 7. 回归检查

- [x] `node --test tests/garage.test.js` 通过。
- [x] 现有题目生成、主题题概率、tagScores 不回归。
- [x] 现有金币、星星、勋章、排行榜不回归。
- [x] 车库装备后头像、题库主题、冒险主题一致。
- [x] 默认乐乐警车、昊昊救护车行为合理。
- [x] 答题主流程不再同时叠加 `showCelebrate + showVehicleRush + 冒险动画` 三套长动画；车库解锁等非答题流程仍可复用现有 `showVehicleRush`。
- [x] 移动端宽度下文字和动画不互相覆盖。

## Verification notes

- 2026-05-28 final pass ran `node --test tests/garage.test.js tests/adventure.test.js tests/index-adventure-flow.test.js`: 32 tests passed, 0 failed.
- Added `tests/index-adventure-flow.test.js` after final review to lock three regressions: three-wrong-answer recovery cannot bypass adventure settlement, `showResult()` is guarded before records/coins are saved, and final victory speech queues after the current Boss/question narration.
- Final browser smoke used `http://localhost:4175/index.html` with cache-busting query strings.
- Browser full happy paths were completed for `police`, `fire`, and `everyday`; `ambulance` and `adventure` were verified by current equipment selection plus HUD/run-state rendering, and by the structural theme-field test.
- Browser evidence: HUD rendered; start -> player -> quiz worked; wrong answer stayed on question 1 with score 0; correct answers locked OK during animation; repeated OK was blocked while locked; non-final answers produced sparks and advanced one dot/question; final answer showed the finisher overlay and reached one result page.
- Final `4175` smoke evidence after the speech queue fix: wrong answer did not advance; first correct answer locked OK and advanced from question 1 to question 2 exactly once; full five-question run reached one result page with `5 / 5` and `本局 +15 🪙`.
- Final `4175` smoke evidence after review fixes: three wrong answers stayed on question 1 with score 0, adventure step 0, and no visible next-question advance path; the same run then answered correctly through a single `5 / 5` result page with `本局 +15 🪙`.
- Mobile layout evidence: temporary 360 x 640 viewport had no horizontal overflow and no overlap between adventure HUD/title, question digits, answer display, or numpad.
- Result regression evidence: a full result-to-leaderboard path showed five stars, +15 coins, Lele leaderboard score, unlocked medals, and a working leaderboard page.
- Five-family equipment evidence: `police` -> `警车追捕`/`🚓`/`🚧`; `ambulance` -> `急救救援`/`🚑`/`🦠`; `fire` -> `消防救援`/`🚒`/`🔥`; `schoolbus` -> `安全到站`/`🚌`/`🚦`; `rocket` -> `太空探险`/`🚀`/`☄️`.
- Source-diff evidence: adventure changes do not edit the storage key definitions, clear-record handlers, question generator tables, or leaderboard renderer. Existing record/garage paths are still called only from the same result/garage/settings flows.
- Audio and voice were not aurally verified in this environment. Checked audio/voice items are structural source checks: sound functions are called from the relevant animation paths; `voiceMuted` gates `speak`/`speakQueue` only; sound helpers do not check `voiceMuted`; Boss question speech uses a single queue for stage lead-in, Boss prompt, and read text.
- Reduced-motion was not manually emulated. It was structurally verified by source inspection: adventure intro, step, boss entrance, and finisher check `prefers-reduced-motion: reduce` and call their completion callback via short timers; normal animation paths also have timeout fallbacks.
