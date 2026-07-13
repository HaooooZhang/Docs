# 自定义事件列表 Custom Event List

「顿悟 Epiphany」提供了 15 个自定义事件，供其他模组监听并响应玩家操作。所有事件均基于 NeoForge 事件机制。

::: tip
所有事件均携带 `ServerPlayer`，仅在服务端触发
:::

::: info
KubeJS 脚本同样支持这些事件，详情请参见[KubeJS 兼容](KubeJS%20Compat) 章节
:::

## 事件体系

所有事件继承自 `EpiphanyEvent`，均位于 `ink.myumoon.epiphany.event` 包下，注册在 `NeoForge.EVENT_BUS`。

事件按触发时机分为两类：

| 类型 | 命名模式 | 特征 |
|------|---------|------|
| **Pre** | `XxxUnlockEvent` / `XxxSelectEvent` / `XxxCompleteEvent` | `implements ICancellableEvent`，可取消 |
| **Post** | `XxxUnlockedEvent` / `XxxSelectedEvent` / `XxxCompletedEvent` / `XxxChangedEvent` | 不可取消 |


## 监听示例

```java
@EventBusSubscriber(modid = "mymod")
public static class MyListener {
    // Pre 事件：可以取消玩家操作
    @SubscribeEvent
    static void onSelect(ModuleSelectEvent e) {
        if (shouldBlock(e.getModuleId())) {
          foo();
          e.setCanceled(true);
        }
    }

    // Post 事件
    @SubscribeEvent
    static void onCompleted(ModuleCompletedEvent e) {
        foo();
    }
}
```

## Module 事件

所有 Module 事件均提供 `getPlayer()` 与 `getModuleId()`。

### 模块解锁

#### `ModuleUnlockEvent` — Pre 事件
- 取消效果：模块保持锁定，不发 Post

#### `ModuleUnlockedEvent` — Post 事件
- 特殊变量：`boolean isSilent()`，决定是否发送通知信息。

### 模块选择

#### `ModuleSelectEvent` — Pre 事件
- 取消效果：取消选择，不消耗心得点

#### `ModuleSelectedEvent` — Post 事件

### 模块完成

#### `ModuleCompleteEvent` — Pre 事件
- 取消效果：不发 Post、不加可用顿悟槽、不应用奖励；模块可被再次触发完成

#### `ModuleCompletedEvent` — Post 事件

## Insight 事件

所有 Insight 事件均提供 `getPlayer()`、`getInsightId()` 与 `getModuleId()`。

### 心得选择

#### `InsightSelectEvent` — Pre 事件
- 取消效果：取消选择，不消耗心得点
#### `InsightSelectedEvent` — Post 事件

::: tip
`InsightManager.select` 在点亮心得后，若所属模块所有心得均已点亮，会调用 `ModuleManager.complete`。  
因此一次 `select` 调用可能引发完整的事件链：InsightSelect → InsightSelected → ModuleComplete → ModuleCompleted。
:::

## Epiphany 事件

所有 Epiphany 事件均提供 `getPlayer()` 与 `getEpiphanyId()`。

### 顿悟解锁

#### `EpiphanyUnlockEvent` — Pre 事件
- 取消效果：顿悟保持锁定，不发 Post

#### `EpiphanyUnlockedEvent` — Post 事件
- 独有字段：`boolean isSilent()` ，决定是否发送通知信息。

### 顿悟选择

#### `EpiphanySelectEvent` — Pre 事件
- 取消效果：取消选择，不消耗槽位

#### `EpiphanySelectedEvent` — Post 事件

## Aptitude 事件

全部为 Post 事件，描述数值已发生变化的既成事实。

### `AptitudeChangedEvent` — Post 事件

当阅历发生变动时触发，包含以下两个 `Getter`：

```java
long getOldAptitude();
long getNewAptitude(); //是扣除升级消耗后的剩余值
```

### `AptitudeLevelUpEvent` — Post 事件

阅历条充满，获得 1 心得点时触发。每增加 1 点心得点触发一次，如果一次阅历增加获得了多点心得点，则触发多次。包含以下 `Getter`：

```java
int getNewInsightPoints();   // 触发时的心得点总数
```

### `InsightPointsChangedEvent` — Post 事件

当心得点余额发生变动触发。  
**结算事件**：一次 API 调用只 fire 一次，不论内部升级多少次。

```java
int getOldValue();
int getNewValue();
int getDelta();              // newValue - oldValue(正=获得,负=消耗)
boolean isGain();            // newValue > oldValue
```

## 事件总表

| 事件类 | 类型 | Getter（除 getPlayer） |
|--------|:----:|----------------------|
| `ModuleUnlockEvent` | Pre 事件 | getModuleId |
| `ModuleSelectEvent` | Pre 事件 | getModuleId |
| `ModuleCompleteEvent` | Pre 事件 | getModuleId |
| `ModuleUnlockedEvent` | Post 事件 | getModuleId, isSilent |
| `ModuleSelectedEvent` | Post 事件 | getModuleId |
| `ModuleCompletedEvent` | Post 事件 | getModuleId |
| `InsightSelectEvent` | Pre 事件 | getInsightId, getModuleId |
| `InsightSelectedEvent` | Post 事件 | getInsightId, getModuleId |
| `EpiphanyUnlockEvent` | Pre 事件 | getEpiphanyId |
| `EpiphanySelectEvent` | Pre 事件 | getEpiphanyId |
| `EpiphanyUnlockedEvent` | Post 事件 | getEpiphanyId, isSilent |
| `EpiphanySelectedEvent` | Post 事件 | getEpiphanyId |
| `AptitudeChangedEvent` | Post 事件 | getOldAptitude, getNewAptitude |
| `AptitudeLevelUpEvent` | Post 事件 | getNewInsightPoints |
| `InsightPointsChangedEvent` | Post 事件 | getOldValue, getNewValue, getDelta, isGain |
