# Insight

An Insight is the **smallest unit** within a module — an incremental upgrade node. Insights are defined as standalone JSON files, referenced by [Modules](Module.md) via their `insights` list, together forming the module's insight tree.

::: tip
This page describes the Insight datapack format. For other datapack types, see: [Module](Module.md) / [Epiphany](Epiphany.md) / [Path](Path.md).
:::

## File Location

```
data/<namespace>/epiphany/insight/<path>.json
```

- **The insight's registry ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/insight/fireball.json` → `mymod:fireball`
  - `data/mymod/epiphany/insight/spell/fireball.json` → `mymod:spell/fireball`

::: tip Reusing Insights
Technically, different modules can reference the same insight ID. However, this is **not recommended** — each insight should belong to exactly one module.
:::

## Full Example

```jsonc
{
    "name": "Charisma",                                  // optional; falls back to lang translation key
    "description": "The ability to govern a nation",     // optional
    "icon": "minecraft:textures/item/golden_chestplate.png",  // optional
    "cost": 1,                                          // optional, defaults to 1
    "reward": {                                         // optional
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "amount": 6.0,
        "operation": "add_value"
    },
    "reward_description": "+6 Max Health",              // optional
    "weight": 100                                       // optional, defaults to 100
}
```

## Field Reference

### `name` (optional)

- Type: `Component` (string, styled object, or translation key)
- Default: falls back to translation key `insight.<ns>.<path>.name`

::: info Text Components & i18n
All Component fields support plain strings, styled objects, and translation keys. When omitted, they fall back to convention-based translation keys. See [Module · Text Components & i18n](Module.md#text-components--i18n).
:::

### `description` (optional)

- Type: `Component`
- Default: falls back to translation key `insight.<ns>.<path>.description`
- Briefly describes the insight's effect (e.g., `"+6 Max Health"`)

### `icon` (optional)

- Type: `ResourceLocation`, pointing to a resource pack texture
- Default: **three-tier auto-fallback**: explicit JSON → `textures/gui/insight/<path>.png` → default item icon (`diamond`)
- For the full fallback rules and examples, see [Module · icon](Module.md#icon-optional)

::: warning Icon is a texture path, not an item ID
`icon` is a resource pack texture path, not an item/block ID. Either write the full path (e.g., `"minecraft:textures/item/golden_chestplate.png"`) or omit it for auto-fallback.
:::

### `cost` (optional)

- Type: `int`
- Default: `1`
- The number of **Insight Points** consumed to unlock this insight

::: info Distinct from `moduleSelectCost`
`moduleSelectCost` (config option) is the uniform cost for **selecting a module** and is independent from insight costs. Each insight's cost is configured individually.
:::

### `reward` (optional)

- Type: reward object (`InsightReward` Codec)
- Default: no reward
- **Immediately applied** when the player unlocks this insight
- For the full list of reward types and fields, see [Reward](Reward.md)

### `reward_description` (optional)

- Type: `Component`
- Default: falls back to translation key `insight.<ns>.<path>.reward_description`
- Displayed in the insight node's tooltip (hold Shift), intuitively telling the player the reward content
- **The UI displays this text directly** — it will not be auto-derived from the reward type

### `weight` (optional)

- Type: `int`
- Default: `100`
- Affects sort order when multiple insights are displayed flat; of limited practical significance
- Can be negative
