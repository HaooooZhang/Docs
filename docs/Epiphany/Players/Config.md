# Config

Epiphany's configuration is powered by NeoForge's config system. All settings are automatically generated in `config/epiphany-common.toml` and can also be modified in-game via Mod Menu / ConfigScreen.

::: tip
Clients with NeoForge ConfigScreen can graphically edit all settings on this page via `Mods → Epiphany → Configure` from the main menu. Config is hot-reloaded — no game restart needed.
:::

## File Location

```
<game root>/config/epiphany-common.toml
```

## All Config Options

### Numerical & System

#### `maxEpiphanySlots`

- Type: `int`
- Default: `8`
- Range: `1` ~ `32`
- Description: The **maximum number of epiphany slots** a player can have. Completing modules automatically grants +1 slot, but is capped by this value.

#### `moduleSelectCost`

- Type: `int`
- Default: `1`
- Range: `0` ~ `100`
- Description: The **uniform Insight Point cost** for selecting a module. All modules share this cost — it cannot be configured per individual module.

#### `maxSelectedModules`

- Type: `int`
- Default: `8`
- Range: `1` ~ `64`
- Description: The **maximum number of modules** a player can have selected simultaneously. Selection silently fails when this cap is reached.

### Aptitude System

#### `baseAptitudeCap`

- Type: `long`
- Default: `10`
- Range: `1` ~ `Long.MAX_VALUE`
- Description: The **base aptitude required for the first Insight Point**. A player starts at 0 aptitude and must accumulate up to this value to earn their first point.

#### `aptitudeCapGrowth`

- Type: `long`
- Default: `1`
- Range: `0` ~ `Long.MAX_VALUE`
- Description: The **incremental amount added to the required aptitude** for each additional Insight Point earned. Currently only a linear formula is supported.

Level-up formula:

$$
\text{Required} = \text{baseAptitudeCap} + (\text{totalSpent} + \text{insightPoints}) \times \text{aptitudeCapGrowth}
$$

With defaults, the 1st / 2nd / 5th / 10th Insight Point requires 10 / 11 / 15 / 20 aptitude respectively. See [Mechanics · Aptitude Level-Up Formula](Gameplay.md#12-level-up-formula).

#### `aptitudeGainMultiplier`

- Type: `double`
- Default: `1.0`
- Range: `0.0` ~ `100.0`
- Description: A **global multiplier** applied to all aptitude granted by datapack behaviors.

| Multiplier | Effect |
|:----------:|--------|
| `1.0` | Default — uses the raw values from JSON |
| `2.0` | Doubles all aptitude gains |
| `0.5` | Halves all aptitude gains |
| `0.0` | Effectively disables all datapack sources (players cannot earn aptitude through behaviors) |

See also [Aptitude & Insight Point](../Developers/Aptitude%20%26%20Insight%20Point.md#configuration).

### Notification Toggles

The following three settings control how Epiphany sends notifications to players in-game (temporary solution — currently **chat messages + sound effects**; planned to become Toast popups in the future).

#### `notifyInsightPoints`

- Type: `boolean`
- Default: `true`
- Description: Whether to notify when a player **gains Insight Points**. Triggered by:
  - Aptitude bar filling and auto-converting
  - Command grants (`setInsightPoints` / `insight points add`)
  - Datapack reward grants (`epiphany:insight_points` reward)

#### `notifyModuleUnlock`

- Type: `boolean`
- Default: `true`
- Description: Whether to notify when a player's module **auto-unlocks**.

::: warning Only notifies auto-unlocks
This toggle **only** controls notifications for modules with `initial_state = "locked"` that have a condition and auto-unlock when that condition is met.

- `initial_state = "selectable"` modules (visible from start) do not notify
- Manual unlocks via command / API also do not trigger this notification (auto-unlock only)
:::

#### `notifyEpiphanyUnlock`

- Type: `boolean`
- Default: `true`
- Description: Same as `notifyModuleUnlock`, but for **epiphany** auto-unlocks.
