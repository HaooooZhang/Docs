# Module

A Module is an independent, self-contained skill tree unit. Each module is defined by a separate datapack JSON file containing its name, description, unlock condition, initial state, contained insights, and selection/completion rewards.

::: tip
This page describes the Module datapack format. For other datapack types, see: [Insight](Insight.md) / [Epiphany](Epiphany.md) / [Path](Path.md).
:::

## File Location

```
data/<namespace>/epiphany/module/<path>.json
```

- `<namespace>`: your mod or datapack namespace (e.g., `mymod`)
- `<path>`: can be a flat filename or a subdirectory structure
- **The module's registry ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/module/combat.json` → `mymod:combat`
  - `data/mymod/epiphany/module/class/warrior.json` → `mymod:class/warrior`

## Full Example

```jsonc
{
    "name": "Saber",                                    // optional
    "description": "The sword-wielding class",          // optional
    "icon": "minecraft:textures/item/diamond_sword.png",  // optional
    "condition": {                                     // optional
        "type": "epiphany:or",
        "conditions": [
            { "type": "epiphany:kill_entity", "entity": "#minecraft:zombies", "count": 3 },
            { "type": "epiphany:block_broken", "block": "#minecraft:base_stone_overworld", "count": 100 }
        ]
    },
    "condition_description": "Kill 3 undead OR mine 100 stone",  // optional
    "initial_state": "locked",                         // optional, defaults to "selectable"
    "on_select_reward": {                              // optional
        "type": "epiphany:item",
        "item": "minecraft:shield",
        "count": 1
    },
    "on_select_reward_description": "Receive a shield",    // optional
    "on_complete_reward": {                            // optional
        "type": "epiphany:aptitude",
        "amount": 200
    },
    "on_complete_reward_description": "+200 Aptitude",     // optional
    "insights": [                                      // optional, defaults to empty
        { "id": "epiphany:weapon_mastery", "depth": 0 },
        { "id": "epiphany:shield_wall",   "depth": 0 },
        { "id": "epiphany:battle_cry",    "depth": 0 },
        { "id": "epiphany:whirlwind",     "depth": 0 }
    ],
    "weight": 75                                       // optional, defaults to 100
}
```

## Text Components & i18n

The `name`, `description`, and `*_description` fields are all Minecraft [Component](https://minecraft.wiki/w/JSON_text) text components, supporting three writing styles:

```jsonc
"name": "Warrior"                                       // 1. Plain string (equivalent to literal)
"name": { "text": "Warrior", "color": "gold" }          // 2. Styled literal
"name": { "translate": "mymod.module.combat.name" }     // 3. Translation key (looked up in lang files)
```

::: tip i18n
When `name`, `description`, or `*_description` fields are omitted, the system automatically falls back to a convention-based translation key for multilingual support:

```
module.<namespace>.<path>.<field>
```

For example, if module `mymod:combat` has no `name` → the key `module.mymod.combat.name` is automatically used to look up the lang file.

Simply provide translations in `assets/<namespace>/lang/en_us.json`:

```json
{
    "module.mymod.combat.name": "Saber",
    "module.mymod.combat.description": "The sword-wielding class",
    "module.mymod.combat.condition_description": "Kill 3 undead OR mine 100 stone"
}
```

If the key is **also not defined** in the lang file, Minecraft will display the raw key string (e.g., `module.mymod.combat.name`).

**Applicable fields** (same rules apply across all datapack types):
- All types: `name` / `description`
- Module: additionally supports `condition_description` / `on_select_reward_description` / `on_complete_reward_description`
- Insight: additionally supports `reward_description`
- Epiphany: additionally supports `condition_description` / `reward_description`
:::

## Field Reference

### `name` (optional)

- Type: `Component` (string, styled object, or translation key)
- Default: falls back to translation key `module.<ns>.<path>.name` (see "Text Components & i18n" above)

### `description` (optional)

- Type: `Component`
- Default: falls back to translation key `module.<ns>.<path>.description`
- Displayed on module cards and details, explaining the module's theme and gameplay to players

### `icon` (optional)

- Type: `ResourceLocation`, pointing to a texture file in a resource pack
- Default: uses a **three-tier automatic fallback** (see below)

::: tip Icon Auto-Fallback
When the JSON explicitly specifies an `icon`, that path is used directly. When omitted, the system searches in order:

1. **Explicit JSON** → uses the specified `ResourceLocation`
2. **Omitted** → auto-constructs path `textures/gui/<type>/<registryId>.png`, attempts to load it
   - Module: checks `textures/gui/module/<path>.png`
   - Insight: checks `textures/gui/insight/<path>.png`
   - Epiphany: checks `textures/gui/epiphany/<path>.png`
3. **PNG also missing** → falls back to a default in-game item icon (Module = `writable_book`, Insight = `diamond`, Epiphany = `goat_horn`)

For example: a module registered as `mymod:combat` with no `icon` in JSON → the system tries `assets/mymod/textures/gui/module/combat.png`; if that resource also doesn't exist, it ultimately uses the `writable_book` item icon.
:::

::: warning
The `icon` field is a **resource pack texture path**, not an item/block ID. Writing `"icon": "minecraft:diamond_sword"` is incorrect (it won't be parsed).

Correct usage:
```jsonc
"icon": "minecraft:textures/item/diamond_sword.png"  // vanilla item texture path
"icon": "mymod:textures/gui/epiphany/combat.png"      // your custom resource pack texture
```

Either write the full path explicitly, or omit it to use the auto-fallback (don't write an item ID — that's not a valid texture path).
:::

### `condition` (optional)

- Type: condition object (`Condition` Codec)
- Default: no condition
- Only meaningful when `initial_state == "locked"`: when the condition is met, the module **auto-unlocks**
- For the full list of condition types and fields, see [Condition](Condition.md)

### `condition_description` (optional)

- Type: `Component`
- Default: falls back to translation key `module.<ns>.<path>.condition_description`
- When the module is unavailable due to unmet conditions, this text is shown in the UI in red to tell the player what they need to do

### `initial_state` (optional)

- Type: string enum, `"locked"` or `"selectable"`
- Default: `"selectable"`
- Determines the module's initial visibility and selectability

| Value | Meaning |
|-------|---------|
| `"selectable"` | Player can see and select it from the start (typically has no condition) |
| `"locked"` | Player cannot see it initially. If a condition is set, auto-unlocks when met; if no condition, can only be unlocked via API / command |

### `on_select_reward` (optional)

- Type: reward object (`InsightReward` Codec)
- Default: no reward
- The reward **immediately applied** when the player selects this module
- For the full list of reward types and fields, see [Reward](Reward.md)

### `on_select_reward_description` (optional)

- Type: `Component`
- Default: falls back to translation key `module.<ns>.<path>.on_select_reward_description`
- Selection reward description visible when hovering over the module card (hold Shift)
- **The UI displays this text directly** — it will not be auto-derived from the reward type. Always write a player-readable description.

### `on_complete_reward` (optional)

- Type: reward object (`InsightReward` Codec)
- Default: no reward
- An **additional** reward applied when the module is completed (all insights unlocked)
- The system already auto-grants **+1 Epiphany Slot** on completion; this field is for extra rewards

### `on_complete_reward_description` (optional)

- Type: `Component`
- Default: falls back to translation key `module.<ns>.<path>.on_complete_reward_description`
- Same as `on_select_reward_description`, but for the completion reward

### `insights` (optional)

- Type: list of `{ id, depth }`
- Default: empty list
- Lists all insights belonging to this module and their positions in the tree structure

::: warning
Tree Structure Rules:
- **`depth = 0`** are root nodes (topmost layer)
- Multiple insights at the **same depth** are in an **AND relationship**: **all must be unlocked** before the next layer becomes available
- The parent of a depth N node = the **most recent** preceding `depth = N-1` insight in the array (parent-child chains are formed by array order)
:::

### `weight` (optional)

- Type: `int`
- Default: `100`
- Sort weight among modules in the module selection popup (lower = appears earlier)
- Can be negative
