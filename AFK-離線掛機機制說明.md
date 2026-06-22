# 放置天堂-遺忘之島 — 離線掛機機制技術說明

> 原始碼版本：`idle-lineage-class-20260621-2200`（單一 `index.html`，約 110 萬字元）
> 撰寫日期：2026-06-22

---

## 一、核心架構概覽

遊戲採用**固定頻率主迴圈 + tick 債務累積**的架構，讓前景即時運算與背景/離線補跑共用同一組邏輯，只差畫面是否刷新。

### 1.1 關鍵常數

| 變數 | 值 | 說明 |
|------|-----|------|
| `TICK_MS` | `100`（ms） | 一個邏輯 tick 代表 0.1 秒真實時間 |
| `MAX_CATCHUP_MS` | `300000`（5 分鐘） | **單次**主迴圈最多補算 5 分鐘，防止長時間離線後一次性模擬過久導致卡頓 |
| `AWAY_SUMMARY_MIN_MS` | `3000`（3 秒） | 累積補跑達 3 秒以上才輸出「掛機期間獲得」摘要訊息 |

### 1.2 狀態物件

```js
let state = {
  running: false,   // 遊戲是否正在進行
  ticks: 0,         // 累計邏輯 tick 數（絕對計數器）
  pDmgTick: 0,      // 玩家攻擊計時器（每 tick +1，達到 aspdTicks 時清零並觸發攻擊）
  ff: false,        // 「補跑中」旗標（true=不刷新畫面/不輸出戰鬥訊息）
  inTick: false     // 是否正在 tick 執行中（防止重入）
};
```

### 1.3 主迴圈計時器

```js
let _loopLast = null;   // 上次主迴圈執行的 performance.now() 時間戳
let _tickDebt = 0;      // 尚未換算成 tick 的累積毫秒數（「時間債務」）
```

---

## 二、計時器啟動（`startGameTimers`）

載入存檔或開始遊戲時，呼叫 `startGameTimers()` 註冊兩組計時器：

| 計時器 | 間隔 | 用途 |
|--------|------|------|
| `setInterval(gameLoop, 100)` | 每 100ms | 主遊戲迴圈 |
| `setInterval(saveGame, 300000)` | 每 5 分鐘 | 自動存檔到 `localStorage` |

> 📌 啟動時會清除既有計時器再重新註冊，確保整個工作階段只有一組。

---

## 三、主迴圈（`gameLoop`）

每 100ms 被呼叫一次，核心邏輯分為三種情境：

### 3.1 流程圖

```
gameLoop()
  │
  ├─ 計算 elapsed = now - _loopLast
  ├─ elapsed 上限截斷至 MAX_CATCHUP_MS（5 分鐘）
  ├─ _tickDebt += elapsed
  ├─ n = floor(_tickDebt / TICK_MS)   // 本次應跑多少 tick
  ├─ _tickDebt -= n * TICK_MS
  │
  ├─ if n <= 0 → return（無需跑 tick）
  │
  ├─ if n === 1（正常即時，每 100ms 跑一 tick）
  │    ├─ flushAwaySummary()     // 若之前有累積補跑所得，統一輸出
  │    ├─ state.inTick = true
  │    ├─ tick()
  │    ├─ settleDeadMobs()
  │    └─ state.inTick = false
  │
  └─ if n > 1（需要補跑多個 tick = 背景/離線）
       ├─ 記錄 _invBefore（背包物品快照）
       ├─ 記錄 _goldBefore（金幣快照）
       ├─ state.ff = true        // 🔑 開啟補跑模式：不刷新畫面
       ├─ for (k = 0; k < n; k++)
       │    ├─ tick()
       │    └─ settleDeadMobs()  // 每 tick 結束即清算死亡
       ├─ state.ff = false
       ├─ 計算背包增量 → 累積到 _awayAcc.items
       ├─ 計算金幣增量 → 累積到 _awayAcc.gold
       ├─ _awayAcc.ticks += n
       └─ updateUI() / renderMobs() / renderTabs()  // 補跑結束後統一刷新一次
```

### 3.2 關鍵設計

1. **時間債務制**：不依賴 setInterval 精確度。每 100ms 觸發 gameLoop，累加實際經過時間，再除以 TICK_MS 計算應補跑的 tick 數。即使瀏覽器降頻（tab 在背景被限到 1Hz），回來時也能一次補完中間所有 tick。

2. **單次上限保護**：`elapsed` 被截斷到 `MAX_CATCHUP_MS`（5 分鐘 = 3000 tick）。這意味著即使離線 10 小時，每次 gameLoop 最多只補算 5 分鐘的進度，下一個 100ms 再補 5 分鐘，以此類推直到追上。

3. **補跑模式旗標 `state.ff`**：補跑期間設為 `true`，讓所有 render 函數跳過畫面刷新、logCombat/logSys 不輸出訊息，大幅提升效能。

---

## 四、單一 Tick 邏輯（`tick`）

每個 tick（0.1 秒）執行一次，包含完整的遊戲邏輯。以下依執行順序說明：

### 4.1 Tick 執行流程

```
tick()
  │
  ├─ ① 前置檢查：!running / player.dead → return
  ├─ ② state.ticks++（絕對 tick 計數）
  ├─ ③ 城堡護衛 tick
  ├─ ④ 手動技能冷卻遞減
  │
  ├─ ⑤ 玩家異常狀態倒數
  │    ├─ stun/freeze/stone/paralyze/sleep → canAct = false
  │    ├─ cleave 到期 → calcStats() 重算攻速
  │    └─ evilAura 到期 → calcStats() 還原 AC/ER
  │
  ├─ ⑥ 自然恢復（每 160 tick = 16 秒）
  ├─ ⑦ 攻城戰計時（每 10 tick = 1 秒）
  ├─ ⑧ 潘朵拉黑市刷新（每 100 tick = 10 秒）
  │
  ├─ ⑨ 玩家 DoT 傷害（中毒/灼燒/燙傷/出血）
  │    └─ 各自依 poisonTick/burnTick/scaldTick/bleedTick 間隔結算
  │
  ├─ ⑩ 持續傷害型增益（冰雪颶風/火牢等 Storm Buff）
  │
  ├─ ⑪ 狀態警報顯示更新（僅即時模式 !state.ff）
  │
  ├─ ⑫ 法術冷卻遞減 + 自動施法嘗試（autoCastSpells）
  │
  ├─ ⑬ 每秒區塊（ticks % 10 === 0）
  │    ├─ 藥水冷卻遞減
  │    ├─ 復活卷軸/魔法屏障冷卻
  │    ├─ 所有 buff 倒數（每秒 -1）
  │    ├─ buff 到期重算 calcStats()
  │    └─ 自動行動 autoActions()（買藥/喝藥/自動Buff等）
  │
  ├─ ⑭ 出怪判定（三槽排程系統）
  │    ├─ 純 BOSS 房：3 分鐘後刷新
  │    ├─ 軍王之室：5 秒後刷新
  │    ├─ 一般地圖：5 秒（日光術 1 秒 / 席琳世界加速）
  │    └─ mapState.spawnAt[i] 排程 → 到期 → spawnMob(i)
  │
  ├─ ⑮ 玩家攻擊
  │    ├─ state.pDmgTick++
  │    ├─ aspdTicks = floor(player.d.aspd × 10)
  │    ├─ slowAtk 則 ×2
  │    └─ pDmgTick >= aspdTicks → playerAttack() + 歸零
  │
  ├─ ⑯ 怪物行動（遍歷 3 槽）
  │    ├─ 被動怪滿血 → 跳過
  │    ├─ 延遲倒數（30 ticks = 3 秒）
  │    ├─ 怪物異常狀態處理（DoT/死亡判定）
  │    ├─ 被動回復（依 regenHp + regenEvery）
  │    ├─ 硬皮再生（每 10 秒恢復 3%）
  │    ├─ 冰凍/暈眩/石化/沉睡 → 跳過
  │    ├─ 隱身/無所遁形判定
  │    ├─ 血盟傳送術判定（HP<20%，10% 機率脫離）
  │    ├─ _atkCd-- → 到零 → enemyPhysicalAttack()
  │    ├─ 怪物技能施放（mag/mag2/mag3）
  │    └─ 緩速效果 +1 秒冷卻
  │
  ├─ ⑰ 召喚物/夥伴行動
  │    ├─ summonTick()（迷魅/召喚獸）
  │    └─ alliesTick()（傭兵盟友）
  │
  ├─ ⑱ 血盟祝福 tick
  │
  ├─ ⑲ HoT 持續回復（體力回復術/生命的祝福）
  │
  └─ ⑳ 夥伴攻擊（項圈犬類，每 20 tick = 2 秒）
       ├─ 項圈數量 = 攻擊次數
       ├─ 每次消耗 1 肉
       ├─ 命中判定 = d20 vs (等級+魅力+偏移-怪等級+怪AC)
       └─ 進化夥伴 10% 觸發附加法術
```

---

## 五、補跑所得累積機制（`_awayAcc`）

### 5.1 設計動機

背景 tab 被瀏覽器降頻後，每次 gameLoop 可能補跑數十~數千 tick。如果每次補跑都輸出獲得物品的訊息，會造成戰鬥日誌洗版。

### 5.2 累積流程

```
補跑開始（n > 1）
  ├─ 快照 _invBefore = 背包物品數量 { id: count }
  ├─ 快照 _goldBefore = player.gold
  │
  ├─ 執行 n 次 tick()（含擊殺掉寶、吃藥、賣出等一切邏輯）
  │
  └─ 補跑結束
       ├─ 快照 _invAfter = 背包物品數量
       ├─ 逐物品計算增量 delta = after - before
       │    └─ delta > 0 → _awayAcc.items[id] += delta
       │    └─ delta < 0（被消耗的）→ 也會累積（最終只顯示淨正值）
       ├─ 金幣增量 → _awayAcc.gold
       └─ _awayAcc.ticks += n
```

### 5.3 輸出時機（`flushAwaySummary`）

```
flushAwaySummary()
  ├─ if _awayAcc.ticks <= 0 → return
  ├─ if _awayAcc.ticks × TICK_MS >= 3000ms（累積 ≥ 3 秒）
  │    ├─ 遍歷 _awayAcc.items，找出 count > 0 的物品
  │    ├─ 輸出「掛機期間獲得：物品A ×3、物品B ×1」
  │    └─ 金幣不輸出日誌（已即時顯示於左側面板）
  └─ 清空 _awayAcc = { ticks:0, gold:0, items:{} }
```

> 📌 `flushAwaySummary` 在**回到即時時**（n===1 的那次 gameLoop）開頭被呼叫，而非補跑結束時。這確保只有真正回到前景才輸出摘要，避免中途再次補跑時重複輸出。

---

## 六、存檔機制（`saveGame` / `loadGame`）

### 6.1 自動存檔

每 **5 分鐘**自動呼叫 `saveGame()`。

存檔內容序列化為 JSON 寫入 `localStorage`：
```js
localStorage.setItem('lineage_idle_save_' + slot, JSON.stringify({
  v: SAVE_VERSION,    // 存檔版本號（用於遷移相容）
  p: player,          // 玩家完整物件（含背包、裝備、技能、狀態、自動化設定等）
  ms: mapState,       // 地圖狀態（當前地圖、三槽怪物、目標索引）
  ticks: state.ticks   // 絕對 tick 計數（確保召喚物/迷魅的 endTick 準確）
}));
```

### 6.2 存檔限制

| 限制 | 說明 |
|------|------|
| 死亡不存檔 | `player.dead === true` 時直接 return，避免卡死在死亡狀態 |
| 4 個存檔位 | `currentSlot = 1~4`，各自獨立的 localStorage 鍵 |
| 包含 UI 設定 | 所有自動化勾選框狀態一併存入 `player.config` |

### 6.3 讀檔流程（`loadGame`）

1. 從 `localStorage` 讀取 JSON
2. 還原 `player`、`mapState`、`state.ticks`
3. 強制設 `player.dead = false`（死亡時不存檔，但以防萬一）
4. **大量舊檔相容處理**（約 50+ 項遷移）：
   - 補全新增欄位（如魅力 cha、席琳世界、血盟等）
   - 修復重複 uid
   - 廢品記憶格式升級
   - 裝備負重改版自動卸下
   - 屬性詞綴格式校正
   - 召喚 buff 殘留清理
5. 還原自動化 UI 狀態
6. 重算能力值 `calcStats()`
7. 設定起始地圖（血盟成員回盟主村，其他回職業起始村）
8. 啟動計時器 `startGameTimers()`

---

## 七、攻擊速度與冷卻系統

### 7.1 玩家攻擊

```
攻擊間隔（ticks）= floor(player.d.aspd × 10)
  └─ slowAtk（寒冰吐息等）→ 間隔 ×2

每 tick：
  state.pDmgTick++
  if pDmgTick >= aspdTicks → playerAttack() + pDmgTick = 0
```

例如 `aspd = 0.8`（0.8 秒攻擊一次）：
- `aspdTicks = floor(0.8 × 10) = 8` ticks
- 每 8 tick（0.8 秒）攻擊一次

### 7.2 怪物攻擊

```
冷卻初始值 = floor(mob.atkSpd × 10)
每 tick：_atkCd--
if _atkCd <= 0 → 攻擊 → _atkCd 重置為初始值 + slowAdd（緩速+10 ticks）
```

### 7.3 夥伴（犬類）

固定每 **20 tick = 2 秒**行動一次，攻擊次數 = 項圈數量，每次消耗 1 肉。

### 7.4 傭兵/盟友

各自依 `_atkCd` 計時，法師型傭兵施法間隔約 20 ticks。

---

## 八、出怪排程系統

遊戲有三個怪物槽位（`mapState.mobs[0/1/2]`），每個槽位的出怪排程：

```
空槽出現時：
  mapState.spawnAt[i] = state.ticks + delay

每 tick 檢查：
  if state.ticks >= mapState.spawnAt[i] → spawnMob(i)
```

| 地圖類型 | 出怪延遲 | 備註 |
|----------|----------|------|
| 一般地圖 | 50 ticks（5 秒） | 日光術 → 10 ticks；席琳世界再 -10 ticks |
| 純 BOSS 房 | 1800 ticks（3 分鐘） | 不受任何加速影響 |
| 軍王之室 | 50 ticks（5 秒） | 特殊重生機制 `kbRoomRespawn()` |

> 📌 出怪排程以**邏輯 tick**（`state.ticks`）為時間基準，與主迴圈的補跑機制完全同步。背景/離線期間 tick 正常推進，怪物照常出現與戰鬥。

---

## 九、離線掛機實際運作情境

### 9.1 切換分頁（短時間，< 5 分鐘）

```
Tab A（遊戲）→ Tab B（其他）
  └─ 瀏覽器降低 Tab A 的 setInterval 頻率（可能降至 1Hz 或更低）

Tab B → Tab A
  └─ gameLoop 被觸發
       ├─ elapsed = 離開的實際時間（例如 30 秒）
       ├─ n = floor(30000 / 100) = 300 ticks
       ├─ 因 n > 1 → 進入補跑模式
       ├─ 跑 300 次 tick()（所有戰鬥、掉寶、出怪都正常計算）
       ├─ 記錄背包增量
       └─ 300 × 100ms = 30000ms ≥ 3000ms → 下次即時 tick 會輸出「掛機期間獲得」摘要
```

### 9.2 關閉瀏覽器（長時間）

```
關閉瀏覽器
  └─ 最後一次自動存檔的狀態被寫入 localStorage

重新開啟瀏覽器
  └─ loadGame() 讀取存檔
       ├─ 還原 player / mapState / state.ticks
       ├─ state.ticks 設為存檔時的值（例如 864000 = 24 小時）
       ├─ startGameTimers() 啟動
       └─ gameLoop 開始跑
            ├─ _loopLast = null（重置）
            ├─ 第一次 elapsed 會被截斷到 MAX_CATCHUP_MS = 5 分鐘
            └─ 每 100ms 補跑 5 分鐘，直到追上存檔時的 ticks 為止

⚠️ 實際行為：離線期間的戰鬥「不會」被補算。
   存檔只記錄離線瞬間的狀態，不記錄離線時間。
   重新載入後 ticks 從存檔值繼續，不會模擬離線期間。
   ⚠️ 但 afk-offline.js 外掛可能有補充處理（見下方）。
```

> **重要區分**：
> - **切換分頁**（未關閉頁面）：遊戲迴圈仍在背景跑（降頻但不停），回來後會補跑中間所有 tick。戰鬥、掉寶、出怪全部正常運作。
> - **關閉瀏覽器**：遊戲迴圈停止。下次載入從存檔繼續，**不補算離線期間**。

---

## 十、`afk-offline.js` 外掛

此遊戲附帶 `afk-offline.js` 外掛，可能對離線掛機有額外處理。以下為推測（需查看該檔案確認）：

- 可能記錄 `Date.now()` 到存檔或 localStorage
- 載入時計算離線時長，額外補跑對應 tick 數
- 或提供某種離線收益計算（如經驗值/金幣的時間乘算）

> 📌 原作者版本的核心邏輯**不含**離線收益——關閉瀏覽器就等於暫停。如果有離線收益，必然是 `afk-offline.js` 外掛的貢獻。

---

## 十一、效能保護機制

| 機制 | 說明 |
|------|------|
| `MAX_CATCHUP_MS` = 5 分鐘 | 防止一次性模擬過久 |
| `state.ff` 補跑旗標 | 補跑期間不刷新 DOM、不輸出戰鬥日誌 |
| `renderMobs` 前置檢查 | `if(state.ff) return` 跳過補跑期間的所有畫面更新 |
| `logCombat/logSys` 前置檢查 | 補跑期間靜音，不寫入 DOM |
| `settleDeadMobs` 延遲清算 | 擊殺先標記死亡，tick 結束後統一清算掉寶和出怪補位 |
| `_tickDebt` 時間債務 | 精確補算，不因 setInterval 不穩定而遺漏或重複 |

---

## 十二、流程圖總覽

```
                  ┌──────────────┐
                  │  setInterval │
                  │  (100ms)     │
                  └──────┬───────┘
                         ▼
                  ┌──────────────┐
                  │  gameLoop()  │
                  └──────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          n=0(等待)   n=1(即時)   n>1(補跑)
              │          │          │
              ▼          ▼          ▼
           return    flushAway  記錄背包快照
                     Summary    state.ff=true
                         │       ┌──────────┐
                    ┌────┴────┐  │ tick() × n│
                    ▼         ▼  │settleDead │
                  tick()  settle│ └──────────┘
                  settle  Mobs   │
                    │     │      ▼
                    ▼     ▼   計算背包增量
                  render     累積 _awayAcc
                    │         state.ff=false
                    ▼              │
                  回到即時         ▼
                               updateUI
                               renderMobs
                               renderTabs
```

---

*本文檔基於原始碼分析撰寫，所有邏輯直接從 `index.html` 提取。*
