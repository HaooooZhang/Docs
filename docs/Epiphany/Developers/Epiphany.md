# Epiphany

An Epiphany is a **qualitative** ability, activated in an Epiphany Slot earned by completing modules. Epiphanies can be grouped via the `path` field.

::: tip
This page describes the Epiphany datapack format. For other datapack types, see: [Module](Module.md) / [Insight](Insight.md) / [Path](Path.md).
:::

## File Location

```
data/<namespace>/epiphany/epiphany/<path>.json
```

- **The epiphany's registry ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/epiphany/blazing_aura.json` → `mymod:blazing_aura`
  - `data/mymod/epiphany/epiphany/fire/aura.json` → `mymod:fire/aura`

::: warning The repeated `epiphany` in the path
Note the file path is `data/<ns>/epiphany/epiphany/` — the first `epiphany` is the datapack type directory (one of the top-level four), and the second is the Epiphany data type directory itself. This is a mod structure convention, not a typo.
:::

## Full Example

```jsonc
{
    "name": "Excalibur",                                  // optional; falls back to lang translation key
    "description": "Anti-fortress Noble Phantasm",        // optional
    "icon": "minecraft:textures/item/totem_of_undying.png",  // optional
    "path": "epiphany:war",                             // optional
    "condition": {                                      // optional
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "comparison": ">=",
        "value": 30.0
    },
    "condition_description": "Max Health ≥ 30",         // optional
    "initial_state": "locked",                          // optional, defaults to "selectable"
    "reward": {                                         // optional
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "amount": 10.0,
        "operation": "ADD_VALUE"
    },
    "reward_description": "+10 Max Health",             // optional
    "weight": 100                                       // optional, defaults to 100
}
```

## Field Reference

### `name` (optional)

- Type: `Component` (string, styled object, or translation key)
- Default: falls back to translation key `epiphany.<ns>.<path>.name`

::: info Text Components & i18n
All Component fields support plain strings, styled objects, and translation keys. When omitted, they fall back to convention-based translation keys. See [Module · Text Components & i18n](Module.md#text-components--i18n).
:::

### `description` (optional)

- Type: `Component`
- Default: falls back to translation key `epiphany.<ns>.<path>.description`
- Describes the epiphany's effect or background lore, displayed in the epiphany slot tooltip

### `icon` (optional)

- Type: `ResourceLocation`, pointing to a resource pack texture
- Default: **three-tier auto-fallback**: explicit JSON → `textures/gui/epiphany/<path>.png` → default item icon (`goat_horn`)
- For the full fallback rules and examples, see [Module · icon](Module.md#icon-optional)

::: warning Icon is a texture path, not an item ID
`icon` is a resource pack texture path, not an item/block ID. Either write the full path (e.g., `"minecraft:textures/item/totem_of_undying.png"`) or omit it for auto-fallback.
:::

### `path` (optional)

- Type: `ResourceLocation`, pointing to a Path registry ID
- Default: epiphany is assigned to the "default group"
- Reference format: `"<namespace>:<path_id>"` (e.g., `"epiphany:war"`)

::: info One-way reference
An epiphany **unidirectionally references** a Path via the `path` field. The Path itself does not reverse-list its subordinate epiphanies; this relationship is reverse-built by the system at UI render time. See [Path](Path.md).
:::

### `condition` (optional)

- Type: condition object (`Condition` Codec)
- Default: no condition
- Only meaningful when `initial_state == "locked"`: **auto-unlocks** when the condition is met
- For the full list of condition types and fields, see [Condition](Condition.md)

### `condition_description` (optional)

- Type: `Component`
- Default: falls back to translation key `epiphany.<ns>.<path>.condition_description`
- When the epiphany is not yet unlocked, the UI shows this text to tell the player what's needed

### `initial_state` (optional)

- Type: string enum, `"locked"` or `"selectable"`
- Default: `"selectable"`

| Value | Meaning |
|-------|---------|
| `"selectable"` | Selectable as long as a slot is available (the default; typically has no condition) |
| `"locked"` | Hidden until condition is met / API or command unlocks it |

::: tip Difference from Module
Epiphanies do not have an "Insight Point cost to select" concept — activating an epiphany consumes an **Epiphany Slot** (earned automatically by completing modules).
:::

### `reward` (optional)

- Type: reward object (`EpiphanyReward` Codec)
- Default: no reward
- Immediately applied when the epiphany is activated
- For the full list of reward types and fields, see [Reward](Reward.md)

::: info InsightReward vs. EpiphanyReward
Epiphany's reward uses the `EpiphanyReward` Codec. However, most built-in reward implementation classes **implement both the InsightReward and EpiphanyReward interfaces** (sharing logic), so the JSON fields are identical.
:::

### `reward_description` (optional)

- Type: `Component`
- Default: falls back to translation key `epiphany.<ns>.<path>.reward_description`
- Reward description shown in the tooltip (hold Shift)
- **The UI displays this text directly** — it will not be auto-derived from the reward type

### `weight` (optional)

- Type: `int`
- Default: `100`
- Sort weight among epiphanies within the same path grouping
- Can be negative
