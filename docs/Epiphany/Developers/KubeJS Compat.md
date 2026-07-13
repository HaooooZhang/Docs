# KubeJS Compat

Epiphany provides full KubeJS compatibility, allowing modpack authors to listen to events, call APIs, and query data through JavaScript scripts. All functionality is registered via the standard KubeJS plugin mechanism.

::: tip
All scripts reside in the `server_scripts/` directory and run on the server side only.
:::

::: info
All concepts introduced in this section correspond one-to-one with [Custom Events](Custom%20Event%20List.md) and [Manager API](Manager%20API.md). Unless otherwise noted, behavior is identical to the Java side.
:::

## Overview

Epiphany provides two entry points via the KubeJS plugin:

| Namespace | Purpose | Source |
|-----------|---------|--------|
| `EpiphanyEvents.*` | **Listen to events** (15 events related to Module/Insight/Epiphany/Aptitude) | KubeJS EventGroup |
| `Epiphany.*` | **Call API** (Manager methods + data queries) | KubeJS Binding |

::: warning Namespace separation
Event listening uses `EpiphanyEvents.*`, API calls use `Epiphany.*`. The two are deliberately placed in different namespaces to avoid name collisions.
:::

Plugin entry point: `ink.myumoon.epiphany.event.kubejs.EpiphanyKubeJSPlugin`, discovered via `kubejs.plugins.txt`.

## Events (`EpiphanyEvents.*`)

All events carry a `player` field (`ServerPlayer`). Each event carries relevant id fields (e.g., `moduleId`, `insightId`, `epiphanyId`) for scripts to read.

### Naming Convention

| Suffix | Meaning | Cancellable |
|--------|---------|:-----------:|
| **Present tense** (e.g., `moduleUnlock`, `moduleSelect`, `moduleComplete`) | Pre event, cancel with `event.cancel()` | ✅ |
| **Past tense** (e.g., `moduleUnlocked`, `moduleSelected`, `moduleCompleted`) | Post event, notification only | ❌ |

::: tip Cancellation mechanism
Pre events are cancelled using KubeJS-standard `event.cancel()`, **not** the Java-side `setCanceled(true)`. The plugin internally bridges to native NeoForge events.
:::

### Module Events

| Event Name | Type | When It Fires |
|------------|:----:|---------------|
| `moduleUnlock` | Pre (cancellable) | Module is about to be unlocked |
| `moduleUnlocked` | Post | Module has been unlocked |
| `moduleSelect` | Pre (cancellable) | Module is about to be selected |
| `moduleSelected` | Post | Module has been selected |
| `moduleComplete` | Pre (cancellable) | Module is about to be completed |
| `moduleCompleted` | Post | Module has been completed |

### Insight Events

::: tip Cascading
After `insightSelected` fires, if all insights in the owning module are now unlocked, it **automatically chains** into Module's `moduleComplete` / `moduleCompleted`. A single `insightSelect` call can trigger a full 4-event chain.
:::

| Event Name | Type | Description |
|------------|:----:|-------------|
| `insightSelect` | Pre (cancellable) | Insight is about to be unlocked |
| `insightSelected` | Post | Insight has been unlocked |

### Epiphany Events

| Event Name | Type | Description |
|------------|:----:|-------------|
| `epiphanyUnlock` | Pre (cancellable) | Epiphany is about to be unlocked |
| `epiphanyUnlocked` | Post | Epiphany has been unlocked |
| `epiphanySelect` | Pre (cancellable) | Epiphany is about to be activated |
| `epiphanySelected` | Post | Epiphany has been activated |

### Aptitude Events (All Post)

::: warning Trigger frequency differences
`aptitudeLevelUp` fires **once per +1 Insight Point** (one `addAptitude` call can trigger it **multiple times**). In contrast, `insightPointsChanged` is a **settlement-level event** — regardless of how many internal level-ups occur in one call, it fires only once. Use the latter for notifications, the former for per-point tracking.
:::

| Event Name | Description |
|------------|-------------|
| `aptitudeChanged` | When aptitude value changes |
| `aptitudeLevelUp` | When the bar fills and an Insight Point is earned (once per +1) |
| `insightPointsChanged` | When the Insight Point balance changes (settlement-level, once per call) |

## Bindings (`Epiphany.*`)

All methods execute synchronously on the server side. The `player` parameter must be of type `ServerPlayer`.

### Utilities

```js
Epiphany.id(namespace, path)   // Construct a ResourceLocation
Epiphany.id('mymod', 'foo')    // → 'mymod:foo'
```

You can also use KubeJS string literals like `'mymod:foo'` — both are equivalent.

### Module

| Method | Description |
|--------|-------------|
| `isModuleUnlocked(player, id)` | Query: is the module unlocked? |
| `isModuleSelected(player, id)` | Query: is the module selected? |
| `isModuleCompleted(player, id)` | Query: is the module completed? |
| `moduleUnlock(player, id)` | Unlock the module |
| `moduleLock(player, id)` | Lock the module |
| `moduleSelect(player, id)` | Select the module (consumes Insight Points) |
| `moduleForceSelect(player, id)` | Force select (ignores cost/conditions/cap) |
| `moduleComplete(player, id)` | Complete the module (requires all insights unlocked) |
| `moduleForceComplete(player, id)` | Force complete |
| `moduleReset(player, id)` | Reset the module (refunds Insight Points, removes rewards) |

### Insight

| Method | Description |
|--------|-------------|
| `isInsightSelected(player, id)` | Query: is the insight unlocked? |
| `isInsightModuleSelected(player, id)` | Query: is the insight's owning module selected? |
| `insightSelect(player, insightId, moduleId)` | Unlock the insight (consumes Insight Points) |
| `insightForceSelect(player, insightId, moduleId)` | Force unlock (ignores cost/prerequisites) |
| `insightReset(player, id)` | Reset the insight |

### Epiphany

| Method | Description |
|--------|-------------|
| `isEpiphanyUnlocked(player, id)` | Query: is the epiphany unlocked? |
| `isEpiphanySelected(player, id)` | Query: is the epiphany activated? |
| `epiphanyUnlock(player, id)` | Unlock the epiphany |
| `epiphanyLock(player, id)` | Lock the epiphany |
| `epiphanySelect(player, id)` | Activate the epiphany (consumes 1 slot) |
| `epiphanyForceSelect(player, id)` | Force activate (ignores slot limits) |
| `epiphanyReset(player, id)` | Reset the epiphany |

### Aptitude / Points

| Method | Returns | Description |
|--------|:-------:|-------------|
| `getAptitude(player)` | `long` | Current aptitude |
| `getInsightPoints(player)` | `int` | Available Insight Points |
| `getTotalInsightPointsSpent(player)` | `int` | Total Insight Points spent |
| `setAptitude(player, value)` | — | Set aptitude |
| `addAptitude(player, amount)` | — | Add aptitude (may trigger level-ups) |
| `setInsightPoints(player, value)` | — | Set Insight Points |
| `calcRequiredAptitude(totalSpent, points)` | `long` | Calculate aptitude needed for next Insight Point |

### Aptitude Source (Custom Aptitude Sources)

| Method | Returns | Description |
|--------|:-------:|-------------|
| `grantAptitude(player, behaviorId, targetId, registry)` | `boolean` | Grant aptitude per datapack rules |
| `resolveAptitudeSource(player, behaviorId, targetId, registry)` | `Resolution` | Pure query without granting |

Pass `null` for the `registry` parameter (used for resolving tag references) if not needed.

### Data Queries (Datapack Registry)

Four methods for querying datapack-defined content. Returns `null` when not found:

| Method | Return Type |
|--------|-------------|
| `getModule(id)` | `ModuleData` |
| `getInsight(id)` | `InsightData` |
| `getEpiphany(id)` | `EpiphanyData` |
| `getPath(id)` | `PathData` |

The returned records' fields can be accessed directly. For example:

```js
let module = Epiphany.getModule('mymod:combat');
if (module) {
    console.info(module.name);          // Optional<Component>
    console.info(module.description);   // Optional<Component>
    console.info(module.initialState);  // 'locked' or 'selectable'
    console.info(module.weight);        // number
    module.insights.forEach(entry => {
        console.info(entry.id, entry.depth);  // insight ID + depth
    });
}
```

::: warning Optional fields and lang fallback
The `name`, `description`, and `*_description` fields exposed on records are **raw Optionals** — they contain whatever was written in the datapack JSON, without applying the default lang fallback logic. For example:

- `module.name` → `Optional<Component>`, may be empty (if JSON omitted `name`)
- `module.name.get().getString()` → returns the JSON literal (or translation key string), but does **not** go through lang translation fallback

If you provide multilingual support via resource packs, use each data type's `effectiveXxx(id)` method:

```js
let id = 'mymod:combat';
let module = Epiphany.getModule(id);
if (module) {
    // Raw — may be empty
    let rawName = module.name;  // Optional<Component>

    // Resolved — goes through full lang fallback chain
    let displayName = module.effectiveName(id).getString();
}
```
:::
