# 心得 Insight

心得是模块内的**最小单元**，是量变型的升级节点。心得以独立 JSON 文件定义，被 [Module](Module.md) 通过 insights 列表引用，共同构成模块的心得树。

> 本页介绍 Insight 数据包格式。其他数据包类型：[Module](Module.md) / [Epiphany](Epiphany.md) / [Path](Path.md)。

## 文件位置

```
data/<namespace>/epiphany/insight/<path>.json
```

- **心得的注册 ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/insight/fireball.json` → `mymod:fireball`
  - `data/mymod/epiphany/insight/spell/fireball.json` → `mymod:spell/fireball`

::: tip 复用心得
理论上，不同模块可以引用同一个心得 ID。但这并不是推荐的做法，强烈不建议不同模块之间复用同一个心得 ID。
:::

## 完整样例

```jsonc
{
    "name": "领袖气质",                                  // 可选,缺省走 lang 翻译键
    "description": "足以治理一个国家的能力",                       // 可选
    "icon": "minecraft:textures/item/golden_chestplate.png",  // 可选
    "cost": 1,                                          // 可选,默认 1
    "reward": {                                         // 可选
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "amount": 6.0,
        "operation": "ADD_VALUE"
    },
    "reward_description": "+6 最大生命",                // 可选
    "weight": 100                                       // 可选,默认 100
}
```

## 字段说明

### `name`(可选)

- 类型:`Component`(字符串、样式对象或翻译键)
- 默认:缺省时回退翻译键 `insight.<ns>.<path>.name`

::: info 文本组件与 i18n
所有 Component 字段支持字符串 / 样式对象 / 翻译键三种写法，缺省时自动回退到约定翻译键。详见 [Module · 文本组件与 i18n](Module.md#文本组件与-i18n)。
:::

### `description`(可选)

- 类型:`Component`
- 默认:缺省时回退翻译键 `insight.<ns>.<path>.description`
- 简明描述心得的效果(如 `"+6 最大生命"`)

### `icon`(可选)

- 类型:`ResourceLocation`,指向资源包纹理
- 默认：**三级自动回退**：JSON 显式 → `textures/gui/insight/<path>.png` → 默认物品图标（`diamond`）
- 完整回退规则与示例见 [Module · icon](Module.md#icon-可选)

::: warning 图标是路径，而非物品 ID
`icon` 是资源包纹理路径，不是物品 / 方块 ID。要么写完整路径（如 `"minecraft:textures/item/golden_chestplate.png"`），要么省略走自动回退。
:::

### `cost`（可选）

- 类型：int
- 默认：`1`
- 点亮该心得消耗的**心得点**数量

::: info 与 MODULE_SELECT_COST 区分
`MODULE_SELECT_COST`（配置项）是**选择模块**的统一消耗，与心得的 cost 独立。心得 cost 由每个心得自行配置。
:::

### `reward`（可选）

- 类型：奖励对象（`InsightReward` Codec）
- 默认：无奖励
- 玩家点亮该心得时**立即应用**
- 完整 reward 类型与字段见 [Reward](Reward.md)

### `reward_description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `insight.<ns>.<path>.reward_description`
- 显示在心得节点的 tooltip（按住 Shift），直观告诉玩家奖励内容
- **UI 中直接展示此文本**，不会自动从 reward 类型推导

### `weight`（可选）

- 类型：int
- 默认：`100`
- 仅在平铺显示多个心得时影响排序，实际意义有限
- 可为负数