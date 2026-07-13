# Condition Types

Conditions are Epiphany's condition types, used to determine under what player state a Module or Epiphany should auto-unlock.

::: info
This page is aimed at datapack authors, explaining the JSON fields of all built-in condition types. For registering new condition types, see [Registering a New Condition](Register%20New%20Condition.md).
:::

## Usage

Conditions are used in the `condition` field of Module / Epiphany JSON, selecting a specific type via dispatch codec:

```jsonc
"condition": {
    "type": "epiphany:advancement",     // ← type determines subsequent fields
    "advancement": "minecraft:story/mine_stone"
}
```

The `type` field corresponds to one of the 28 built-in types. `type` is the condition type's registry ID (`epiphany:<key>`); third-party mods can register new keys.

::: tip Graceful Degradation on Parse Failure
If `type` references an unregistered condition type, JSON parsing fails and the system automatically falls back to `epiphany:always` (always true). This means your datapack **won't crash due to a typo**, but the condition will silently become always-true. Please double-check your type names carefully.
:::

## Logical Operators

### `epiphany:always` (Always True)

Always true — has no JSON body fields. **This is the default fallback when dispatch parsing fails.**

```jsonc
{ "type": "epiphany:always" }
```

### `epiphany:never` (Always False)

Always false. Useful for "this should never auto-unlock; only commands/API can unlock it."

```jsonc
{ "type": "epiphany:never" }
```

### `epiphany:and` (All Must Be True)

True when all child conditions are true.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `conditions` | list of Condition | ✅ | List of child conditions |

```jsonc
{
    "type": "epiphany:and",
    "conditions": [
        { "type": "epiphany:experience_level", "value": 30 },
        { "type": "epiphany:advancement", "advancement": "minecraft:story/mine_diamond" }
    ]
}
```

### `epiphany:or` (Any Must Be True)

True when any child condition is true.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `conditions` | list of Condition | ✅ | List of child conditions |

### `epiphany:not` (Negation)

Negates a child condition.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `condition` | Condition | ✅ | The child condition to negate |

```jsonc
{
    "type": "epiphany:not",
    "condition": {
        "type": "epiphany:dimension",
        "dimension": "minecraft:the_nether"
    }
}
```

## Conditions

### `epiphany:attribute` (Attribute Comparison)

Evaluates the relationship between a player's current attribute value (base + all modifiers) and a given value.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `attribute` | ResourceLocation | ✅ | — | Attribute id, e.g., `minecraft:generic.max_health` |
| `value` | double | ✅ | — | Right-hand comparison value |
| `comparison` | Comparison | | `>=` | Comparison operator |

```jsonc
{
    "type": "epiphany:attribute",
    "attribute": "minecraft:generic.max_health",
    "value": 30.0,
    "comparison": ">="
}
```

### `epiphany:effect` (Has Status Effect)

Evaluates whether the player has a specified effect with an amplifier no less than the given minimum.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `effect` | ResourceLocation | ✅ | — | Effect id, e.g., `minecraft:regeneration` |
| `min_amplifier` | int | | `0` | Minimum amplifier (level − 1) |

```jsonc
{ "type": "epiphany:effect", "effect": "minecraft:strength", "min_amplifier": 0 }
```

### `epiphany:experience_level` (Experience Level)

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `value` | int | ✅ | — | Right-hand comparison value (player's experience level) |
| `comparison` | Comparison | | `>=` | Comparison operator |

### `epiphany:statistic` (Statistic Value)

The player's cumulative value in a vanilla Statistic.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `stat` | ResourceLocation | ✅ | — | Statistic id, e.g., `minecraft:mined:minecraft:diamond_ore` |
| `value` | int | ✅ | — | Right-hand comparison value |
| `comparison` | Comparison | | `>=` | Comparison operator |

### `epiphany:dimension` (Current Dimension)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `dimension` | ResourceLocation | ✅ | Dimension id |

```jsonc
{ "type": "epiphany:dimension", "dimension": "minecraft:the_nether" }
```

### `epiphany:biome` (Current Biome)

Evaluates the player's **current biome**.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `biome` | String | ✅ | Biome id or `"#tag"` reference (e.g., `minecraft:cherry_grove` / `"#minecraft:is_ocean"`) |

::: tip Auto-Unlock & Polling
This condition is evaluated by the 10-tick polling system and is immediately satisfied when the player enters the target biome.
:::

### `epiphany:structure` (Inside Structure)

Evaluates whether the player is **inside a specified structure** (requires the chunk to have generated the structure start).

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `structure` | String | ✅ | Structure id or `"#tag"`, e.g., `minecraft:stronghold` / `"#minecraft:villages"` |

### `epiphany:advancement` (Advancement Earned)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `advancement` | ResourceLocation | ✅ | Advancement id, e.g., `minecraft:story/mine_stone` |

### `epiphany:item` (Holds a Certain Item)

Evaluates whether the player has at least `count` of a specified item across their **inventory + equipment + hotbar**.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `item` | String | ✅ | — | Item id or `"#tag"` |
| `count` | int | | `1` | Quantity |

### `epiphany:item_used` (Has Used an Item)

Cumulative number of times the player has used this item.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `item` | String | ✅ | — | Item id (note: only plain id; **tags are not supported**) |
| `count` | int | | `1` | Cumulative count |

### `epiphany:block_broken` (Blocks Mined)

Cumulative number of times the player has mined this block.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `block` | String | ✅ | — | Block id or `"#tag"` |
| `count` | int | | `1` | Cumulative count |

### `epiphany:kill_entity` (Entities Killed)

Cumulative number of times the player has killed this entity type.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `entity` | String | ✅ | — | Entity id or `"#tag"` |
| `count` | int | | `1` | Cumulative count |

::: warning FakePlayer Exclusion
Both `kill_entity` and `block_broken` exclude FakePlayers, so kills/mining contributed by automation mods (e.g., Create) are **not counted** in the statistics.
:::

### `epiphany:aptitude` (Aptitude Value)

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `value` | long | ✅ | — | Right-hand comparison value |
| `comparison` | Comparison | | `>=` | Comparison operator |

### `epiphany:insight_points` (Insight Points)

The player's current **available** Insight Points (not counting spent ones). Note: this is the *current balance*, not the cumulative total.

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `value` | int | ✅ | — | Right-hand comparison value |
| `comparison` | Comparison | | `>=` | Comparison operator |

### `epiphany:module_selected` (Module Selected)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `module` | ResourceLocation | ✅ | Module id |

### `epiphany:module_completed` (Module Completed)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `module` | ResourceLocation | ✅ | Module id |

### `epiphany:insight_selected` (Insight Unlocked)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `insight` | ResourceLocation | ✅ | Insight id |

### `epiphany:epiphany_selected` (Epiphany Activated)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `epiphany` | ResourceLocation | ✅ | Epiphany id |

## FTB Quests Integration (Soft Dependency)

::: warning Soft Dependency
The following 4 types require FTB Quests to be installed to actually function. When absent, they always return `false`, but the datapack will still load.
:::

Since FTBQ conditions are event-driven (`isEventDriven() == true`), auto-unlock **skips polling evaluation** for these types and only checks them when the corresponding FTBQ event fires.

### `epiphany:ftbq_quest` (Quest Completed)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `quest` | String | ✅ | FTBQ quest hex string id |

### `epiphany:ftbq_chapter_started` (Chapter Started)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `chapter` | String | ✅ | FTBQ chapter hex string id |

### `epiphany:ftbq_chapter_completed` (Chapter Completed)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `chapter` | String | ✅ | FTBQ chapter hex string id |

### `epiphany:ftbq_tag` (Has Tag Mark)

| Field | Type | Required | Default | Description |
|-------|------|:--------:|:-------:|-------------|
| `tag` | String | ✅ | — | FTBQ tag string |
| `count` | int | | `1` | Minimum tag count required |

## KubeJS Integration (Soft Dependency)

### `epiphany:kubejs_stage` (Has Stage)

Evaluates whether the player has the specified KubeJS stage.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `stage` | String | ✅ | KubeJS stage name |
