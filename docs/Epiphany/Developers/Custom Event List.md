# Custom Event List

Epiphany provides **15 custom events** for other mods to listen to and respond to player actions. All events are based on NeoForge's event mechanism.

::: tip
All events carry a `ServerPlayer` and fire on the server side only.
:::

::: info
KubeJS scripts also support these events. See the [KubeJS Compat](KubeJS%20Compat.md) section for details.
:::

## Event System

All events extend `EpiphanyEvent`, reside in the `ink.myumoon.epiphany.event` package, and are fired on `NeoForge.EVENT_BUS`.

Events are categorized by timing into two types:

| Type | Naming Pattern | Characteristics |
|------|---------------|-----------------|
| **Pre** | `XxxUnlockEvent` / `XxxSelectEvent` / `XxxCompleteEvent` | `implements ICancellableEvent`, can be cancelled |
| **Post** | `XxxUnlockedEvent` / `XxxSelectedEvent` / `XxxCompletedEvent` / `XxxChangedEvent` | Cannot be cancelled |

## Listening Example

```java
@EventBusSubscriber(modid = "mymod")
public static class MyListener {
    // Pre event: can cancel the player's action
    @SubscribeEvent
    static void onSelect(ModuleSelectEvent e) {
        if (shouldBlock(e.getModuleId())) {
            e.setCanceled(true);
        }
    }

    // Post event: notification only
    @SubscribeEvent
    static void onCompleted(ModuleCompletedEvent e) {
        // react to completion
    }
}
```

## Module Events

All Module events provide `getPlayer()` and `getModuleId()`.

### Module Unlock

#### `ModuleUnlockEvent` — Pre Event
- Cancel effect: module stays locked, Post event not fired

#### `ModuleUnlockedEvent` — Post Event
- Special field: `boolean isSilent()` — determines whether to send a notification message

### Module Selection

#### `ModuleSelectEvent` — Pre Event
- Cancel effect: selection cancelled, no Insight Points consumed

#### `ModuleSelectedEvent` — Post Event

### Module Completion

#### `ModuleCompleteEvent` — Pre Event
- Cancel effect: Post event not fired, no Epiphany Slot granted, no reward applied; module can be re-triggered for completion later

#### `ModuleCompletedEvent` — Post Event

## Insight Events

All Insight events provide `getPlayer()`, `getInsightId()`, and `getModuleId()`.

### Insight Selection

#### `InsightSelectEvent` — Pre Event
- Cancel effect: selection cancelled, no Insight Points consumed

#### `InsightSelectedEvent` — Post Event

::: tip
`InsightManager.select`, after unlocking an insight, calls `ModuleManager.complete` if all insights in the owning module are now unlocked. Thus, a single `select` call can trigger a full event chain: InsightSelect → InsightSelected → ModuleComplete → ModuleCompleted.
:::

## Epiphany Events

All Epiphany events provide `getPlayer()` and `getEpiphanyId()`.

### Epiphany Unlock

#### `EpiphanyUnlockEvent` — Pre Event
- Cancel effect: epiphany stays locked, Post event not fired

#### `EpiphanyUnlockedEvent` — Post Event
- Special field: `boolean isSilent()` — determines whether to send a notification message

### Epiphany Selection

#### `EpiphanySelectEvent` — Pre Event
- Cancel effect: selection cancelled, no slot consumed

#### `EpiphanySelectedEvent` — Post Event

## Aptitude Events

All are Post events, describing the fait accompli that a value has changed.

### `AptitudeChangedEvent` — Post Event

Fired when aptitude changes. Provides:

```java
long getOldAptitude();
long getNewAptitude(); // the remaining value after deducting level-up consumption
```

### `AptitudeLevelUpEvent` — Post Event

Fired when the aptitude bar fills and 1 Insight Point is earned. Fires once per Insight Point gained — if one aptitude addition yields multiple Insight Points, it fires multiple times. Provides:

```java
int getNewInsightPoints();   // total Insight Points at the time of firing
```

### `InsightPointsChangedEvent` — Post Event

Fired when the Insight Point balance changes. **Settlement-level event**: fires only once per API call, regardless of how many internal level-ups occurred.

```java
int getOldValue();
int getNewValue();
int getDelta();              // newValue - oldValue (positive = gain, negative = spend)
boolean isGain();            // newValue > oldValue
```

## Event Summary Table

| Event Class | Type | Getters (besides getPlayer) |
|-------------|:----:|-----------------------------|
| `ModuleUnlockEvent` | Pre | getModuleId |
| `ModuleSelectEvent` | Pre | getModuleId |
| `ModuleCompleteEvent` | Pre | getModuleId |
| `ModuleUnlockedEvent` | Post | getModuleId, isSilent |
| `ModuleSelectedEvent` | Post | getModuleId |
| `ModuleCompletedEvent` | Post | getModuleId |
| `InsightSelectEvent` | Pre | getInsightId, getModuleId |
| `InsightSelectedEvent` | Post | getInsightId, getModuleId |
| `EpiphanyUnlockEvent` | Pre | getEpiphanyId |
| `EpiphanySelectEvent` | Pre | getEpiphanyId |
| `EpiphanyUnlockedEvent` | Post | getEpiphanyId, isSilent |
| `EpiphanySelectedEvent` | Post | getEpiphanyId |
| `AptitudeChangedEvent` | Post | getOldAptitude, getNewAptitude |
| `AptitudeLevelUpEvent` | Post | getNewInsightPoints |
| `InsightPointsChangedEvent` | Post | getOldValue, getNewValue, getDelta, isGain |
