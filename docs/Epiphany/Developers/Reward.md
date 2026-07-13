# Reward Types

Rewards are the mod's reward types, applied immediately when a module is selected or completed, an insight is unlocked, or an epiphany is activated — and reversed on reset (some cannot be removed, in which case there's nothing to be done).

::: info
This page is aimed at datapack authors, explaining the JSON fields of all built-in reward types. For registering new reward types, see [Registering a New Reward](Register%20New%20Reward.md).
:::

## Shared Codec

InsightReward (used by Insights) and EpiphanyReward (used by Epiphanies) **share the same set of 14 implementation classes** with identical JSON fields. Each implementation class is registered once in each registry, but the codec and behavior are the same.

::: tip
In practice, every Reward class implements both `InsightReward` and `EpiphanyReward` interfaces. Therefore, the fields described on this page are **universally applicable** to Module's `on_select_reward` / `on_complete_reward`, Insight's `reward`, and Epiphany's `reward`. Exclusive reward types may be added in the future.
:::

## Usage

Select a specific type via dispatch codec using the `type` field:

```jsonc
"on_select_reward": {
    "type": "epiphany:item",          // ← type determines subsequent fields
    "item": "minecraft:diamond",
    "count": 3
}
```

::: tip Graceful Degradation on Parse Failure
If `type` references an unregistered type, the system **won't crash** but will fall back to no reward (NoOp). Please double-check your type names.
:::

## Persistent Rewards

### `epiphany:attribute` (Attribute Modifier)

Permanently adds an attribute modifier to the player.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `attribute` | ResourceLocation | ✅ | — | Attribute id, e.g., `minecraft:generic.max_health` |
| `amount` | double | | `0.0` | Modifier value |
| `operation` | String | | `add_value` | Modifier operation type |

`operation` values:

| Value | Meaning |
|-------|---------|
| `add_value` (default) | Numeric addition |
| `add_multiplied_base` | Base × amount, added to base |
| `add_multiplied_total` | Total × amount, added to total |

Legacy CamelCase (`ADD_VALUE`, etc.) is also accepted, but `snake_case` is recommended to match vanilla `attribute_modifier` conventions.

::: tip Persistence
`attribute` rewards implement the `PersistentReward` interface — after the player dies or changes dimensions, the system automatically reapplies the modifier. Additionally, `apply()` is idempotent (skips if a modifier with the same ID already exists), so it won't stack.
:::

```jsonc
{
    "type": "epiphany:attribute",
    "attribute": "minecraft:generic.max_health",
    "amount": 6.0,
    "operation": "add_value"
}
```

### `epiphany:effect` (Status Effect)

Adds a persistent status effect to the player.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `effect` | ResourceLocation | ✅ | — | Effect id, e.g., `minecraft:strength` |
| `duration` | int | | `-1` | Duration in ticks; `-1` means **infinite** |
| `amplifier` | int | | `0` | Amplifier (level − 1) |

```jsonc
{
    "type": "epiphany:effect",
    "effect": "minecraft:strength",
    "duration": -1,
    "amplifier": 0
}
```

::: tip Persistence
`effect` implements `PersistentReward` — the effect is automatically reapplied after the player respawns (regardless of `duration`). Respawning always triggers a reapply, so for "permanent effects," it's recommended to set `duration: -1`. However, even with a finite duration, the effect will be freshly reapplied on respawn.
:::

## Item & Experience Rewards

### `epiphany:item` (Give Item)

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `item` | ResourceLocation | ✅ | — | Item id |
| `count` | int | | `1` | Quantity |

Items go directly into the player's inventory; if there's no space, they drop on the ground.

::: tip
`item` rewards implement `remove()`: on reset, the system scans the main inventory + ender chest stack by stack, deducting the corresponding number of matching items (trying its best to deduct the full amount). The player's inventory may have insufficient items, but no error is thrown.
:::

### `epiphany:experience` (Give Experience Points)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `amount` | int | ✅ | Number of experience points (vanilla `player.giveExperiencePoints`) |

### `epiphany:experience_level` (Give Experience Levels)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `levels` | int | ✅ | Number of experience levels (vanilla `player.giveExperienceLevels`) |

::: tip
Both experience types' `remove()` call `giveExperiencePoints(-amount)` / `giveExperienceLevels(-levels)` respectively. Vanilla's negative operations preserve experience progress but won't push levels below 0.
:::

### `epiphany:aptitude` (Give Aptitude)

Increases the player's aptitude. **Triggers the aptitude level-up chain** (if the bar fills, Insight Points are automatically converted).

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `amount` | long | ✅ | Amount of aptitude |

::: warning
`remove()` calls `AptitudeManager.setAptitude(current - amount)` (clamped to ≥ 0). **However**, Insight Points that were converted from aptitude are **not synchronously refunded** because `addAptitude` already wrote the excess as Insight Points into `totalInsightPointsSpent`. While setAptitude clamps to zero, the remove is not a perfect undo of the original add.
:::

### `epiphany:insight_points` (Give Insight Points)

Directly increases the player's available Insight Points (bypassing the aptitude path).

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `amount` | int | ✅ | Number of Insight Points |

`remove()` calls `setInsightPoints(max(0, current - amount))` (clamped to 0).

### `epiphany:command` (Execute Command)

Executes an arbitrary command with server console permission. Use `@s` as a placeholder for the player.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `command` | String | ✅ | Full command string (without leading `/`) |

```jsonc
{
    "type": "epiphany:command",
    "command": "effect give @s minecraft:speed 30 1"
}
```

::: warning Permission
Executes at permission level 2 (operator), equivalent to the console. Can be used to trigger custom commands or call other mods' command interfaces. Be mindful of command security — players can indirectly execute them by unlocking insights.
:::

### `epiphany:particle` (Particle Effect)

Spawns a set of particles at the player's position.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `particle` | ResourceLocation | ✅ | — | Particle id, e.g., `minecraft:flame` |
| `count` | int | | `10` | Number of particles |

::: warning One-shot
`particle` is one-shot (not persistent) and will **not** automatically re-trigger after respawn. `remove()` also does nothing.
:::

## Epiphany State Rewards

These reward types directly modify Epiphany's own state (unlocking or locking other modules / epiphanies). The modification is one-time; if later re-locked, the reward is not reapplied.

### `epiphany:unlock_module` (Unlock Module)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `module` | ResourceLocation | ✅ | Module id |

### `epiphany:lock_module` (Lock Module)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `module` | ResourceLocation | ✅ | Module id |

### `epiphany:unlock_epiphany` (Unlock Epiphany)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `epiphany` | ResourceLocation | ✅ | Epiphany id |

### `epiphany:lock_epiphany` (Lock Epiphany)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `epiphany` | ResourceLocation | ✅ | Epiphany id |

## KubeJS Integration (Soft Dependency)

### `epiphany:kubejs_stage` (Add / Remove Stage)

Adds or removes a KubeJS stage from the player.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `stage` | String | ✅ | — | KubeJS stage name |
| `action` | String | | `add` | `add` or `remove` |

On `remove()`, the operation is **automatically reversed**:
- Original `action: "add"` → removes the stage on reset
- Original `action: "remove"` → re-adds the stage on reset

Silently does nothing if KubeJS is not installed.

```jsonc
{ "type": "epiphany:kubejs_stage", "stage": "ascended", "action": "add" }
```

## Built-in Type Quick Reference

| type | Key Fields | Persistent? | remove Behavior |
|------|-----------|:-----------:|-----------------|
| `attribute` | attribute, amount, operation | ✅ | Remove modifier |
| `effect` | effect, duration (-1 = infinite), amplifier | ✅ | Remove effect instance |
| `item` | item, count | ❌ | Deduct from inventory + ender chest |
| `experience` | amount | ❌ | `giveExperiencePoints(-amount)` |
| `experience_level` | levels | ❌ | `giveExperienceLevels(-levels)` |
| `aptitude` | amount | ❌ | Deduct aptitude (Insight Points not refunded) |
| `insight_points` | amount | ❌ | `setInsightPoints(current - amount)` |
| `command` | command | ❌ | Stub (cannot undo commands) |
| `unlock_module` | module | ❌ | Call `setUnlocked(false)` to re-lock |
| `lock_module` | module | ❌ | Call `setUnlocked(true)` to re-unlock |
| `unlock_epiphany` | epiphany | ❌ | Call `setUnlocked(false)` to re-lock |
| `lock_epiphany` | epiphany | ❌ | Call `setUnlocked(true)` to re-unlock |
| `particle` | particle, count | ❌ | Stub (particles are transient) |
| `kubejs_stage` | stage, action | ❌ | Reverse stage operation (add ↔ remove) |
