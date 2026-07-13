# 奖励类型 Reward

Reward 是模组的奖励类型，在模块被选择 / 完成、心得被点亮、顿悟被激活时立即应用，在重置时反向移除（有些不能移除的就没有办法了）。

> 本页面向数据包作者，讲解所有内置 reward 类型的 JSON 字段。如何注册新的 reward 类型见 [注册新的 Reward](Register%20New%20Reward.md)。

## 共享 Codec

InsightReward（Insight 用）和 EpiphanyReward（Epiphany 用）**共享同一套 14 种实现类**，JSON 字段完全相同。每种实现类在两个注册表中各注册一次,但 codec / 行为一致。

> 实际上,每个 Reward 类同时实现 `InsightReward` 与 `EpiphanyReward` 两个接口。因此本页描述的字段对 Module 的 `on_select_reward` / `on_complete_reward`、Insight 的 `reward`、Epiphany 的 `reward` **全部通用**。或许之后会新增一些专属的奖励类型

## 用法

通过 dispatch codec 按 `type` 选择具体类型:

```jsonc
"on_select_reward": {
    "type": "epiphany:item",          // ← type 决定后续字段
    "item": "minecraft:diamond",
    "count": 3
}
```

::: tip 解析失败降级
若 `type` 引用了未注册的类型,系统**不会崩溃**,而是回退到无奖励(NoOp)。请仔细检查 type 命名。
:::

## 持久奖励

### `epiphany:attribute` (属性)

永久给玩家添加一个属性修饰符(AttributeModifier)。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `attribute` | ResourceLocation | ✅ | — | 属性 id,如 `minecraft:generic.max_health` |
| `amount` | double | | `0.0` | 修饰值 |
| `operation` | String | | `add_value` | 修饰运算类型 |

`operation` 可选值：

| 值 | 含义 |
|---|------|
| `add_value`(默认) | 数值加法 |
| `add_multiplied_base` | 基础值 × amount 后加到基础 |
| `add_multiplied_total` | 总值 × amount 后加到总值 |

兼容旧式 CamelCase(`ADD_VALUE` 等)，但推荐用 snake_case ，与 vanilla attribute_modifier 一致。

::: tip 持久化
`attribute` 奖励实现 `PersistentReward` 接口 —— 玩家死亡 / 维度切换后,系统自动重新应用该修饰符。同时 `apply()` 是幂等的(已存在同 id 修饰符时跳过),不会叠加。
:::

```jsonc
{
    "type": "epiphany:attribute",
    "attribute": "minecraft:generic.max_health",
    "amount": 6.0,
    "operation": "add_value"
}
```

### `epiphany:effect` (药水效果)

给玩家添加一个持久化的药水效果。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `effect` | ResourceLocation | ✅ | — | 效果 id,如 `minecraft:strength` |
| `duration` | int | | `-1` | 时长(tick);`-1` 表示**无限** |
| `amplifier` | int | | `0` | amplifier(等级 - 1) |

```jsonc
{
    "type": "epiphany:effect",
    "effect": "minecraft:strength",
    "duration": -1,
    "amplifier": 0
}
```

::: tip 持久化
`effect` 实现 `PersistentReward` —— 玩家死亡重生后会自动重新施加效果(无论 `duration` 多少)。重生必然触发重应用,所以建议把"持久效果"配 `duration: -1` 。但即便配有限时长,也会在重生瞬间再次获得一份计时（应该是这样）。
:::

## 物品与经验类

### `epiphany:item` (给予物品)

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `item` | ResourceLocation | ✅ | — | 物品 id |
| `count` | int | | `1` | 数量 |

物品直接进入玩家背包,空间不足时掉落地面。

::: tip
`item` 奖励实现了 `remove()`：玩家重置时会从主背包 + 末影箱逐栈扫描，扣除对应数量的同种物品(尽量足数扣减)。背包可能不足,但不报错。
:::

### `epiphany:experience` (给予经验点)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `amount` | int | ✅ | 经验点数量(原版 `player.giveExperiencePoints`) |

### `epiphany:experience_level` (给予经验等级)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `levels` | int | ✅ | 经验等级数(原版 `player.giveExperienceLevels`) |

::: tip 
两个 experience 类型的 `remove()` 分别调 `giveExperiencePoints(-amount)` / `giveExperienceLevels(-levels)`。原版的负向操作会保留经验点,但不会压低等级到0以下。
:::
### `epiphany:aptitude` (给予阅历)

增加玩家的阅历值。**会触发阅历升级链**(若填满阅历条,自动转化心得点)。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `amount` | long | ✅ | 阅历数量 |

::: warning 
`remove()` 调用 `AptitudeManager.setAptitude(current - amount)` (clamp 到不小于 0)。**但** 阅历转化成的心得点**不会同步退回**，因为 `addAptitude` 已将多出部分升级为心得点写入 `totalInsightPointsSpent`。虽然阅历可以为负数，但不推荐这么做。
:::

### `epiphany:insight_points`(给予心得点)

直接增加玩家的可用心得点(不通过阅历路径)。
| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `amount` | int | ✅ | 心得点数量 |

`remove()` 调 `setInsightPoints(max(0, current - amount))` (clamp 到 0)。。

### `epiphany:command`(执行命令)

以服务器控制台权限执行任意命令。命令中可使用 `@s` 占位符(执行者为玩家)。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `command` | String | ✅ | 完整命令字符串(不含前导 `/`) |

```jsonc
{
    "type": "epiphany:command",
    "command": "effect give @s minecraft:speed 30 1"
}
```

::: warning 权限
以权限等级 2(管理员)执行,等同于控制台。可用于触发自定义命令、调用其他模组的命令接口。注意命令安全性 —— 玩家可通过点亮心得间接执行。
:::

### `epiphany:particle`(粒子效果)

在玩家位置生成一组粒子。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `particle` | ResourceLocation | ✅ | — | 粒子 id,如 `minecraft:flame` |
| `count` | int | | `10` | 粒子数量 |

::: warning 单次触发
`particle` 是一次性的(非持久化),重生后不会自动重新触发。`remove()` 也不做任何事。
:::

## Epiphany 奖励

这类奖励直接修改 Epiphany 模组本身的状态(解锁或锁定其他模块 / 顿悟)。修改是一次性的，如果之后被重新锁定，奖励不会重新应用。

### `epiphany:unlock_module`(解锁模块)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `module` | ResourceLocation | ✅ | 模块 id |

### `epiphany:lock_module`(锁定模块)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `module` | ResourceLocation | ✅ | 模块 id |

### `epiphany:unlock_epiphany`(解锁顿悟)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `epiphany` | ResourceLocation | ✅ | 顿悟 id |

### `epiphany:lock_epiphany`(锁定顿悟)

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `epiphany` | ResourceLocation | ✅ | 顿悟 id |

## KubeJS 联动(软依赖)

### `epiphany:kubejs_stage`(添加 / 移除 stage)

给玩家添加或移除一个 KubeJS stage。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|:----:|:----:|------|
| `stage` | String | ✅ | — | KubeJS stage 名称 |
| `action` | String | | `add` | `add` 或 `remove` |

`remove()` 时**自动反向操作**:
- 原配 `action: "add"` → 重置时移除 stage
- 原配 `action: "remove"` → 重置时加回 stage

未安装 KubeJS 时该奖励静默无效。

```jsonc
{ "type": "epiphany:kubejs_stage", "stage": "ascended", "action": "add" }
```

## 内置类型速查表

| type | 关键字段 | 持久化? | remove 行为 |
|------|---------|:-------:|------------|
| `attribute` | attribute, amount, operation | ✅ | 移除 modifier |
| `effect` | effect, duration(-1 无限), amplifier | ✅ | 移除效果实例 |
| `item` | item, count | ❌ | 从背包 + 末影箱扣回|
| `experience` | amount | ❌ | `giveExperiencePoints(-amount)` |
| `experience_level` | levels | ❌ | `giveExperienceLevels(-levels)` |
| `aptitude` | amount | ❌ | 扣回阅历值(生成的点不退) |
| `insight_points` | amount | ❌ | `setInsightPoints(current - amount)` |
| `command` | command | ❌ | stub(无法撤销命令) |
| `unlock_module` | module | ❌ | 调 `setUnlocked(false)` 锁回 |
| `lock_module` | module | ❌ | 调 `setUnlocked(true)` 解锁回 |
| `unlock_epiphany` | epiphany | ❌ | 调 `setUnlocked(false)` 锁回 |
| `lock_epiphany` | epiphany | ❌ | 调 `setUnlocked(true)` 解锁回 |
| `particle` | particle, count | ❌ | stub(粒子转瞬即逝,无需撤销) |
| `kubejs_stage` | stage, action | ❌ | 反向 stage 操作(add↔remove) |