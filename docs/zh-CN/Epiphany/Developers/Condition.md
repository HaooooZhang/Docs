# 条件类型 Condition

Condition 是「顿悟」的条件类型，用于决定 Module / Epiphany 在何种玩家状态下自动解锁。

> 本页面向数据包作者，讲解所有内置 condition 类型的 JSON 字段。如何注册新的 condition 类型见 [注册新的 Condition](Register%20New%20Condition.md)。

## 用法

Condition 是 Module / Epiphany JSON 的 `condition` 字段，通过 dispatch codec 选择具体类型：

```jsonc
"condition": {
    "type": "epiphany:advancement",     // ← type 决定后续字段
    "advancement": "minecraft:story/mine_stone"
}
```

`type` 字段对应内置 28 种类型。`type` 取自条件类型的注册 ID（`epiphany:<key>`），第三方模组可以注册新 key。

::: tip 解析失败的降级  
若 `type` 引用了未注册的条件类型，JSON 解析失败，系统自动回退为 `epiphany:always`（恒真）。这意味着你的数据包**不会因拼写错误而崩溃**，但条件会变得恒真。请仔细检查 type 命名。  
:::

## 逻辑运算符

### `epiphany:always`(恒真)

恒真条件，JSON 体无字段。**这是 dispatch 解析失败时的默认回退值**。

```jsonc
{ "type": "epiphany:always" }
```

### `epiphany:never`(恒假)

恒假条件。用于"系统永远不该解锁，只能由命令/API 触发"的场景。

```jsonc
{ "type": "epiphany:never" }
```

### `epiphany:and`(全部满足)

子条件全部为真则为真。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `conditions` | list of Condition | ✅ | 子条件列表 |

```jsonc
{
    "type": "epiphany:and",
    "conditions": [
        { "type": "epiphany:experience_level", "value": 30 },
        { "type": "epiphany:advancement", "advancement": "minecraft:story/mine_diamond" }
    ]
}
```

### `epiphany:or`(任一满足)

子条件任一为真则为真。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `conditions` | list of Condition | ✅ | 子条件列表 |

### `epiphany:not`(取反)

对子条件取反。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `condition` | Condition | ✅ | 被取反的子条件 |

```jsonc
{ 
    "type": "epiphany:not", 
    "condition": { 
        "type": "epiphany:dimension", 
        "dimension": "minecraft:the_nether" 
    } 
}
```

## 条件

### `epiphany:attribute`(属性值比较)

判断玩家某项属性的当前值(基础值 + 所有修饰符之和)与给定值的关系。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `attribute` | ResourceLocation | ✅ | — | 属性 id,如 `minecraft:generic.max_health` |
| `value` | double | ✅ | — | 比较右值 |
| `comparison` | Comparison | | `>=` | 比较运算符 |

```jsonc
{
    "type": "epiphany:attribute",
    "attribute": "minecraft:generic.max_health",
    "value": 30.0,
    "comparison": ">="
}
```

### `epiphany:effect`(拥有药水效果)

判断玩家是否拥有指定效果,且 amplifier 不小于给定值。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `effect` | ResourceLocation | ✅ | — | 效果 id,如 `minecraft:regeneration` |
| `min_amplifier` | int | | `0` | 效果的 amplifier(等级 - 1)下限 |

```jsonc
{ "type": "epiphany:effect", "effect": "minecraft:strength", "min_amplifier": 0 }
```

### `epiphany:experience_level`(经验等级)

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `value` | int | ✅ | — | 比较右值(玩家经验等级) |
| `comparison` | Comparison | | `>=` | 比较运算符 |

### `epiphany:statistic`(统计值)

玩家在原版统计(Statistic)中的累计数值。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `stat` | ResourceLocation | ✅ | — | 统计 id,如 `minecraft:mined:minecraft:diamond_ore` |
| `value` | int | ✅ | — | 比较右值 |
| `comparison` | Comparison | | `>=` | 比较运算符 |


### `epiphany:dimension`(所在维度)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `dimension` | ResourceLocation | ✅ | 维度 id |

```jsonc
{ "type": "epiphany:dimension", "dimension": "minecraft:the_nether" }
```

### `epiphany:biome`(所在群系)

判断玩家**当前所在群系**。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `biome` | String | ✅ | 群系 id 或 `"#tag"` 引用(如 `minecraft:cherry_grove` / `"#minecraft:is_ocean"`) |

::: tip 自动解锁与轮询
此条件由 10-tick 轮询评估,玩家进入目标群系时立即满足。
:::

### `epiphany:structure`(所在结构)

判断玩家**是否在指定结构内**(需 chunk 已生成对应结构 start)。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `structure` | String | ✅ | 结构 id 或 `"#tag"`,如 `minecraft:stronghold` / `"#minecraft:villages"` |


### `epiphany:advancement`(获得进度)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `advancement` | ResourceLocation | ✅ | 进度 id,如 `minecraft:story/mine_stone` |


这类条件基于玩家的持久化行为统计,需达到 `count` 次才算真。

### `epiphany:item`(持有点物品)

判断玩家**当前背包 + 装备 + 物品栏**中是否有指定物品达到 count 个。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `item` | String | ✅ | — | 物品 id 或 `"#tag"` |
| `count` | int | | `1` | 数量 |

### `epiphany:item_used`(使用过物品)

玩家累计使用过该物品的次数。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `item` | String | ✅ | — | 物品 id(注:仅支持 plain id,**不支持 tag**) |
| `count` | int | | `1` | 累计次数 |

### `epiphany:block_broken`(挖掘方块)

玩家累计挖掘过该方块的次数。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `block` | String | ✅ | — | 方块 id 或 `"#tag"` |
| `count` | int | | `1` | 累计次数 |

### `epiphany:kill_entity`(击杀实体)

玩家累计击杀该类型实体的次数。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `entity` | String | ✅ | — | 实体 id 或 `"#tag"` |
| `count` | int | | `1` | 累计次数 |

::: warning 排除 FakePlayer
`kill_entity` / `block_broken` 都排除 FakePlayer,因此 Create 等自动化模组贡献的击杀 / 挖掘**不计入**统计。
:::

### `epiphany:aptitude`(阅历值)

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `value` | long | ✅ | — | 比较右值 |
| `comparison` | Comparison | | `>=` | 比较运算符 |

### `epiphany:insight_points`(心得点)

玩家当前**可用**的心得点数(不含已花费)。注意:这不是累计心得点,而是 *当下背包* 的余额。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `value` | int | ✅ | — | 比较右值 |
| `comparison` | Comparison | | `>=` | 比较运算符 |

### `epiphany:module_selected`(已选模块)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `module` | ResourceLocation | ✅ | 模块 id |

### `epiphany:module_completed`(已完成模块)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `module` | ResourceLocation | ✅ | 模块 id |

### `epiphany:insight_selected`(已点亮心得)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `insight` | ResourceLocation | ✅ | 心得 id |

### `epiphany:epiphany_selected`(已激活顿悟)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `epiphany` | ResourceLocation | ✅ | 顿悟 id |

## FTB Quests 联动(软依赖)

::: warning 软依赖
以下 4 种类型需要 FTB Quests 已安装才会真正工作。未安装时一律返回 `false`,数据包仍可加载。
:::

由于 FTBQ 是事件驱动的(`isEventDriven() == true`)，自动解锁**会跳过轮询评估**这类条件,只在对应 FTBQ 事件触发时才检测。

### `epiphany:ftbq_quest`(完成指定任务)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `quest` | String | ✅ | FTBQ 任务的 hex 字符串 id |

### `epiphany:ftbq_chapter_started`(开始指定章节)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `chapter` | String | ✅ | FTBQ 章节的 hex 字符串 id |

### `epiphany:ftbq_chapter_completed`(完成指定章节)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `chapter` | String | ✅ | FTBQ 章节的 hex 字符串 id |

### `epiphany:ftbq_tag`(拥有指定 tag 标记)

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `tag` | String | ✅ | — | FTBQ tag 字符串 |
| `count` | int | | `1` | 至少需要的 tag 数量 |

## KubeJS 联动(软依赖)

### `epiphany:kubejs_stage`(拥有 stage)

判断玩家是否拥有指定的 KubeJS stage。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `stage` | String | ✅ | KubeJS stage 名称 |

未安装 KubeJS 时一律返回 `false`。

## 比较运算符

### `Comparison`(比较运算符)

多个 condition 共享,JSON 写法为字符串形式:

| 写法 | 含义 |
|------|------|
| `>=` | 大于或等于(默认) |
| `<=` | 小于或等于 |
| `==` | 等于 |
| `>` | 大于 |
| `<` | 小于 |

::: tip 错误回退
传入了无法识别的符号,系统默认使用 `>=` 不报错。
:::

## 内置类型速查表

| 类型 | 字段数 | tag 支持 | 事件驱动 | 软依赖 |
|------|:------:|:--------:|:--------:|:------:|
| `always` / `never` | 0 | — | 否 | — |
| `and` / `or` / `not` | 1(子条件) | — | 否 | — |
| `attribute` | 3 | — | 否 | — |
| `aptitude` | 2 | — | 否 | — |
| `insight_points` | 2 | — | 否 | — |
| `experience_level` | 2 | — | 否 | — |
| `effect` | 2 | — | 否 | — |
| `statistic` | 3 | — | 否 | — |
| `dimension` | 1 | — | 否 | — |
| `biome` | 1 | ✅ | 否(轮询) | — |
| `structure` | 1 | ✅ | 否(轮询) | — |
| `advancement` | 1 | — | 否 | — |
| `item` | 2 | ✅ | 否 | — |
| `item_used` | 2 | ❌ | 否 | — |
| `block_broken` | 2 | ✅ | 否 | — |
| `kill_entity` | 2 | ✅ | 否 | — |
| `module_selected` / `module_completed` | 1 | — | 否 | — |
| `insight_selected` | 1 | — | 否 | — |
| `epiphany_selected` | 1 | — | 否 | — |
| `ftbq_quest` / `ftbq_chapter_started` / `ftbq_chapter_completed` | 1 | — | ✅ | FTBQ |
| `ftbq_tag` | 2 | — | ✅ | FTBQ |
| `kubejs_stage` | 1 | — | 否 | KubeJS |
