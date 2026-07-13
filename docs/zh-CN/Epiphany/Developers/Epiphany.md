# 顿悟 Epiphany

顿悟是**质变级**的能力，在玩家完成模块后获得的顿悟槽中被激活。顿悟可通过 `path` 字段分组。

> 本页介绍 Epiphany 数据包格式。其他数据包类型：[Module](Module.md) / [Insight](Insight.md) / [Path](Path.md)。

## 文件位置

```
data/<namespace>/epiphany/epiphany/<path>.json
```

- **顿悟的注册 ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/epiphany/blazing_aura.json` → `mymod:blazing_aura`
  - `data/mymod/epiphany/epiphany/fire/aura.json` → `mymod:fire/aura`

::: warning 路径中重复的 `epiphany`
注意文件路径是 `data/<ns>/epiphany/epiphany/`,前一个 `epiphany` 是数据包类型目录(顶级四个之一),后一个是 Epiphany 数据类型本身的目录。这是模组结构约定,不是笔误。
:::

## 完整样例

```jsonc
{
    "name": "Excalibur",                                  // 可选,缺省走 lang 翻译键
    "description": "对城宝具",  // 可选
    "icon": "minecraft:textures/item/totem_of_undying.png",  // 可选
    "path": "epiphany:war",                             // 可选
    "condition": {                                      // 可选
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "comparison": ">=",
        "value": 30.0
    },
    "condition_description": "最大生命 ≥ 30",           // 可选
    "initial_state": "locked",                          // 可选,默认 selectable
    "reward": {                                         // 可选
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "amount": 10.0,
        "operation": "ADD_VALUE"
    },
    "reward_description": "+10 最大生命",               // 可选
    "weight": 100                                       // 可选,默认 100
}
```

## 字段说明

### `name`（可选）

- 类型：`Component`（字符串、样式对象或翻译键）
- 默认：缺省时回退翻译键 `epiphany.<ns>.<path>.name`

::: info 文本组件与 i18n
所有 Component 字段支持字符串 / 样式对象 / 翻译键三种写法，缺省时自动回退到约定翻译键。详见 [Module · 文本组件与 i18n](Module.md#文本组件与-i18n)。
:::

### `description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `epiphany.<ns>.<path>.description`
- 描述顿悟的效果或背景设定，显示在顿悟槽 tooltip

### `icon`（可选）

- 类型：`ResourceLocation`，指向资源包纹理
- 默认：**三级自动回退**：JSON 显式 → `textures/gui/epiphany/<path>.png` → 默认物品图标（`goat_horn`）
- 完整回退规则与示例见 [Module · icon](Module.md#icon-可选)

::: warning 图标是路径，而非物品 ID
`icon` 是资源包纹理路径，不是物品 / 方块 ID。要么写完整路径（如 `"minecraft:textures/item/totem_of_undying.png"`），要么省略走自动回退。
:::

### `path`（可选）

- 类型：`ResourceLocation`，指向一个 Path 注册 ID
- 默认：顿悟归入"默认组"
- 引用方式：`"<namespace>:<path_id>"`（如 `"epiphany:war"`）

::: info 单向引用
顿悟通过 `path` 字段**单向引用** Path。Path 自身不会反向列出下属的顿悟，这种关系在 UI 渲染时由系统反向构建。详见 [Path](Path.md)。
:::

### `condition`（可选）

- 类型：条件对象（`Condition` Codec）
- 默认：无条件
- 仅在 `initial_state == "locked"` 时有意义：满足后**自动解锁**
- 完整 condition 类型与字段见 [Condition](Condition.md)

### `condition_description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `epiphany.<ns>.<path>.condition_description`
- 顿悟未解锁时，UI 提示玩家解锁需要做什么

### `initial_state`（可选）

- 类型：字符串枚举，`"locked"` 或 `"selectable"`
- 默认：`"selectable"`

| 值 | 含义 |
|---|------|
| `"selectable"` | 满足槽位即可选（默认值，通常不配 condition） |
| `"locked"` | 隐藏直到 condition 满足自动解锁 / API 命令解锁 |

::: tip 与 Module 的区别
顿悟没有"选择消耗心得点"的概念，激活顿悟消耗的是**顿悟槽**（完成模块自动获得）。
:::

### `reward`（可选）

- 类型：奖励对象（`EpiphanyReward` Codec）
- 默认：无奖励
- 顿悟激活时立即应用
- 完整 reward 类型与字段见 [Reward](Reward.md)

::: info InsightReward 与 EpiphanyReward
Epiphany 的 reward 用的是 `EpiphanyReward` Codec。但模组内部大多数奖励实现类**同时实现 InsightReward 与 EpiphanyReward 两个接口**（共享逻辑），JSON 字段完全相同。
:::

### `reward_description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `epiphany.<ns>.<path>.reward_description`
- tooltip 中（按住 Shift）展示奖励说明
- **UI 中直接展示此文本**，不会自动从 reward 类型推导

### `weight`（可选）

- 类型：int
- 默认：`100`
- 顿悟在其 path 分组内的排序权重
- 可为负数