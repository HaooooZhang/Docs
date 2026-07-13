# Manager API

「顿悟 Epiphany」提供了一组静态 Manager 类作为公共 API，供其他模组通过 Java 代码与系统交互。


::: tip 
所有 Manager 方法的玩家参数均为 `ServerPlayer`
:::

::: info
KubeJS 脚本同样支持Manager API，详情请参见 [KubeJS 兼容](KubeJS%20Compat) 章节
:::

## `AptitudeManager`

管理玩家的阅历值和心得点。
### 查询方法
```java
// 获取玩家当前阅历值
long getAptitude(ServerPlayer player)

// 获取玩家当前心得点
int getInsightPoints(ServerPlayer player)

// 获取玩家已消耗的心得点总数
int getTotalInsightPointsSpent(ServerPlayer player)
```
### 修改方法
```java
// 设置阅历值（截断到当前上限）
// 触发 AptitudeChangedEvent
void setAptitude(ServerPlayer player, long value)

// 增加阅历值。超额部分自动转化为心得点
// 触发 AptitudeChangedEvent, AptitudeLevelUpEvent, InsightPointsChangedEvent
void addAptitude(ServerPlayer player, long amount)

// 设置心得点数（截断到 >= 0）
// 触发 InsightPointsChangedEvent
void setInsightPoints(ServerPlayer player, int value)
```

## `ModuleManager`

管理玩家的模块数据。
### 查询方法
```java
// 模块是否已解锁（可以被选择）
boolean isUnlocked(ServerPlayer player, ResourceLocation moduleId)

// 模块是否已被选择
boolean isSelected(ServerPlayer player, ResourceLocation moduleId)

// 模块是否已完成
boolean isCompleted(ServerPlayer player, ResourceLocation moduleId)
```
### 修改方法
```java
// 设置模块解锁状态
// 触发 ModuleUnlockEvent (Pre) 和 ModuleUnlockedEvent (Post)
void setUnlocked(ServerPlayer player, ResourceLocation moduleId, boolean unlocked)

// 选择模块（消耗心得点，检查条件和上限）
// 触发 ModuleSelectEvent (Pre) 和 ModuleSelectedEvent (Post)
// 应用 on_select_reward
void select(ServerPlayer player, ResourceLocation moduleId)

// 完成模块（检查所有心得是否已解锁，授予顿悟槽）
// 触发 ModuleCompleteEvent (Pre) 和 ModuleCompletedEvent (Post)
// 应用 on_complete_reward
void complete(ServerPlayer player, ResourceLocation moduleId)

// 强制选择（忽略消耗和条件）
// 触发 ModuleSelectedEvent (Post)
void forceSelect(ServerPlayer player, ResourceLocation moduleId)

// 强制完成（忽略心得检查，授予顿悟槽）
// 触发 ModuleCompletedEvent (Post)
void forceComplete(ServerPlayer player, ResourceLocation moduleId)

// 重置模块（退还心得点，移除奖励）
void resetModule(ServerPlayer player, ResourceLocation moduleId)

// 自动解锁满足条件的 locked 模块
// skipEventDriven：是否跳过轮询
// silent：是否触发 NotificationListener 中的通知消息
void checkAutoUnlock(ServerPlayer player, boolean skipEventDriven, boolean silent)

// 清理注册表中已不存在的 module
void cleanupOrphanedData(ServerPlayer player)

```

## `InsightManager`

管理玩家的心得状态。
### 查询方法
```java
// 心得是否已被选择
boolean isSelected(ServerPlayer player, ResourceLocation insightId)

// 心得所处的模块是否被选择
boolean isModuleSelected(ServerPlayer player, ResourceLocation insightId)
```
### 修改方法
```java
// 选择心得（消耗心得点，检查前置条件）
// 触发 InsightSelectEvent (Pre) 和 InsightSelectedEvent (Post)
void select(ServerPlayer player, ResourceLocation insightId, ResourceLocation moduleId)

// 强制选择心得（忽略消耗和前置条件）
void forceSelect(ServerPlayer player, ResourceLocation insightId, ResourceLocation moduleId)

// 重置心得（退还心得点，移除奖励）
void resetInsight(ServerPlayer player, ResourceLocation insightId)
```

## `EpiphanyManager`

管理玩家的顿悟状态。
### 查询方法

```java
// 顿悟是否已解锁（可以被选择）
boolean isUnlocked(ServerPlayer player, ResourceLocation epiphanyId)

// 顿悟是否已被选择
boolean isSelected(ServerPlayer player, ResourceLocation epiphanyId)
```
### 修改方法
```java
// 设置顿悟解锁状态
void setUnlocked(ServerPlayer player, ResourceLocation epiphanyId, boolean unlocked)

// 选择顿悟（检查槽位和条件）
// 触发 EpiphanySelectEvent (Pre) 和 EpiphanySelectedEvent (Post)
void select(ServerPlayer player, ResourceLocation epiphanyId)

// 强制选择（忽略槽位和条件）
void forceSelect(ServerPlayer player, ResourceLocation epiphanyId)

// 重置顿悟
void resetEpiphany(ServerPlayer player, ResourceLocation epiphanyId)

// 清理注册表中已不存在的 Epiphany
void cleanupOrphanedData(ServerPlayer player)

// 自动解锁满足条件的 locked 顿悟
// skipEventDriven：是否跳过轮询
// silent：是否触发 NotificationListener 中的通知消息
void checkAutoUnlock(ServerPlayer player, boolean skipEventDriven, boolean silent)
```

## `AptitudeSourceManager`

管理阅历的发放与获取。

```java

// 发放阅历
// behaviorId: 行为 ID（如 mymod:foo）
// targetId: 目标 ID（如被击杀的实体类型）
// registry: targetId 所属的注册表，用于查找 tag。可为 null
boolean grant(ServerPlayer sp, ResourceLocation behaviorId, ResourceLocation targetId, @Nullable Registry<?> registry)
```

使用示例：
```java
@SubscribeEvent
static void onCustomMobKill(LivingDeathEvent event) {
    if (!(event.getSource().getEntity() instanceof ServerPlayer sp)) return;
    ResourceLocation targetId = BuiltInRegistries.ENTITY_TYPE.getKey(event.getEntity().getType());
    AptitudeSourceManager.grant(
        sp,
        ResourceLocation.fromNamespaceAndPath("mymod", "custom_kill"),
        targetId,
        BuiltInRegistries.ENTITY_TYPE
    );
}
```

## `AptitudeFormula`

阅历计算公式类。目前只实现了线性运算，计划加入更多公式支持。
公式：
$$

\text{required} = \text{Config.baseAptitudeCap} + (\text{totalSpent} + \text{insightPoints}) \times \text{Config.aptitudeCapGrowth}

$$

```java
// 计算获得下一个心得点所需的阅历值
// totalSpent: 已消耗心得点总数
// insightPoints: 当前可用心得点数
// 返回: 所需阅历值
long calcRequiredAptitude(long totalSpent, int insightPoints)
```

## 处理模式

所有 Manager 方法遵循统一的流程：
```
1. player.getData(AttachmentType) → 获取当前数据
2. 创建新的不可变数据记录（with* 方法）
3. player.setData(AttachmentType, newData) → 持久化 + 自动同步到客户端
4. NeoForge.EVENT_BUS.post(Event) → 触发事件
```

::: info
`PlayerEpiphanyData` 是不可变 record，所有修改通过 `with*()` 方法返回新实例。
:::

## 方法总表

| Manager | 方法 | 描述 | 返回 |
|---------|------|------|:----:|
| `AptitudeManager` | `getAptitude` | 当前阅历 | `long` |
| `AptitudeManager` | `getInsightPoints` | 可用心得点 | `int` |
| `AptitudeManager` | `getTotalInsightPointsSpent` | 累计已花费心得点 | `int` |
| `AptitudeManager` | `setAptitude` | 设置阅历 | `void` |
| `AptitudeManager` | `addAptitude` | 增加阅历,溢出部分自动转心得点 | `void` |
| `AptitudeManager` | `setInsightPoints` | 直接覆盖可用心得点(不改 totalSpent) | `void` |
| `ModuleManager` | `isUnlocked` | 模块是否已解锁 | `boolean` |
| `ModuleManager` | `isSelected` | 模块是否已选 | `boolean` |
| `ModuleManager` | `isCompleted` | 模块是否已完成 | `boolean` |
| `ModuleManager` | `setUnlocked` | 设置解锁状态 | `void` |
| `ModuleManager` | `select` | 选择模块 | `void` |
| `ModuleManager` | `forceSelect` | 强制选择 | `void` |
| `ModuleManager` | `complete` | 完成模块 | `void` |
| `ModuleManager` | `forceComplete` | 强制完成 | `void` |
| `ModuleManager` | `resetModule` | 重置模块 | `void` |
| `ModuleManager` | `checkAutoUnlock` | 扫描自动解锁 LOCKED 且 condition 满足的模块 | `void` |
| `ModuleManager` | `cleanupOrphanedData` | 清理注册表中已不存在的 module | `void` |
| `InsightManager` | `isSelected` | 心得是否已点亮 | `boolean` |
| `InsightManager` | `isModuleSelected` | 心得所属模块是否已选 | `boolean` |
| `InsightManager` | `select` | 选择心得 | `void` |
| `InsightManager` | `forceSelect` | 强制选择 | `void` |
| `InsightManager` | `resetInsight` | 重置心得 | `void` |
| `EpiphanyManager` | `isUnlocked` | 顿悟是否已解锁 | `boolean` |
| `EpiphanyManager` | `isSelected` | 顿悟是否已激活 | `boolean` |
| `EpiphanyManager` | `setUnlocked` | 设置解锁状态 | `void` |
| `EpiphanyManager` | `select` | 激活顿悟 | `void` |
| `EpiphanyManager` | `forceSelect` | 强制激活 | `void` |
| `EpiphanyManager` | `resetEpiphany` | 重置顿悟 | `void` |
| `EpiphanyManager` | `checkAutoUnlock` | 扫描自动解锁 LOCKED 且 condition 满足的顿悟 | `void` |
| `EpiphanyManager` | `cleanupOrphanedData` | 清理注册表中已不存在的 epiphany | `void` |
| `AptitudeSourceManager` | `grant` | 发放阅历 | `boolean` |
| `AptitudeSourceManager` | `resolve` | 纯查询某 behavior+target 的奖励 | `Resolution` |
| `AptitudeFormula` | `calcRequiredAptitude` | 计算获得下一心得点所需阅历 | `long` |


