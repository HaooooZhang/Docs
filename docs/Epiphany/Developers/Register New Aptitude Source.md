# Registering a New Aptitude Source

Epiphany ships with 13 built-in aptitude sources, but there are infinitely many behaviors in the game worth rewarding. Third-party mods can extend aptitude sources by registering custom listeners and calling `AptitudeSourceManager.grant(...)`.

::: tip
This page assumes you already understand the datapack usage of the aptitude system. See [Aptitude & Insight Point](Aptitude%20%26%20Insight%20Point.md). Also familiarize yourself with the `AptitudeSourceManager` and `AptitudeSourceResolver` APIs — see [Manager API](Manager%20API.md#aptitudesourcemanager--aptitudesourceresolver).
:::

## Overview

First, a key distinction:

::: tip
**Aptitude behaviors have no "type registration" mechanism.** You simply write a listener in your mod, then call `grant` at the appropriate time.
:::

Unlike [Rewards](Register%20New%20Reward.md) and [Conditions](Register%20New%20Condition.md), aptitude behaviors are not an Entity / Codec dispatch system — **the `epiphany:aptitude` registry is itself a plain datapack registry**, and any namespace + filename can serve as a behavior ID.

Therefore, "registering a new behavior" is actually a **3-step process**:

1. **Datapack**: define the behavior's JSON (sets `default`, `specials`, and `exclude`)
2. **Listener**: register a NeoForge event listener (Java only; nothing to register with Epiphany)
3. **API call**: inside the listener, call `AptitudeSourceManager.grant(sp, behaviorId, targetId, registry)`

## Step 1: Define the Datapack JSON

Create a configuration file at `data/<your-modid>/epiphany/aptitude/<behavior>.json`.

Example: a custom "player fishing" behavior:

```jsonc
// data/mymod/epiphany/aptitude/fishing.json
{
    "default": 2,
    "specials": [
        { "target": "minecraft:cod",           "reward": 5, "first_reward": 30 },
        { "target": "minecraft:tropical_fish", "reward": 8, "first_reward": 50 },
        { "target": "minecraft:pufferfish",    "reward": 6, "first_reward": 40 }
    ],
    "exclude": []
}
```

The behavior ID becomes `mymod:fishing` (namespace + filename).

The specific meaning of the `target` field is determined by **your `grant` call** — matching rules for `"target": "minecraft:cod"` etc. work as described in [Aptitude & Insight Point](Aptitude%20%26%20Insight%20Point.md#field-reference).

## Step 2: Write the Listener

In your mod, create a NeoForge event listener that listens for the game event you care about:

```java
@EventBusSubscriber(modid = "mymod")
public class FishingAptitudeListener {

    // Corresponds to the JSON filename: behavior ID = mymod:fishing
    private static final ResourceLocation FISHING =
            ResourceLocation.fromNamespaceAndPath("mymod", "fishing");

    @SubscribeEvent
    static void onItemFished(ItemFishedEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer sp)) return;
        ResourceLocation targetId = BuiltInRegistries.ITEM.getKey(event.getFishedItem().getItem());
        AptitudeSourceManager.grant(sp, FISHING, targetId, BuiltInRegistries.ITEM);
    }
}

// Note: ItemFishedEvent does not actually exist — this is for demonstration only.
// Use the correct event type for your actual scenario.
```

The behavior ID `FISHING = mymod:fishing` must match the datapack filename. Each time a player fishes, the event's main item serves as the target; `grant` internally uses the JSON's `default` / `specials` / `exclude` to decide whether and how much to grant.

## `grant` API Reference

```java
public static boolean grant(
        ServerPlayer       sp,
        ResourceLocation   behaviorId,    // behavior ID (e.g., mymod:fishing)
        ResourceLocation   targetId,      // specific ID of the triggering object
        @Nullable Registry<?> registry    // registry for resolving #tag references; null if no tags
);
```

Parameter details:

| Parameter | Purpose |
|-----------|---------|
| `sp` | The player who triggered the behavior |
| `behaviorId` | The datapack JSON's registry ID (`namespace:filename`), matching the file from Step 1 |
| `targetId` | The specific object ID for this event (the item fished, the entity killed, the biome entered, etc.) |
| `registry` | Registry used to resolve `"#tag"` references. `BuiltInRegistries` provides common ones (`ITEM`, `BLOCK`, `ENTITY_TYPE`, `BIOME`, `STRUCTURE`). Pass `null` when there's no natural target — `#tag` will not match. |

::: tip Choosing a registry
- Entity-related → `BuiltInRegistries.ENTITY_TYPE`
- Block-related → `BuiltInRegistries.BLOCK`
- Item-related → `BuiltInRegistries.ITEM`
- Biome-related → get the BIOME registry from `sp.level().registryAccess()` (datapack-loaded tags)
- Structure-related → same, get the STRUCTURE registry
- No natural target (e.g., experience level-up) → `null`; `#tag` won't match; only `default` is used
:::

Return value (`true` / `false`):
- `true` = aptitude was granted (rule matched, value > 0)
- `false` = not granted (exclude matched, reward was 0, no JSON configured, etc.)

## Internal Flow

`grant(sp, behaviorId, targetId, registry)` internally:

1. Calls `AptitudeSourceResolver.resolve(...)` to find the JSON configuration, obtaining `Resolution { applies, reward, claimKey }`
2. Applies global multiplier: `scaled = reward × Config.aptitudeGainMultiplier`
3. If `scaled <= 0`, returns `false`
4. If `claimKey != null` (first-reward path) → marks `claimedFirsts` in player data
5. Calls `AptitudeManager.addAptitude(sp, scaled)` → triggers the aptitude event chain (AptitudeChanged / AptitudeLevelUp × N / InsightPointsChanged)

Degradation semantics:
- Malformed IDs, unknown tags, `registry==null` with `#tag` → all treated as "rule does not match"; **no exceptions thrown**
- No JSON configured for this behaviorId → entire `grant` returns `false` (no-op)
- Exclude matched → skips specials and default, returns `false`

## Unifying Multiple Event Sources Under One behaviorId

If you want "fishing + killing rare fish + feeding fish" to all reward via the same `mymod:fishing` JSON, simply call the same `grant(sp, FISHING, ...)` from different listeners. Each event chooses its own target; the JSON configuration can handle multiple targets with different specials for different reward values.
