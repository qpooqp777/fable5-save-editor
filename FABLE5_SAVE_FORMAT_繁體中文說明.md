# Fable 5 存檔格式完整說明文件

> 適用版本：v2 | 最後更新：2026-06-22 | 繁體中文

---

## 📋 目錄

1. [頂層結構](#1-頂層結構)
2. [角色基本資料 (p)](#2-角色基本資料-p)
3. [基礎能力值 (p.base)](#3-基礎能力值-pbase)
4. [獎勵與分配 (p.alloc / p.panacea)](#4-獎勵與分配)
5. [背包物品 (p.inv)](#5-背包物品-pinv)
6. [裝備欄位 (p.eq)](#6-裝備欄位-peq)
7. [技能系統 (p.skills)](#7-技能系統-pskills)
8. [Buff 效果 (p.buffs)](#8-buff-效果-pbuffs)
9. [變身系統 (p.poly)](#9-變身系統-ppoly)
10. [夥伴系統 (p.allies)](#10-夥伴系統-pallies)
11. [召喚獸 (p.summon)](#11-召喚獸-psummon)
12. [異常狀態 (p.statuses)](#12-異常狀態-pstatuses)
13. [冷卻系統 (p.cds)](#13-冷卻系統-pcds)
14. [祝福系統 (p.blessings)](#14-祝福系統-pblessings)
15. [衍生屬性 (p.d)](#15-衍生屬性-pd)
16. [戰鬥設定 (p.config)](#16-戰鬥設定-pconfig)
17. [地圖系統 (p.lastMapByCat)](#17-地圖系統-plastmapbycat)
18. [圍城戰 (p.siege)](#18-圍城戰-psiege)
19. [進度標記](#19-進度標記)
20. [套裝效果](#20-套裝效果)
21. [Pandora 商店 (p.pandoraMarket)](#21-pandora-商店)
22. [地圖狀態 (ms)](#22-地圖狀態-ms)
23. [物品 ID 分類對照表](#23-物品-id-分類對照表)
24. [技能 ID 對照表](#24-技能-id-對照表)
25. [安全修改建議](#25-安全修改建議)

---

## 1. 頂層結構

```json
{
  "v": 2,          // 存檔版本（目前為 v2）
  "p": { ... },    // 玩家資料（主要編輯區）
  "ms": { ... },   // 地圖狀態
  "ticks": 513091  // 遊戲經過的 tick 數（1 tick ≈ 1 遊戲內時間單位）
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `v` | number | 存檔格式版本，目前固定為 `2` |
| `p` | object | 玩家角色完整資料 |
| `ms` | object | 當前地圖狀態（怪物、目標等） |
| `ticks` | number | 遊戲運行時間，影響冷卻計算、Pandora刷新等 |

---

## 2. 角色基本資料 (p)

```json
{
  "cls": "mage",         // 職業
  "name": "三上悠亞",     // 角色名稱（可為 null）
  "lv": 53,              // 等級
  "exp": 34370037,       // 經驗值
  "gold": 76597779,      // 金錢（G）
  "hp": 41466.2,         // 當前 HP（可為小數）
  "mhp": 41466.2,        // 最大 HP
  "mp": 22584,           // 當前 MP
  "mmp": 26090,          // 最大 MP
  "avatar": "女法師",     // 頭像識別
  "dead": false           // 是否死亡
}
```

| 欄位 | 類型 | 說明 | 安全範圍 |
|------|------|------|----------|
| `cls` | string | 職業 ID：`warrior`/`mage`/`ranger`/`paladin`/`rogue`/`cleric`/`darkknight`/`illusionist` | 有效職業 ID |
| `name` | string\|null | 角色名稱 | 任意字串 |
| `lv` | number | 等級 | 1~99999 |
| `exp` | number | 經驗值 | ≥0 |
| `gold` | number | 金錢 | 0~999999999 |
| `hp`/`mhp` | number | HP（支援小數） | hp ≤ mhp |
| `mp`/`mmp` | number | MP | mp ≤ mmp |
| `dead` | boolean | 死亡狀態 | true/false |

---

## 3. 基礎能力值 (p.base)

```json
{
  "str": 999,  // 力量 Strength — 影響近戰傷害、負重
  "dex": 999,  // 敏捷 Dexterity — 影響遠程傷害、命中、躲閃
  "con": 999,  // 體質 Constitution — 影響 HP、護甲
  "int": 18,   // 智力 Intelligence — 影響魔法傷害、MP
  "wis": 20,   // 感知 Wisdom — 影響魔法命中、MP回復、魔抗
  "cha": 8     // 魅力 Charisma — 影響商店價格、夥伴
}
```

> ⚠️ 遊戲中正常上限為 99（含獎勵），超過 99 通常為修改值。超過 999 可能導致異常。

---

## 4. 獎勵與分配

### 獎勵點數
```json
{ "bonus": 0 }  // 未分配的獎勵點數
```

### 屬性分配 (p.alloc)
```json
{ "str": 0, "dex": 0, "con": 0, "int": 0, "wis": 0, "cha": 0 }
```
每升一級獲得的分配點數，手動分配到各屬性。

### 萬靈藥加點 (p.panacea)
```json
{ "str": 0, "dex": 0, "con": 0, "int": 0, "wis": 0, "cha": 0 }
```
使用萬靈藥（Panacea）永久增加的屬性值。

| 欄位 | 說明 |
|------|------|
| `panaceaUsed` | 已使用的萬靈藥總次數 |

---

## 5. 背包物品 (p.inv)

物品陣列，每個物品結構：

```json
{
  "id": "wpn_manawand",   // 物品 ID（決定物品類型與基礎屬性）
  "uid": "5p2ox9ict",     // 唯一識別別碼（隨機9碼）
  "cnt": 1,                // 數量（堆疊）
  "en": 10,                // 強化等級（Enhance）
  "bless": false,          // 祝福（Blessed）
  "anc": false,            // 遠古（Ancient）— 更高基礎屬性
  "attr": "fire3",         // 屬性附魔（false 或字串如 "fire3"）
  "seteff": false,         // 套裝效果啟用
  "lock": false,           // 鎖定（防止意外出售/丟棄）
  "junk": false            // 標記為垃圾（可被批量刪除）
}
```

### attr 屬性附魔格式

| 格式 | 說明 | 範例 |
|------|------|------|
| `{元素}{等級}` | 元素屬性 + 強度 | `fire3`=火屬3級, `water2`=水屬2級 |
| 元素代碼 | `fire`=火, `water`=水, `earth`=地, `wind`=風, `ice`=冰, `light`=光, `dark`=暗 |
| `false` | 無屬性 | — |

### 物品 ID 前綴分類

| 前綴 | 類別 | 說明 |
|------|------|------|
| `wpn_` | ⚔️ 武器 | 各類武器（劍、杖、弓等） |
| `amr_` | 🛡️ 鎧甲 | 身體鎧甲 |
| `arm_` | 🛡️ 護甲 | 護甲類裝備 |
| `hlm_` | 🪖 頭盔 | 頭部裝備 |
| `shd_` | 🛡️ 盾牌 | 盾牌類 |
| `clk_` | 🧥 披風 | 披風/斗篷 |
| `glv_` | 🧤 手套 | 手部裝備 |
| `bot_` | 👢 靴子 | 腳部裝備 |
| `acc_` | 💍 飾品 | 戒指/飾品 |
| `amu_` | 📿 項鍊 | 項鍊類 |
| `blt_` | 🪢 腰帶 | 腰帶類 |
| `bk_` | 📜 卷軸 | 法術卷軸 |
| `scroll_` | 📜 卷軸 | 強化/變身卷軸 |
| `potion_` | 🧪 藥水 | 消耗品 |
| `panacea_` | 🧪 萬靈藥 | 屬性藥水 |
| `mat_` | 📦 材料 | 合成材料 |
| `item_` | 📦 道具 | 通用道具 |
| `quest_` | 📋 任務 | 任務物品 |
| `new_item_` | ❓ 新物品 | 未識別新物品 |

---

## 6. 裝備欄位 (p.eq)

```json
{
  "wpn": { "id": "wpn_manawand", "en": 10, "attr": "fire3", ... },  // 武器
  "helm": null,          // 頭盔
  "armor": { ... },      // 鎧甲
  "shield": null,        // 盾牌
  "cloak": null,         // 披風
  "tshirt": null,        // T卹（內衣）
  "gloves": null,        // 手套
  "boots": { ... },      // 靴子
  "ring1": { ... },      // 戒指 1
  "ring2": null,         // 戒指 2
  "ring3": null,         // 戒指 3
  "ring4": null,         // 戒指 4
  "amulet": { ... },     // 項鍊
  "belt": { ... },       // 腰帶
  "arrow": null          // 箭矢
}
```

| 欄位 | 說明 | 可裝備類型 |
|------|------|-----------|
| `wpn` | 主武器 | wpn_ 類物品 |
| `helm` | 頭盔 | hlm_ 類物品 |
| `armor` | 鎧甲 | amr_ 類物品 |
| `shield` | 盾牌 | shd_ 類物品 |
| `cloak` | 披風 | clk_ 類物品 |
| `tshirt` | 內衣 | 特殊內衣物品 |
| `gloves` | 手套 | glv_ 類物品 |
| `boots` | 靴子 | bot_ 類物品 |
| `ring1`~`ring4` | 戒指×4 | acc_ / rng_ 類物品 |
| `amulet` | 項鍊 | amu_ 類物品 |
| `belt` | 腰帶 | blt_ / acc_ 類物品 |
| `arrow` | 箭矢 | 箭矢類物品 |

> 裝備物品結構與背包物品相同，但 `cnt` 固定為 1。

---

## 7. 技能系統 (p.skills)

```json
{
  "skills": ["sk_lightarrow", "sk_heal1", "sk_firearrow", ...],
  "grantedSkills": []  // 天賦/被動技能
}
```

技能 ID 格式為 `sk_{名稱}`，完整對照表見[第24節](#24-技能-id-對照表)。

---

## 8. Buff 效果 (p.buffs)

```json
{
  "haste": 659,              // 加速術 — 剩餘 tick
  "brave": 0,                // 勇猛術
  "blue": 487,               // 藍藥 Buff
  "cautious": 52,            // 謹慎術
  "elfcookie": 0,            // 精靈餅乾
  "poly": 187,               // 變身術
  "shield": 0,               // 護盾術
  "sk_resurrection": 0,      // 復活術
  "sk_charm": 0,             // 魅惑術
  "sk_magic_shield": 0,      // 魔法護盾
  "sk_shield": 621,          // 盾擊 Buff
  "sk_reveal": 142,          // 偵測術
  "sk_ench_wpn": 1223,       // 附魔武器
  "sk_holy_wpn": 624,        // 聖武術
  "sk_sunlight": 6625,       // 陽光術
  "sk_load_up": 1225,        // 負重術
  "sk_shield2": 1018,        // 強化盾
  "sk_haste_spell": 0,       // 加速咒
  "sk_summon": 1416,         // 召喚持續
  "sk_greater_haste": 659,   // 強加速
  "sk_dex_up": 1078,         // 敏捷增強
  "sk_str_up": 885,          // 力量增強
  "sk_holy_dash": 63,        // 聖衝
  "sk_bless_wpn": 636,       // 祝福武器
  "sk_zombie": 0,            // 殭屍
  "sk_fire_prison": 1,       // 火牢
  "taming": 0,               // 馴服
  "sk_meditation": 21,       // 冥想
  "sk_holy_barrier": 10,     // 聖障
  "sk_berserk": 970          // 狂暴
}
```

- 值為 **剩餘 tick 數**，0 = 未生效
- 非 0 值 = Buff 正在生效
- 設為 0 可清除該 Buff

---

## 9. 變身系統 (p.poly)

```json
{
  "poly": {
    "c": "text-yellow-400",  // CSS 顏色類（顯示用）
    "n": "黑長者",            // 變身名稱
    "mgd": 2,                 // 魔法傷害加成
    "sp": 1,                  // 特殊加成
    "mpr": 2,                 // MP 回復加成
    "spd": 15                 // 速度加成
  }
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `c` | string | Tailwind CSS 顏色類（純顯示用） |
| `n` | string | 變身形態名稱 |
| `mgd` | number | 魔法傷害倍率加成 |
| `sp` | number | 特殊能力加成 |
| `mpr` | number | MP 回復加成 |
| `spd` | number | 速度加成 |

> 設為 `null` 可清除變身狀態。

---

## 10. 夥伴系統 (p.allies)

```json
{
  "allies": [
    {
      "cls": "mage",           // 夥伴職業
      "name": "2三上悠亞",      // 夥伴名稱
      "lv": 53,                // 等級
      "hp": 41466.2,           // 當前 HP
      "mhp": 41466.2,          // 最大 HP
      "base": { ... },         // 能力值（同玩家）
      "skills": [ ... ],       // 技能
      "eq": { ... },           // 裝備
      ...                      // 完整角色資料
    }
  ]
}
```

> 夥伴資料結構與玩家 `p` 相同，為完整角色資料副本。

---

## 11. 召喚獸 (p.summon)

```json
{
  "summon": {
    "skId": "sk_summon",       // 召喚技能 ID
    "n": "召喚：魔狼",          // 名稱
    "dmgDice": [1, 15],        // 傷害骰 [最小, 最大]
    "interval": 10,             // 攻擊間隔（tick）
    "ele": "none",              // 元素屬性
    "kind": "melee",            // 攻擊類型：melee/ranged/magic
    "hitLvOff": 10,             // 命中等級偏移
    "dmgDiv": 5,                // 傷害除數
    "dmgLvDiv": 25,             // 等級傷害除數
    "elemScale": 20,            // 元素縮放
    "proc": null,               // 觸發效果
    "cd": 8,                    // 冷卻時間
    "endTick": 527250           // 召喚結束 tick
  }
}
```

> 設為 `null` 清除召喚獸。

---

## 12. 異常狀態 (p.statuses)

```json
{
  "stun": 0,          // ⚡ 暈眩
  "freeze": 0,        // ❄️ 冰凍
  "stone": 0,         // 🪨 石化
  "poison": 0,        // ☠️ 中毒
  "poisonDmg": 0,     // 中毒傷害
  "poisonTick": 0,    // 中毒持續 tick
  "burn": 0,          // 🔥 燃燒
  "burnDmg": 0,       // 燃燒傷害
  "burnTick": 0,      // 燃燒持續 tick
  "scald": 0,         // ♨️ 燙傷
  "scaldDmg": 0,      // 燙傷傷害
  "scaldTick": 0,     // 燙傷持續 tick
  "bleed": 0,         // 🩸 流血
  "bleedDmg": 0,      // 流血傷害
  "bleedTick": 0,     // 流血持續 tick
  "sleep": 0,         // 😴 睡眠
  "silence": 0,       // 🔇 沉默
  "paralyze": 0,      // ⚡ 麻痺
  "magicseal": 0,     // 🔮 魔封
  "armorBreak": 0,    // 💔 破甲
  "slowAtk": 0,       // 🐢 攻速降低
  "cleave": 0         // ⚔️ 劈砍
}
```

- 值為 **剩餘持續時間**（tick），0 = 未中狀態
- `Dmg` 為每 tick 傷害量，`Tick` 為剩餘次數

---

## 13. 冷卻系統 (p.cds)

```json
{
  "cds": {
    "pot": 0,         // 藥水冷卻
    "atkSk": 1,       // 攻擊技能冷卻
    "healSk": 0,      // 治癒技能冷卻
    "purifySk": 0     // 淨化技能冷卻
  },
  "magicShieldCd": 0,    // 魔法護盾冷卻
  "reviveScrollCd": 0,    // 復活卷軸冷卻
  "manualCd": {           // 手動技能冷卻
    "sk_charm": 0
  }
}
```

---

## 14. 祝福系統 (p.blessings)

```json
{
  "blessings": {
    "brave": 1782111331765,     // 勇猛祝福（timestamp ms）
    "support": 1782111333186,   // 支援祝福
    "precise": 1782111335554,   // 精準祝福
    "blaze": 1782111337306      // 烈焰祝福
  }
}
```

- 值為 **Unix timestamp（毫秒）**，代表祝福到期時間
- 設為 0 = 未受祝福
- 設為未來時間 = 啟用祝福

| 祝福 | 效果 |
|------|------|
| `brave` | 勇猛 — 增加攻擊力 |
| `support` | 支援 — 增加治療效果 |
| `precise` | 精準 — 增加命中率 |
| `blaze` | 烈焰 — 增加火屬傷害 |

---

## 15. 衍生屬性 (p.d)

由基礎能力值 + 裝備 + Buff 計算出的實際戰鬥屬性：

| 欄位 | 說明 | 類型 |
|------|------|------|
| `str`~`cha` | 最終屬性（含裝備/Buff） | number |
| `meleeDmg` | 近戰傷害 | number |
| `meleeHit` | 近戰命中 | number |
| `meleeCrit` | 近戰暴擊率 | number(%) |
| `meleeCritDmg` | 近戰暴擊傷害加成 | number(%) |
| `rangedDmg` | 遠程傷害 | number |
| `rangedHit` | 遠程命中 | number |
| `rangedCrit` | 遠程暴擊率 | number(%) |
| `rangedCritDmg` | 遠程暴擊傷害加成 | number(%) |
| `magicDmg` | 魔法傷害 | number |
| `magicHit` | 魔法命中 | number |
| `magicCrit` | 魔法暴擊率 | number(%) |
| `magicCritDmg` | 魔法暴擊傷害加成 | number(%) |
| `extraDmg` | 額外傷害 | number |
| `extraHit` | 額外命中 | number |
| `extraMp` | 額外 MP | number |
| `mpReduce` | MP 消耗減少 | number(%) |
| `ac` | 護甲值 (Armor Class) | number |
| `mr` | 魔法抵抗 (Magic Resist) | number |
| `er` | 躲閃率 (Evasion Rate) | number(%) |
| `dr` | 傷害減免 (Damage Reduction) | number(%) |
| `resFire` | 火焰抗性 | number(%) |
| `resWater` | 水系抗性 | number(%) |
| `resEarth` | 地系抗性 | number(%) |
| `resWind` | 風系抗性 | number(%) |
| `magicDrNonEle` | 非元素魔法減傷 | number(%) |
| `hpRegenMax` | HP 最大回復量 | number |
| `hpR` | HP 回復/回合 | number |
| `mpR` | MP 回復/回合 | number |
| `aspd` | 攻擊速度 (Attack Speed) | number |
| `spdMult` | 速度倍率 | number |
| `weightCur` | 當前負重 | number |
| `weightLimit` | 最大負重 | number |
| `immStone` | 免疫石化 | boolean |
| `immPoison` | 免疫中毒 | boolean |

---

## 16. 戰鬥設定 (p.config)

```json
{
  "setPot": "potion_heal",      // 自動喝藥水 ID
  "setHpPot": "70",              // HP 閾值（%）
  "setAutoBuyPot": false,        // 自動購買藥水
  "selAtkSkill": "",             // 攻擊技能 ID
  "setMpAtk": "50",              // 攻擊 MP 閾值（%）
  "selHealSkill": "",            // 治癒技能 ID
  "setMpHeal": "50",             // 治癒 MP 閾值（%）
  "selConvertSkill": "",         // 轉換技能 ID
  "setHpConvert": "50",          // 轉換 HP 閾值（%）
  "setHaste": false,             // 自動施放加速術
  "setAutoBuyHaste": false,      // 自動購買加速卷軸
  "setBrave": false,             // 自動施放勇猛術
  "setAutoBuyBrave": false,      // 自動購買勇猛卷軸
  "setBlue": false,              // 自動施放藍藥 Buff
  "setAutoBuyBlue": false,       // 自動購買藍藥
  "setCautious": false,          // 自動施放謹慎術
  "setAutoBuyCautious": false,   // 自動購買謹慎卷軸
  "setElfcookie": false,         // 自動施放精靈餅乾
  "setAutoBuyElfcookie": false,  // 自動購買精靈餅乾
  "setPoly": false,              // 自動施放變身術
  "setAutoBuyPoly": false,       // 自動購買變身卷軸
  "setMagicbarrier": false,      // 自動施放魔盾
  "setTeleport": false,          // 自動施放傳送術
  "setAutoBuyTeleport": false,   // 自動購買傳送卷軸
  "setAutoBuyArrow": false,      // 自動購買箭矢
  "autoBuffSkills": {}           // 自動 Buff 技能對應
}
```

---

## 17. 地圖系統 (p.lastMapByCat)

```json
{
  "lastMapByCat": {
    "village": "town_heine",        // 村莊
    "wild": "hidden_cave",          // 野外
    "dungeon": "zone_14",           // 地城
    "special": "fafurion_lair",     // 特殊區域
    "tower": "pride_51_60",         // 驕傲之塔
    "siege": "kent_inner",          // 圍城
    "castle": "town_kent_castle"    // 城堡
  },
  "lastBattleMap": "hidden_cave"    // 最後戰鬥地圖
}
```

| 類別 | 說明 | 範例地圖 |
|------|------|----------|
| `village` | 村莊/城鎮 | `town_talking`, `town_heine` |
| `wild` | 野外區域 | `talking_island`, `hidden_cave` |
| `dungeon` | 地下城 | `zone_1`~`zone_XX` |
| `special` | 特殊區域 | `fafurion_lair` |
| `tower` | 驕傲之塔 | `pride_1_10`~`pride_51_60` |
| `siege` | 圍城戰場 | `kent_inner` |
| `castle` | 城堡內部 | `town_kent_castle` |

---

## 18. 圍城戰 (p.siege)

```json
{
  "siege": {
    "active": false,                // 是否進行中
    "gateKilled": true,             // 城門已破壞
    "towerKilled": true,            // 塔樓已破壞
    "gateHp": -912,                 // 城門 HP（負數=已破）
    "towerHp": -403,                // 塔樓 HP（負數=已破）
    "endTime": 1782027092697,       // 結束時間（timestamp ms）
    "kills": 18,                    // 擊殺數
    "result": "win",                // 結果："win"/"lose"/null
    "cooldownUntil": 1782113492697, // 冷卻結束時間
    "rewardPending": false,         // 是否有待領取獎勵
    "victoryUntil": 1782113492697,  // 勝利持續至
    "city": "kent",                 // 所屬城市
    "victoryCity": "kent",          // 勝利城市
    "accCdUntil": 0                 // 帳號冷卻結束
  }
}
```

---

## 19. 進度標記

| 欄位 | 類型 | 說明 |
|------|------|------|
| `bloodPledge` | string\|null | 血之誓約所屬（如 `"esti"`） |
| `sherineWorld` | boolean | 珊娜世界是否開啟 |
| `prideBeatJenis` | boolean | 是否擊敗傑尼斯 |
| `demonTempleOpen` | boolean | 惡魔神殿是否開啟 |
| `flameAffinity` | number | 火焰親和度 |
| `trialStage` | number | 試煉階段 |
| `ismaelAccUsed` | boolean | 伊士麥爾帳號是否已使用 |
| `mastery` | string\|null | 大師職業 |
| `masteryQuest` | string\|null | 大師任務 |
| `masteryChangeCnt` | number | 大師轉職次數 |
| `prideRank` | object | 驕傲戰役排名 `{best, last, isNew}` |
| `prideRankSherine` | object | 珊娜驕傲戰役排名 |
| `tracking` | string\|null | 追蹤目標 |

---

## 20. 套裝效果

內部布林標記，記錄目前啟用的套裝效果：

| 欄位 | 套裝名稱 |
|------|----------|
| `_setRedLion5` | 🦁 紅獅 5 件套 |
| `_setWhiteBird5` | 🕊️ 白鳥 5 件套 |
| `_setIron3` | ⚙️ 鐵 3 件套 |
| `_setIron5` | ⚙️ 鐵 5 件套 |
| `_setBeauty5` | 💎 美之 5 件套 |
| `_setGale5` | 🌪️ 疾風 5 件套 |
| `_setMoon5` | 🌙 月之 5 件套 |
| `_setApprentice5` | 📖 學徒 5 件套 |
| `_setWitch5` | 🧙 女巫 5 件套 |
| `_setShadow3` | 🌑 暗影 3 件套 |
| `_setShadow5` | 🌑 暗影 5 件套 |

> 這些通常由遊戲自動計算，手動修改可能被覆蓋。

---

## 21. Pandora 商店

```json
{
  "pandoraMarket": {
    "id": "wpn_dagger2",      // 販售物品 ID
    "price": 1570,             // 價格（G）
    "weight": 200,             // 物品重量
    "setTick": 510100          // 上架 tick
  },
  "pandoraAnnounce": null      // 公告（通常為 null）
}
```

---

## 22. 地圖狀態 (ms)

```json
{
  "ms": {
    "current": "town_heine",    // 當前地圖 ID
    "mobs": [null, null, null],  // 地圖上的怪物
    "targetIdx": 2,              // 當前目標怪物索引
    "forceBoss": false,          // 是否強制 Boss
    "spawnAt": [513091, ...],    // 怪物生成 tick
    "suppressSiegeBoss": true,   // 抑制圍城 Boss
    "graceCdAt": [...],          // 寬限冷卻
    "pledgeBless": [...]         // 誓約祝福
  }
}
```

---

## 23. 物品 ID 分類對照表

### 武器 (wpn_)
| ID | 名稱 |
|----|------|
| `wpn_dagger1` | 短刀 Lv.1 |
| `wpn_dagger2` | 短刀 Lv.2 |
| `wpn_manawand` | 魔力法杖 |
| `wpn_katana` | 武士刀 |
| `wpn_alien` | 異星武器 |
| `wpn_berserker` | 狂戰士武器 |
| `wpn_dual_steel` | 鋼鐵雙刃 |
| `wpn_dual_dark` | 暗黑雙刃 |
| `wpn_claw_steel` | 鋼鐵爪 |
| `wpn_giantaxe` | 巨斧 |
| `wpn_battleaxe` | 戰斧 |
| `wpn_longsword` | 長劍 |
| `wpn_2hsword` | 雙手劍 |
| `wpn_scimitar` | 彎刀 |

### 鎧甲/護甲 (amr_/arm_)
| ID | 名稱 |
|----|------|
| `amr_jacket` | 夾克衫 |
| `amr_plate` | 板甲 |
| `arm_42`~`arm_105` | 各級護甲 |

### 卷軸 (bk_/scroll_)
| ID | 名稱 |
|----|------|
| `bk_lightarrow` | 光箭術 |
| `bk_heal1` | 初級治癒術 |
| `bk_sunlight` | 陽光術 |
| `bk_shield` | 護盾術 |
| `bk_teleport` | 傳送術 |
| `bk_windblade` | 風刃術 |
| `bk_holy_wpn` | 聖武術 |
| `scroll_armor` | 護甲卷軸 |
| `scroll_weapon` | 武器卷軸 |
| `scroll_poly` | 變身卷軸 |

### 藥水 (potion/panacea)
| ID | 名稱 |
|----|------|
| `potion_heal` | 治療藥水 |

### 材料 (mat_)
| ID | 名稱 |
|----|------|
| `mat_silverore` | 銀礦石 |

---

## 24. 技能 ID 對照表

### 攻擊技能
| ID | 名稱 | 屬性 |
|----|------|------|
| `sk_lightarrow` | 光箭術 | 光 |
| `sk_icearrow` | 冰箭術 | 冰 |
| `sk_firearrow` | 火箭術 | 火 |
| `sk_windblade` | 風刃術 | 風 |
| `sk_holy_wpn` | 聖武術 | 聖 |
| `sk_cold_shiver` | 寒顫術 | 冰 |
| `sk_poison_curse` | 毒咒術 | 毒 |
| `sk_dark_blind` | 暗盲術 | 暗 |
| `sk_undead_bane` | 不死剋星 | 聖 |
| `sk_rock_prison` | 岩牢術 | 地 |
| `sk_ice_spike` | 冰刺術 | 冰 |
| `sk_earthquake` | 地震術 | 地 |
| `sk_dark_shadow` | 暗影術 | 暗 |
| `sk_break` | 破甲術 | — |
| `sk_thunder` | 雷擊術 | 風 |
| `sk_fire_storm` | 火風暴 | 火 |
| `sk_quake` | 大地震 | 地 |
| `sk_blaze` | 烈焰術 | 火 |
| `sk_fire_prison` | 火牢術 | 火 |

### 輔助技能
| ID | 名稱 | 說明 |
|----|------|------|
| `sk_heal1` | 初級治癒術 | 回復 HP |
| `sk_heal_mid` | 中級治癒術 | 回復 HP |
| `sk_heal2` | 高級治癒術 | 回復 HP |
| `sk_shield` | 護盾術 | 增加 AC |
| `sk_shield2` | 強化盾 | 增加 AC |
| `sk_teleport` | 傳送術 | 傳送至村莊 |
| `sk_haste_spell` | 加速咒 | 提升 ASPD |
| `sk_greater_haste` | 強加速 | 大幅提升 ASPD |
| `sk_ench_wpn` | 附魔武器 | 武器屬性附加 |
| `sk_reveal` | 偵測術 | 偵測隱形 |
| `sk_antidote` | 解毒術 | 解除中毒 |
| `sk_summon` | 召喚術 | 召喚魔狼 |
| `sk_mana_drain` | 魔力吸取 | 吸取 MP |
| `sk_charm` | 魅惑術 | 控制敵人 |
| `sk_resurrection` | 復活術 | 復活死亡 |
| `sk_magic_shield` | 魔法護盾 | 魔法減傷 |
| `sk_meditation` | 冥想術 | MP 回復 |
| `sk_holy_barrier` | 聖障術 | 聖屬護盾 |
| `sk_abs_barrier` | 絕對屏障 | 完全防禦 |
| `sk_berserk` | 狂暴術 | 增傷減防 |

### 增益技能
| ID | 名稱 |
|----|------|
| `sk_dex_up` | 敏捷增強 |
| `sk_str_up` | 力量增強 |
| `sk_holy_dash` | 聖衝 |
| `sk_bless_wpn` | 祝福武器 |
| `sk_slow` | 減速術 |
| `sk_disease` | 疾病術 |
| `sk_cancel` | 解除魔法 |
| `sk_vampire` | 吸血術 |
| `sk_weaken` | 虛弱術 |
| `sk_sleep_mist` | 催眠霧 |
| `sk_load_up` | 負重術 |
| `sk_sunlight` | 陽光術 |
| `sk_zombie` | 殭屍術 |
| `sk_mummy_curse` | 木乃伊詛咒 |
| `sk_energy_sense` | 能量感知 |

---

## 25. 安全修改建議

### ✅ 可安全修改
- **金錢 (`gold`)**：直接修改數值
- **經驗值 (`exp`)**：修改後會影響升級
- **物品數量 (`inv[].cnt`)**：直接修改
- **裝備強化 (`eq[].en` / `inv[].en`)**：修改強化等級
- **技能 (`skills[]`)**：新增/移除技能 ID
- **Buff 剩餘回合 (`buffs.*`)**：設為 0 清除，設大值延長
- **冷卻 (`cds.*`)**：設為 0 重置

### ⚠️ 修改需注意
- **能力值 (`base.*`)**：超過 999 可能導致溢位錯誤
- **等級 (`lv`)**：修改後需配合經驗值
- **地圖 ID (`lastMapByCat`)**：錯誤 ID 可能導致卡住
- **物品 ID (`inv[].id`)**：必須為遊戲中存在的 ID
- **屬性附魔 (`attr`)**：格式需正確（如 `fire3`）
- **衍生屬性 (`d.*`)**：通常由遊戲重新計算，手動修改可能被覆蓋

### ❌ 不建議修改
- **套裝效果標記 (`_set*`)**：由遊戲自動計算
- **`_equipHaste` / `_setPoly`**：內部狀態
- **`ticks`**：影響所有時間相關機制
- **`ms` (地圖狀態)**：可能導致遊戲崩潰
- **夥伴完整資料 (`allies[]`)**：結構複雜，容易出錯

---

## 📝 備份提醒

> **修改前請務必備份原始存檔！**
> 建議使用擴充功能的「匯出 JSON」功能保存一份原始檔案。

---

*本文件由 Fable 5 Save Editor 自動生成 | v2.0*
