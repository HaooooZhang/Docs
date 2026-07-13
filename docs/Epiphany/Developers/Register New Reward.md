# Registering a New Reward

Epiphany's reward system is data-driven and uses a Codec dispatch pattern, extensible by third-party mods through NeoForge's `DeferredRegister` standard mechanism. This page demonstrates how to register a brand-new Reward type for use in datapacks.

::: tip Prerequisite Reading
This page assumes you already understand reward usage on the datapack JSON side. See [Reward](Reward.md). Also be familiar with NeoForge `DeferredRegister` and Codec dispatch.
:::

## Overview

Registering a new Reward type involves three steps:

1. **Implement the `InsightReward` or `EpiphanyReward` interface** (or both for sharing)
2. **Provide a `MapCodec<T>` for your class** (serialization)
3. **Register the codec to the appropriate registry via `DeferredRegister`**

There are two registry keys, located in `EpiphanyRegistries`:

| Registry Key | Used For |
|--------------|----------|
| `INSIGHT_REWARD_SERIALIZERS` | Module `on_select` / `on_complete` + Insight `reward` |
| `EPIPHANY_REWARD_SERIALIZERS` | Epiphany `reward` |
| (Register in both) | When you want the reward usable in Module/Insight/Epiphany alike |

::: tip
💡 All of Epiphany's built-in reward classes **implement both interfaces** and are registered once in each registry, with identical JSON fields. This is not purely technical debt — if a reward is truly unsuitable for a particular context, you can choose to implement only one interface.
:::

## Step 1: Implement the Interface

Interface definition (`content/reward/InsightReward.java`):

```java
public interface InsightReward {

    // Dispatch codec — provided by Epiphany, no need to implement yourself
    Codec<InsightReward> CODEC = DefaultedCodec.registryDispatch(...);

    // Your class must return this, used for dispatch
    MapCodec<? extends InsightReward> codec();

    // Grant the reward — called immediately when the reward JSON is triggered
    void apply(ServerPlayer player, ResourceLocation sourceId);

    // Remove the reward — optional, defaults to no-op. Called in reverse on reset
    default void remove(ServerPlayer player, ResourceLocation sourceId) {}
}
```

The `EpiphanyReward` interface has **identical method signatures** (method/codec types differ; the interfaces themselves are parallel).

### Full Example

Below registers a `my_multi_item` type with JSON `{ "type": "mymod:my_multi_item", "items": [...] }` that grants multiple different items:

```java
public record MyMultiItemReward(List<Holder<Item>> items) implements InsightReward, EpiphanyReward {

    public static final MapCodec<MyMultiItemReward> CODEC = RecordCodecBuilder.mapCodec(instance -> instance.group(
            BuiltInRegistries.ITEM.holderByNameCodec().listOf().fieldOf("items")
                    .forGetter(MyMultiItemReward::items)
    ).apply(instance, MyMultiItemReward::new));

    @Override
    public MapCodec<MyMultiItemReward> codec() { return CODEC; }

    @Override
    public void apply(ServerPlayer player, ResourceLocation sourceId) {
        for (var item : items) {
            player.getInventory().add(new ItemStack(item));
        }
    }

    // remove() not implemented — this reward is one-shot
}
```

## Step 2: Register to the Registry

In your mod's initialization phase (typically the `@Mod` main class or a registration class):

```java
@Mod("mymod")
public class MyMod {
    public static final DeferredRegister<MapCodec<? extends InsightReward>> INSIGHT_REWARDS =
            DeferredRegister.create(EpiphanyRegistries.INSIGHT_REWARD_SERIALIZERS, "mymod");

    public static final DeferredRegister<MapCodec<? extends EpiphanyReward>> EPIPHANY_REWARDS =
            DeferredRegister.create(EpiphanyRegistries.EPIPHANY_REWARD_SERIALIZERS, "mymod");

    // The registration ID becomes the `path` part of the `type` field — full type is mymod:my_multi_item
    public static final DeferredHolder<MapCodec<? extends InsightReward>, MapCodec<MyMultiItemReward>>
            MY_MULTI_ITEM_INSIGHT = INSIGHT_REWARDS.register("my_multi_item", () -> MyMultiItemReward.CODEC);

    public static final DeferredHolder<MapCodec<? extends EpiphanyReward>, MapCodec<MyMultiItemReward>>
            MY_MULTI_ITEM_EPIPHANY = EPIPHANY_REWARDS.register("my_multi_item", () -> MyMultiItemReward.CODEC);

    public MyMod(IEventBus modBus) {
        INSIGHT_REWARDS.register(modBus);
        EPIPHANY_REWARDS.register(modBus);
    }
}
```

::: tip Type naming
The registered ID (`"my_multi_item"`) determines the `type` field in JSON. The full type is `<your-modid>:<id>` (i.e., `mymod:my_multi_item`).
:::

## Step 3: Use in Datapacks

After registration, datapack JSONs can use the new type:

```jsonc
// data/mymod/epiphany/insight/welcome_gift.json
{
    "name": "Welcome Gift",
    "reward": {
        "type": "mymod:my_multi_item",
        "items": [
            "minecraft:bread",
            "minecraft:iron_axe",
            "minecraft:torch"
        ]
    }
}
```

## `PersistentReward` (Optional)

If your reward should be **automatically reapplied after the player respawns** (typical: attribute modifiers, permanent effects), additionally implement the `PersistentReward` marker interface:

```java
public record MyRegenReward(double amount) implements InsightReward, EpiphanyReward, PersistentReward {
    // ...

    @Override
    public void apply(ServerPlayer player, ResourceLocation sourceId) {
        // ⚠️ Must be idempotent! The reapply chain on respawn will call apply() again.
        // Check whether it's already applied; only apply once.
        // For example: use sourceId as a key, check if a modifier with that ID already exists
    }
}
```

::: warning `apply` must be idempotent
`PersistentReward.reapplyAll`, triggered on `PlayerRespawnEvent`, directly calls `apply()` **without checking whether it's already applied**. Therefore your `apply()` must guarantee idempotence on its own — otherwise effects will stack (e.g., multiple +2 health → cumulative +N).

See the built-in `AttributeReward` implementation, which checks `attr.getModifier(modifierId)` to skip duplicate application.
:::

## Codec Writing Tips

| Requirement | Recommended API |
|-------------|-----------------|
| Required field | `XXX.fieldOf("name")` |
| Optional field with default | `XXX.optionalFieldOf("name", defaultValue)` |
| Resolve by ID directly (entity/block/item, etc.) | `BuiltInRegistries.ENTITY_TYPE.holderByNameCodec()` or the corresponding registry |
| Tag support (`"#tag"` / plain id) | Write your own `Codec.STRING` parser, or use the built-in `OrTagCodec` if available |
| Nested Component / Reward / Condition | Use their respective `CODEC` static fields |

`RecordCodecBuilder.mapCodec(...)` is the most common record-friendly pattern — field order matches the record constructor parameter order.

## Registering to Only One Registry

If your reward is clearly only for Insights or only for Epiphanies, you can register to just one registry. However, missing one will cause JSON parse failures in the other context (falling back to NoOp).

## Parse Failure Behavior

Epiphany wraps the dispatch codec with `DefaultedCodec.registryDispatch(...)`:

- Unregistered `type` → falls back to `NoOpInsightReward.INSTANCE` / `NoOpEpiphanyReward.INSTANCE`
- Malformed JSON format → same

**This means your datapack won't crash due to a typo**, but the reward will silently do nothing. Test carefully.
