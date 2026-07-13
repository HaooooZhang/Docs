# Registering a New Condition

Epiphany's condition types are data-driven and use a Codec dispatch pattern, extensible by third-party mods through NeoForge's `DeferredRegister` standard mechanism. This page demonstrates how to register a brand-new Condition type for use in datapacks.

::: tip Prerequisite Reading
This page assumes you already understand condition usage on the datapack JSON side. See [Condition](Condition.md). Also be familiar with NeoForge `DeferredRegister` and Codec dispatch.
:::

## Overview

Registering a new Condition type involves three steps:

1. **Implement the `Condition` interface**
2. **Provide a `MapCodec<T>` for your class**
3. **Register the codec to `EpiphanyRegistries.CONDITION_SERIALIZERS` via `DeferredRegister`**

## The `Condition` Interface

From `content/condition/Condition.java` (excerpt):

```java
public interface Condition {

    // Dispatch codec — provided by Epiphany, no need to implement yourself
    Codec<Condition> CODEC = DefaultedCodec.registryDispatch(
        EpiphanyRegistries.CONDITION_SERIALIZERS,
        Condition::codec,
        Function.identity(),
        () -> AlwaysCondition.INSTANCE
    );

    // Your class must return this, used for dispatch
    MapCodec<? extends Condition> codec();

    // Core evaluation method — called by Epiphany's auto-unlock polling
    boolean test(ServerPlayer player);

    // Optional: whether this condition is event-driven (see "Event-Driven" below)
    default boolean isEventDriven() {
        return false;
    }
}
```

## Step 1: Implement the Interface

### Full Example: Game Mode Condition

Below is a `game_mode` type that checks the player's current GameType (Survival / Creative / etc.):

```java
public record GameModeCondition(GameType gameMode) implements Condition {

    public static final MapCodec<GameModeCondition> CODEC =
            RecordCodecBuilder.mapCodec(instance -> instance.group(
                    GameType.CODEC.fieldOf("mode")
                            .forGetter(GameModeCondition::gameMode)
            ).apply(instance, GameModeCondition::new));

    @Override
    public MapCodec<? extends Condition> codec() {
        return CODEC;
    }

    @Override
    public boolean test(ServerPlayer player) {
        return player.server.getPlayerList().getPlayerGameType(player) == gameMode;
    }
}
```

## Step 2: Register to the Registry

In your mod's main class or a registration class:

```java
@Mod("mymod")
public class MyMod {
    public static final DeferredRegister<MapCodec<? extends Condition>> CONDITIONS =
            DeferredRegister.create(EpiphanyRegistries.CONDITION_SERIALIZERS, "mymod");

    public static final DeferredHolder<MapCodec<? extends Condition>, MapCodec<GameModeCondition>>
            GAME_MODE = CONDITIONS.register("game_mode", () -> GameModeCondition.CODEC);

    public MyMod(IEventBus modBus) {
        CONDITIONS.register(modBus);
    }
}
```

## Step 3: Use in Datapacks

```jsonc
{
    "name": "Creative-Only Module",
    "condition": {
        "type": "mymod:game_mode",
        "mode": "creative"
    },
    "initial_state": "locked"
}
```

## `isEventDriven` (Optional Override)

Some conditions **should not be evaluated by the 10-tick polling** because the evaluation itself is expensive (e.g., traversing FTBQ registries, remote queries, etc.). Such conditions should override `isEventDriven()` to return `true`:

```java
@Override
public boolean isEventDriven() {
    return true;
}
```

::: warning How event-driven conditions work
- Epiphany's **`AutoUnlockListener` periodic polling** skips conditions where `isEventDriven() == true`
- These conditions can only be force-re-evaluated when **specific events fire** — for example, the built-in FTBQ conditions trigger an unlock check when an FTBQ quest completion event fires

If you register an event-driven condition but don't register a corresponding "trigger listener," the condition will **never be evaluated**, and the module/epiphany will be **stuck in `locked` forever**. You **must** pair it with trigger logic.
:::

## Sharing a Single Class for Both Module & Epiphany

Unlike Rewards (which have two parallel interfaces: InsightReward and EpiphanyReward), **the Condition interface is unified**. The same Condition type can be directly referenced by both Module JSON and Epiphany JSON without duplicate registration.

## Parse Failure Behavior

Epiphany's `DefaultedCodec.registryDispatch(...)` guarantees:

- Unregistered `type` → falls back to `AlwaysCondition.INSTANCE` (always true)
- Malformed JSON format → same

**No crashes**, but the condition silently becomes always-true — which may cause modules to auto-unlock when you didn't expect them to. Test your type name spelling.

## Reset / Reapply Behavior

Conditions are **only called during evaluation** and do not involve persistence. Epiphany does not re-call conditions during the reset / reapply chain.

There is no need to worry about `remove()` or other reverse operations.
