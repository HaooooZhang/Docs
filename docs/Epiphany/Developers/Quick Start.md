# Quick Start

This page helps modpack authors and mod developers get started with Epiphany in under 5 minutes. It covers three areas: **adding the dependency**, **a minimal working datapack**, and **controlling player data via the API**.

::: info
This page is aimed at readers with **NeoForge development experience**. Pure datapack authors can read only the first two sections (no Java required).
:::

## Requirements

| Item | Version |
|------|---------|
| Minecraft | `1.21.1` |
| NeoForge | `21.1.234` or higher |
| Java | `21` |
| LDLib2 | `2.2.26` (required dependency — UI framework) |

Optional integrations:
- **FTB Quests** (`2101.1.0+`) — enables `epiphany:ftbq_quest`, `epiphany:ftbq_chapter_completed`, and related conditions & aptitude behaviors
- **KubeJS** (`2101.7.2+`) — enables [KubeJS Compat](KubeJS%20Compat.md) and `epiphany:kubejs_stage` condition / reward

## Your First Datapack: Module + Insight + Aptitude

With just 4 JSON files, you can define a complete skill tree module. Place them in a datapack directory (or inside your mod at `src/main/resources/data/<your-ns>/`).

### File 1: Define an Insight

```jsonc
// data/myfirstpack/epiphany/insight/sturdy.json
{
    "name": "Sturdy",
    "description": "Max Health +4",
    "icon": "minecraft:textures/item/golden_apple.png",
    "cost": 1,
    "reward": {
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "amount": 4.0,
        "operation": "add_value"
    },
    "reward_description": "+4 Max Health"
}
```

→ Registry ID: `myfirstpack:sturdy`

### File 2: Define a Module Referencing That Insight

```jsonc
// data/myfirstpack/epiphany/module/survivor.json
{
    "name": "Survivor",
    "description": "Survive your adventures and strengthen your body.",
    "icon": "minecraft:textures/item/golden_chestplate.png",
    "initial_state": "selectable",
    "insights": [
        { "id": "myfirstpack:sturdy", "depth": 0 }
    ]
}
```

→ Registry ID: `myfirstpack:survivor` — visible and selectable from the start.

### File 3: Configure an Aptitude Source

```jsonc
// data/myfirstpack/epiphany/aptitude/kill_entity.json
{
    "default": 3,
    "specials": [
        { "target": "minecraft:zombie", "reward": 5, "first_reward": 50 }
    ],
    "exclude": [
        "#epiphany:friendly",
        "minecraft:armor_stand"
    ]
}
```

### File 4: Optional — lang File for i18n

If you want internationalization, omit the `name` fields and provide translations in `assets/myfirstpack/lang/en_us.json`:

```json
{
    "module.myfirstpack.survivor.name": "Survivor",
    "module.myfirstpack.survivor.description": "Survive your adventures and strengthen your body."
}
```

See [i18n](i18n.md) for details.

## Controlling Players via the Manager API

After adding Epiphany as a dependency (add Epiphany's JAR or Maven coordinates to your `build.gradle` `implementation`), you can call the Manager API from your own mod:

```java
@EventBusSubscriber(modid = "mymod")
public class MyIntegration {

    @SubscribeEvent
    static void onLogin(PlayerEvent.PlayerLoggedInEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer sp)) return;

        // Query player progress
        long apt = AptitudeManager.getAptitude(sp);
        int pts = AptitudeManager.getInsightPoints(sp);

        // Example: grant 50 aptitude + unlock Survivor on first login
        ResourceLocation survivor = ResourceLocation.fromNamespaceAndPath("myfirstpack", "survivor");
        if (!ModuleManager.isUnlocked(sp, survivor)) {
            ModuleManager.setUnlocked(sp, survivor, true);
            AptitudeManager.addAptitude(sp, 50);
        }
    }
}
```

See the full API in [Manager API](Manager%20API.md). All mutation methods fire [Custom Events](Custom%20Event%20List.md).

## Listening to Events

Listen to the 15 custom events via NeoForge's standard event system:

```java
@EventBusSubscriber(modid = "mymod")
public class MyModuleRule {
    @SubscribeEvent
    static void onSelect(ModuleSelectEvent e) {
        // Pre event: cancel module selection
        if (/* your condition */) {
            e.setCanceled(true);
            e.getPlayer().sendSystemMessage(
                Component.literal("This module is unavailable during this story phase."));
        }
    }
}
```

## Registering New Extensions

| What You Want | Section |
|---------------|---------|
| Register a new condition type (Java → datapack) | [Registering a New Condition](Register%20New%20Condition.md) |
| Register a new reward type | [Registering a New Reward](Register%20New%20Reward.md) |
| Register a new aptitude source | [Registering a New Aptitude Source](Register%20New%20Aptitude%20Source.md) |

## Debugging Tips

- **Command debugging**: See [Command Reference](../Players/Command.md) — admin commands can forcibly query / modify player state.
- **Parse failure fallback**: Epiphany uses `DefaultedCodec` to silently fall back to defaults (Always / NoOp) when `type` names or JSON formats are malformed — it won't crash. If your config isn't taking effect, double-check `type` naming, field spelling, and namespace matching.

## Recommended Learning Path

1. Read [Mechanics](../Players/Gameplay.md) to understand the player perspective
2. Read [Module](Module.md) / [Insight](Insight.md) / [Epiphany](Epiphany.md) / [Path](Path.md) for datapack field definitions
3. Read [Manager API](Manager%20API.md) and [Custom Event List](Custom%20Event%20List.md)
4. Read [Aptitude & Insight Point](Aptitude%20%26%20Insight%20Point.md) to understand the resource economy
5. Explore [Condition](Condition.md) / [Reward](Reward.md) type references
6. Register your own extensions (Condition / Reward / Aptitude Source)
