# 配置 Config

「顿悟」由 NeoForge 提供配置项。所有配置自动生成到 `config/epiphany-common.toml`，也支持通过 Mod Menu / ConfigScreen 在游戏内修改。

::: tip
带有 NeoForge ConfigScreen 的客户端可在主菜单 `Mods → Epiphany → Configure` 直接图形化修改本页所有配置。配置热重载,无需重启游戏。
:::

## 文件位置

```
<游戏根目录>/config/epiphany-common.toml
```

## 全部配置项

### 数值与系统

#### `maxEpiphanySlots`

- 类型：int
- 默认：`8`
- 范围：`1` ~ `32`
- 说明：玩家**可拥有的顿悟槽上限**。完成模块自动 +1 槽，但被此值封顶。

#### `moduleSelectCost`

- 类型：int
- 默认：`1`
- 范围：`0` ~ `100`
- 说明：**选择模块时统一消耗的心得点**。所有模块共用此 cost，不能单独为每个模块配置。

#### `maxSelectedModules`

- 类型：int
- 默认：`8`
- 范围：`1` ~ `64`
- 说明：玩家**同时已选中模块的数量上限**。模块选择时若已达上限，选择静默失败。

### 阅历系统

#### `baseAptitudeCap`

- 类型：long
- 默认：`10`
- 范围：`1` ~ `Long.MAX_VALUE`
- 说明：**第一个心得点**所需的阅历基础值。玩家从 0 阅历开始，需积累到此值才获得首个心得点。

#### `aptitudeCapGrowth`

- 类型：long
- 默认：`1`
- 范围：`0` ~ `Long.MAX_VALUE`
- 说明：目前只有线性公式，**每多获得一个心得点，下一档所需阅历的递增量**。

升级公式:

$$
\text{所需阅历} = \text{baseAptitudeCap} + (\text{totalSpent} + \text{insightPoints}) \times \text{aptitudeCapGrowth}
$$

默认配置下,第 1 / 2 / 5 / 10 个心得点分别需要 10 / 11 / 15 / 20 阅历。详见 [机制 · 阅历升级公式](Gameplay.md#阅历aptitude)。

#### `aptitudeGainMultiplier`

- 类型：double
- 默认：`1.0`
- 范围：`0.0` ~ `100.0`
- 说明：**全局倍率**，应用于所有数据包行为发放的阅历。

| 倍率 | 效果 |
|:----:|------|
| `1.0` | 默认,使用 JSON 写的原值 |
| `2.0` | 翻倍发放 |
| `0.5` | 减半 |
| `0.0` | 等同于关闭所有数据包来源(玩家无法通过行为获取阅历) |

详见 [Aptitude & Insight Point](../Developers/Aptitude%20&%20Insight%20Point.md#全局配置项)。

### 通知开关

下列三个配置控制 Epiphany 在游戏内向玩家发送通知的方式(临时方案,目前是**聊天消息 + 音效**,未来计划改为 Toast 弹窗)。

#### `notifyInsightPoints`

- 类型：boolean
- 默认：`true`
- 说明：玩家**获得心得点**时是否通知。触发场景：
  - 阅历条满自动转化
  - 命令发放（`setInsightPoints` / `insight points add`）
  - 数据包奖励给予（`epiphany:insight_points` reward）

#### `notifyModuleUnlock`

- 类型：boolean
- 默认：`true`
- 说明：玩家**模块自动解锁**时是否通知。

::: warning 仅通知自动解锁
此开关**只**控制 `initial_state = "locked"` 且有 condition 的模块，条件满足自动解锁时的通知。

- `initial_state = "selectable"` 的模块（玩家开局即可见）不通知
- 借助命令 / API 手动解锁也不触发此通知（只有自动解锁会）
:::

#### `notifyEpiphanyUnlock`

- 类型：boolean
- 默认：`true`
- 说明：与 `notifyModuleUnlock` 类似，但针对**顿悟**的自动解锁。


