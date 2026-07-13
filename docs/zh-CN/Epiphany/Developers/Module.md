# 模块 Module

模块是独立、完整的技能树单元。每个模块由独立的数据包 JSON 文件定义，包含名称、描述、解锁条件、初始状态、心得列表与选择 / 完成奖励。

> 本页介绍 Module 数据包格式。其他数据包类型:[Insight](Insight.md) / [Epiphany](Epiphany.md) / [Path](Path.md)。

## 文件位置

```
data/<namespace>/epiphany/module/<path>.json
```

- `<namespace>`:你的模组 / 数据包命名空间(如 `mymod`)
- `<path>`:可以是单层文件名,也可以是子文件夹结构
- **模块的注册 ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/module/combat.json` → `mymod:combat`
  - `data/mymod/epiphany/module/class/warrior.json` → `mymod:class/warrior`

## 完整样例

```jsonc
{
    "name": "Saber",                                    // 可选
    "description": "手持刀剑的职阶",  // 可选
    "icon": "minecraft:textures/item/diamond_sword.png",  // 可选
    "condition": {                                     // 可选
        "type": "epiphany:or",
        "conditions": [
            { "type": "epiphany:kill_entity", "entity": "#minecraft:zombies", "count": 3 },
            { "type": "epiphany:block_broken", "block": "#minecraft:base_stone_overworld", "count": 100 }
        ]
    },
    "condition_description": "击杀 3 只亡灵 或 挖掘 100 个石头",  // 可选
    "initial_state": "locked",                         // 可选，默认为 selectable
    "on_select_reward": {                              // 可选
        "type": "epiphany:item",
        "item": "minecraft:shield",
        "count": 1
    },
    "on_select_reward_description": "获得一面盾牌",    // 可选
    "on_complete_reward": {                            // 可选
        "type": "epiphany:aptitude",
        "amount": 200
    },
    "on_complete_reward_description": "+200 阅历",     // 可选
    "insights": [                                      // 可选，默认空
        { "id": "epiphany:weapon_mastery", "depth": 0 },
        { "id": "epiphany:shield_wall",   "depth": 0 },
        { "id": "epiphany:battle_cry",    "depth": 0 },
        { "id": "epiphany:whirlwind",     "depth": 0 }
    ],
    "weight": 75                                       // 可选，默认 100
}
```

## 文本组件与 i18n

`name` / `description` / `*_description` 字段均为 Minecraft 的 [Component](https://minecraft.wiki/w/JSON_text) 文本组件，支持三种写法：

```jsonc
"name": "战士"                                       // 1. 纯字符串(等价于 literal)
"name": { "text": "战士", "color": "gold" }          // 2. 带样式的 literal
"name": { "translate": "mymod.module.combat.name" }  // 3. 翻译键(查 lang 文件)
```

::: tip i18n
当不填写 `name` / `description` / `*_description` 字段时，系统会自动回退到约定的翻译键，以此实现多语言：

```
module.<namespace>.<path>.<field>
```

例如模块 `mymod:combat` 的 `name` 缺省 → 自动用 `module.mymod.combat.name` 作为翻译键查 lang 文件。

你只需在 `assets/<namespace>/lang/zh_cn.json` 中提供翻译：

```json
{
    "module.mymod.combat.name": "Saber",
    "module.mymod.combat.description": "手持刀剑的职阶",
    "module.mymod.combat.condition_description": "击杀 3 只亡灵 或 挖掘 100 个石头"
}
```

若 lang 文件中**也未定义**该键，Minecraft 会显示原始 key 字符串（如 `module.mymod.combat.name`）。

**适用字段一览**（各文档同名字段相同规则）：
- 所有类型：`name` / `description`
- Module：额外支持 `condition_description` / `on_select_reward_description` / `on_complete_reward_description`
- Insight：额外支持 `reward_description`
- Epiphany：额外支持 `condition_description` / `reward_description`
:::

## 字段说明

### `name`（可选）

- 类型：`Component`（字符串、样式对象或翻译键）
- 默认：缺省时回退翻译键 `module.<ns>.<path>.name`（详见上方"文本组件与 i18n"）

### `description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `module.<ns>.<path>.description`
- 显示在模块卡片与详情中，用于向玩家说明模块的设定与玩法

### `icon`（可选）

- 类型：`ResourceLocation`，指向资源包中的纹理文件
- 默认：走**三级自动回退**（详见下方）

::: tip 图标自动回退
当 JSON 显式指定 icon 时直接使用该路径。缺省时按以下顺序自动寻找:

1. **JSON 显式** → 用指定的 `ResourceLocation`
2. **缺省** → 自动拼接路径 `textures/gui/<type>/<registryId>.png`，尝试加载该文件
   - Module:查 `textures/gui/module/<path>.png`
   - Insight:查 `textures/gui/insight/<path>.png`
   - Epiphany:查 `textures/gui/epiphany/<path>.png`
3. **上述 PNG 也不存在** → 回退到游戏内默认物品图标（Module = `writable_book`、Insight = `diamond`、Epiphany = `goat_horn`）

例如：模块注册 ID 为 `mymod:combat`，JSON 未写 icon → 系统自动尝试 `assets/mymod/textures/gui/module/combat.png`；若该资源也不存在，则最终使用 `writable_book` 的物品图标。
:::

::: warning 
图标是路径，而非物品 ID。`icon` 字段是**资源包纹理路径**，不是物品 / 方块 ID。写 `"icon": "minecraft:diamond_sword"` 是错的（不会被解析）。

正确写法:
```jsonc
"icon": "minecraft:textures/item/diamond_sword.png"  // 原版物品的纹理路径
"icon": "mymod:textures/gui/epiphany/combat.png"      // 你的资源包自定义纹理
```

要么显式写完整路径，要么省略走自动回退（不要写物品 id，那不是合法的纹理路径）。
:::

### `condition`（可选）

- 类型：条件对象（`Condition` Codec）
- 默认：无条件
- 仅在 `initial_state == "locked"` 时有意义：条件满足时模块**自动解锁**
- 完整 condition 类型与字段见 [Condition](Condition.md)

### `condition_description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `module.<ns>.<path>.condition_description`
- 当模块因 condition 未满足而不可选时，该文字在 UI 上以红色提示玩家"需要做什么才能解锁"

### `initial_state`（可选）

- 类型：字符串枚举，`"locked"` 或 `"selectable"`
- 默认：`"selectable"`
- 决定模块的初始可见性 / 可选性

| 值 | 含义 |
|---|------|
| `"selectable"` | 玩家开局即可见、可选（通常不配 condition） |
| `"locked"` | 玩家初始看不到。若有 condition，满足后自动解锁；若无 condition，仅能通过 API / 命令解锁 |

### `on_select_reward`（可选）

- 类型：奖励对象（`InsightReward` Codec）
- 默认：无奖励
- 玩家选择该模块时**立即应用**的奖励
- 完整 reward 类型与字段见 [Reward](Reward.md)

### `on_select_reward_description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `module.<ns>.<path>.on_select_reward_description`
- 玩家悬停模块卡片（按住 Shift）时可见的选择奖励说明
- **UI 中直接展示此文本**，不会自动从 reward 类型推导 —— 务必手写一段玩家能看懂的话

### `on_complete_reward`（可选）

- 类型：奖励对象（`InsightReward` Codec）
- 默认：无奖励
- 模块完成时（所有心得被点亮）**额外**应用的奖励
- 系统完成模块时会**自动** `+1 顿悟槽`，该字段是额外奖励

### `on_complete_reward_description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `module.<ns>.<path>.on_complete_reward_description`
- 说明同 `on_select_reward_description`，用于完成奖励

### `insights`（可选）

- 类型：list of `{ id, depth }`
- 默认：空 list
- 列出该模块依赖的所有心得，及其在树形结构中的层级

::: warning 
树形结构规则
- **`depth = 0`** 为根节点（最顶层）
- 同一 `depth` 的多个心得是 **AND 关系**：**全部点亮**才能解锁下一层
- 第 N 层的父节点 = 数组中**最靠后的** `depth = N-1` 心得（它们之间靠顺序形成父子链）

示例：
```jsonc
"insights": [
    { "id": "epiphany:eldritch_sight", "depth": 0 },   // 根
    { "id": "epiphany:dark_pact",      "depth": 1 },   // 父 = eldritch_sight
    { "id": "epiphany:eldritch_blast", "depth": 2 }    // 父 = dark_pact
]
```

详见 [Insight](Insight.md) 中对 `depth` 的解释。
:::

::: warning insights 内的心得 ID 必须存在
该字段只是**引用** insight 的注册 ID，不会定义心得内容。你需要另外在 `data/<ns>/epiphany/insight/<name>.json` 中定义该心得。引用不存在的心得会导致树渲染异常。
:::

### `weight`（可选）

- 类型：int
- 默认：`100`
- UI 排序的权重，**越小越靠前**显示
- 可为负数