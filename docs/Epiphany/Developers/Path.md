# Path

A Path is a **categorization label** for epiphanies, used only for UI grouping and display — it does not affect any game logic.

::: tip
This page describes the Path datapack format. For other datapack types, see: [Module](Module.md) / [Insight](Insight.md) / [Epiphany](Epiphany.md).
:::

## File Location

```
data/<namespace>/epiphany/path/<path>.json
```

- **The path's registry ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/path/war.json` → `mymod:war`
  - `data/mymod/epiphany/path/element/fire.json` → `mymod:element/fire`

## Full Example

```jsonc
{
    "name": "What is a hero...",                          // optional; falls back to lang translation key
    "description": "...supposed to be?",                  // optional
    "icon": "minecraft:textures/item/iron_sword.png",    // optional
    "weight": 100                                        // optional, defaults to 100
}
```

## Field Reference

### `name` (optional)

- Type: `Component` (string, styled object, or translation key)
- Default: falls back to translation key `path.<ns>.<path>.name`

::: info Text Components & i18n
All Component fields support plain strings, styled objects, and translation keys. When omitted, they fall back to convention-based translation keys. See [Module · Text Components & i18n](Module.md#text-components--i18n).
:::

### `description` (optional)

- Type: `Component`
- Default: falls back to translation key `path.<ns>.<path>.description`
- A brief introduction to the category

### `icon` (optional)

- Type: `ResourceLocation`, pointing to a resource pack texture
- Currently not rendered in the UI (feature not yet complete); stored as data only

### `weight` (optional)

- Type: `int`
- Default: `100`
- Sort weight among paths (affects the left-to-right order of path groupings in the UI)
- Can be negative

## Usage

A Path itself is merely a categorization label. To use it:

1. **Define the Path** (this file)
2. **Reference it from an Epiphany** via the `path` field

```jsonc
// data/mymod/epiphany/path/war.json
{ "name": "Way of the Warrior", "weight": 100 }

// data/mymod/epiphany/epiphany/undying_rage.json
{
    "name": "Undying Rage",
    "path": "mymod:war",       // ← references the Path above
    "reward": { ... }
}
```

::: warning One-way reference
- Epiphanies **unidirectionally reference** Paths via the `path` field
- Paths do **not hold** a list of subordinate epiphanies (the epiphany set is reverse-built by the game at runtime)
- An epiphany can belong to at most one Path (cannot be in multiple groups simultaneously)
- Epiphanies without a `path` are assigned to the "default group"
- Referencing a non-existent Path ID will not crash — the epiphany simply falls into the default group
:::
