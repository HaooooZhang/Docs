# Manager API

Epiphany provides a set of static Manager classes as a public API, allowing other mods to interact with the system through Java code.

::: tip
All Manager method player parameters are `ServerPlayer`.
:::

::: info
KubeJS scripts also support the Manager API. See the [KubeJS Compat](KubeJS%20Compat.md) section for details.
:::

## `AptitudeManager`

Manages player aptitude values and Insight Points.

### Query Methods

```java
// Get the player's current aptitude value
long getAptitude(ServerPlayer player)

// Get the player's current Insight Points
int getInsightPoints(ServerPlayer player)

// Get the total Insight Points the player has spent
int getTotalInsightPointsSpent(ServerPlayer player)
```

### Mutation Methods

```java
// Set aptitude value (clamped to current cap)
// Fires AptitudeChangedEvent
void setAptitude(ServerPlayer player, long value)

// Add aptitude. Excess automatically converts to Insight Points
// Fires AptitudeChangedEvent, AptitudeLevelUpEvent, InsightPointsChangedEvent
void addAptitude(ServerPlayer player, long amount)

// Set Insight Points count (clamped to >= 0)
// Fires InsightPointsChangedEvent
void setInsightPoints(ServerPlayer player, int value)
```

## `ModuleManager`

Manages player module data.

### Query Methods

```java
// Whether the module is unlocked (can be selected)
boolean isUnlocked(ServerPlayer player, ResourceLocation moduleId)

// Whether the module is currently selected
boolean isSelected(ServerPlayer player, ResourceLocation moduleId)

// Whether the module is completed
boolean isCompleted(ServerPlayer player, ResourceLocation moduleId)
```

### Mutation Methods

```java
// Set module unlock state
// Fires ModuleUnlockEvent (Pre) and ModuleUnlockedEvent (Post)
void setUnlocked(ServerPlayer player, ResourceLocation moduleId, boolean unlocked)

// Select a module (consumes Insight Points, checks conditions and cap)
// Fires ModuleSelectEvent (Pre) and ModuleSelectedEvent (Post)
// Applies on_select_reward
void select(ServerPlayer player, ResourceLocation moduleId)

// Complete a module (checks if all insights are unlocked, grants Epiphany Slot)
// Fires ModuleCompleteEvent (Pre) and ModuleCompletedEvent (Post)
// Applies on_complete_reward
void complete(ServerPlayer player, ResourceLocation moduleId)

// Force-select (ignores cost and conditions)
// Fires ModuleSelectedEvent (Post)
void forceSelect(ServerPlayer player, ResourceLocation moduleId)

// Force-complete (ignores insight check, grants Epiphany Slot)
// Fires ModuleCompletedEvent (Post)
void forceComplete(ServerPlayer player, ResourceLocation moduleId)

// Reset module (refunds Insight Points, removes rewards)
void resetModule(ServerPlayer player, ResourceLocation moduleId)

// Auto-unlock locked modules whose conditions are met
// skipEventDriven: whether to skip polling
// silent: whether to fire notification messages in NotificationListener
void checkAutoUnlock(ServerPlayer player, boolean skipEventDriven, boolean silent)

// Clean up module data for registry entries that no longer exist
void cleanupOrphanedData(ServerPlayer player)
```

## `InsightManager`

Manages player insight state.

### Query Methods

```java
// Whether the insight has been unlocked
boolean isSelected(ServerPlayer player, ResourceLocation insightId)

// Whether the insight's owning module is selected
boolean isModuleSelected(ServerPlayer player, ResourceLocation insightId)
```

### Mutation Methods

```java
// Unlock an insight (consumes Insight Points, checks prerequisites)
// Fires InsightSelectEvent (Pre) and InsightSelectedEvent (Post)
void select(ServerPlayer player, ResourceLocation insightId, ResourceLocation moduleId)

// Force-unlock an insight (ignores cost and prerequisites)
void forceSelect(ServerPlayer player, ResourceLocation insightId, ResourceLocation moduleId)

// Reset an insight (refunds Insight Points, removes rewards)
void resetInsight(ServerPlayer player, ResourceLocation insightId)
```

## `EpiphanyManager`

Manages player epiphany state.

### Query Methods

```java
// Whether the epiphany is unlocked (can be selected)
boolean isUnlocked(ServerPlayer player, ResourceLocation epiphanyId)

// Whether the epiphany is currently selected
boolean isSelected(ServerPlayer player, ResourceLocation epiphanyId)
```

### Mutation Methods

```java
// Set epiphany unlock state
void setUnlocked(ServerPlayer player, ResourceLocation epiphanyId, boolean unlocked)

// Select an epiphany (checks slots and conditions)
// Fires EpiphanySelectEvent (Pre) and EpiphanySelectedEvent (Post)
void select(ServerPlayer player, ResourceLocation epiphanyId)

// Force-select (ignores slots and conditions)
void forceSelect(ServerPlayer player, ResourceLocation epiphanyId)

// Reset an epiphany
void resetEpiphany(ServerPlayer player, ResourceLocation epiphanyId)

// Clean up epiphany data for registry entries that no longer exist
void cleanupOrphanedData(ServerPlayer player)

// Auto-unlock locked epiphanies whose conditions are met
// skipEventDriven: whether to skip polling
// silent: whether to fire notification messages in NotificationListener
void checkAutoUnlock(ServerPlayer player, boolean skipEventDriven, boolean silent)
```

## `AptitudeSourceManager`

Manages the granting and retrieval of aptitude.

```java
// Grant aptitude
// behaviorId: behavior ID (e.g., "mymod:foo")
// targetId: target ID (e.g., the entity type that was killed)
// registry: the registry targetId belongs to, used for tag lookup. Can be null
boolean grant(ServerPlayer sp, ResourceLocation behaviorId,
              ResourceLocation targetId, @Nullable Registry<?> registry)
```

Usage example:

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

Aptitude calculation utility class. Currently only supports linear calculation; more formula types are planned.

Formula:

$$
\text{required} = \text{Config.baseAptitudeCap} + (\text{totalSpent} + \text{insightPoints}) \times \text{Config.aptitudeCapGrowth}
$$

```java
// Calculate the aptitude required for the next Insight Point
// totalSpent: total Insight Points spent
// insightPoints: currently available Insight Points
// Returns: required aptitude value
long calcRequiredAptitude(long totalSpent, int insightPoints)
```
