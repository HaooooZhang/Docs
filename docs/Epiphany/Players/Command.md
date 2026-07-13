# Command Reference

Epiphany provides a unified root command `/epiphany`, intended for **server administrators** (permission level 2). Use it to query, modify, and forcibly set all of a player's data within the Epiphany system.

## General Conventions

### The `-silent` Flag

All mutation subcommands that normally produce chat feedback (e.g., `aptitude add`, `module select`, etc.) support the `-silent` flag. **Insert it between `<player>` and the trailing parameters:**

```
/epiphany <group> <action> <player> [-silent] <other params>
```

With `-silent`, no chat message is sent on success or failure. Useful for:
- Datapack reward chains (avoid spam)
- Silent operations in custom triggers
- Batch operations

## Command Tree

```
/epiphany
├── aptitude  <add|set|query|fill>
├── insight   <select|try_select|reset|query|points>
├── module    <unlock|select|try_select|complete|reset|query>
├── epiphany  <unlock|select|try_select|reset|query>
├── path      <list>
├── reset     <all|select>
└── open
```

## `/epiphany aptitude` (Aptitude)

### `aptitude add`

```
/epiphany aptitude add <player> [-silent] <amount: long>
```

**Adds** aptitude to the player (triggers the aptitude level-up chain: if the bar fills, Insight Points are automatically converted).

### `aptitude set`

```
/epiphany aptitude set <player> [-silent] <value: long>
```

**Sets** the player's aptitude to an exact value. `value > current` — follows the add path (may trigger level-ups); `value < current` — clamps to `max(0, value)`.

### `aptitude query`

```
/epiphany aptitude query <player>
```

Queries the player's aptitude status. Output format: **aptitude value / available Insight Points / total Insight Points spent**.

### `aptitude fill`

```
/epiphany aptitude fill <player> [-silent]
```

**Fills** the player's current aptitude bar to the exact threshold needed for the next Insight Point (immediately grants 1 Insight Point). Useful for testing or quick rewards.

## `/epiphany insight` (Insights)

### `insight select`

```
/epiphany insight select <player> [-silent] <insight>
```

**Forcibly unlocks** the specified insight (ignores prerequisites and cost).

### `insight try_select`

```
/epiphany insight try_select <player> [-silent] <insight>
```

**Attempts to unlock** the specified insight. Checks prerequisites and Insight Point cost; returns a failure message on failure.

### `insight reset`

```
/epiphany insight reset <player> [-silent] <insight>
```

**Resets** a single insight: refunds Insight Points, removes rewards (calls reverse `remove`).

### `insight query`

```
/epiphany insight query <player> <insight>
```

Queries an insight's status. Output: **whether unlocked / whether the owning module is selected**.

### `insight points` (Insight Points)

```
/epiphany insight points add <player> [-silent] <amount: int>
/epiphany insight points set <player> [-silent] <amount: int>
```

**Adds / sets** available Insight Points. `set` directly overwrites available points (does not affect `totalInsightPointsSpent`).

## `/epiphany module` (Modules)

### `module unlock`

```
/epiphany module unlock <player> [-silent] <module>
```

**Unlocks** the module.

### `module select` (Forced)

```
/epiphany module select <player> [-silent] <module>
```

**Forcibly selects** the module (ignores unlock status, Insight Point cost, and module cap).

### `module try_select`

```
/epiphany module try_select <player> [-silent] <module>
```

**Attempts to select** the module. Checks unlock status / Insight Points / cap; returns failure on failure.

### `module complete` (Forced)

```
/epiphany module complete <player> [-silent] <module>
```

**Forcibly completes** the module (ignores whether all insights are unlocked).

### `module reset`

```
/epiphany module reset <player> [-silent] <module>
```

**Resets** the module: refunds all Insight Points (including insight costs + module select cost), removes all rewards (calling `remove` on each). Modules with `initial_state = "selectable"` retain `unlocked = true` after reset.

### `module query`

```
/epiphany module query <player> <module>
```

Queries module status. Output: **whether unlocked / whether selected / whether completed**.

## `/epiphany epiphany` (Epiphanies)

### `epiphany unlock`

```
/epiphany epiphany unlock <player> [-silent] <epiphany>
```

**Unlocks** the epiphany.

### `epiphany select` (Forced)

```
/epiphany epiphany select <player> [-silent] <epiphany>
```

**Forcibly activates** the epiphany (ignores slot and unlock restrictions).

### `epiphany try_select`

```
/epiphany epiphany try_select <player> [-silent] <epiphany>
```

**Attempts to activate** the epiphany. Checks unlock status and available slots; returns failure on failure.

### `epiphany reset`

```
/epiphany epiphany reset <player> [-silent] <epiphany>
```

**Resets** a single epiphany: deducts the epiphany slot (if active) + removes rewards.

## `/epiphany path`

### `path list`

```
/epiphany path list
```

Lists all registered Paths and the epiphanies belonging to each.

---

## `/epiphany reset`

### `reset all`

```
/epiphany reset all <player>
```

**Full reset**: clears all player data (aptitude, Insight Points, modules, insights, epiphanies, slots, claimed firsts).

### `reset select`

```
/epiphany reset select <player>
```

**Reset selections only**: keeps aptitude and Insight Points, but resets all module selections, insights, and epiphanies (refunds applicable points and slots).

## `/epiphany open`

```
/epiphany open <player>
```

Opens the Epiphany GUI for the specified player (useful for admins to view or demonstrate a player's build).
