# 命令 Command

「顿悟」提供一个统一的根命令 `/epiphany`，面向**服务器管理员**（权限等级 2）。可用它查询、修改、强制设置玩家在 Epiphany 系统中的全部数据。

## 通用约定

### `-silent` 标志

所有会触发聊天反馈的 mutation 子命令（如 `aptitude add`、`module select` 等）都支持 `-silent` 标志。**插入位置：`<player>` 与尾部参数之间**。

```
/epiphany <组> <动作> <player> [-silent] <其他参数>
```

写入 `-silent` 后执行成功 / 失败**不发送**任何聊天消息。适合：
- 数据包奖励链调用（避免刷屏）
- 自定义触发器中静默操作
- 批量操作

## 命令总览

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

## `/epiphany aptitude` (阅历)

### `aptitude add`

```
/epiphany aptitude add <player> [-silent] <amount: long>
```

为玩家**增加**阅历（触发阅历升级链：若填满阅历条，自动转化心得点）。

### `aptitude set`

```
/epiphany aptitude set <player> [-silent] <value: long>
```

将玩家阅历**设置**到精确值。`value > 当前值` → 走 add 路径（可能触发升级）；`value < 当前值` → 直接 clamp 到 `max(0, value)`。

### `aptitude query`

```
/epiphany aptitude query <player>
```

查询玩家的阅历状态。输出格式：**阅历值 / 可用心得点 / 累计已花费心得点**。

### `aptitude fill`

```
/epiphany aptitude fill <player> [-silent]
```

**补满**玩家当前阅历（直接填满到下一档所需阅历，立即获得 1 心得点）。常用于测试 / 快速发放。

## `/epiphany insight` (心得)

### `insight select`

```
/epiphany insight select <player> [-silent] <insight>
```

**强制点亮**指定心得(忽略前置条件、忽略消耗)。

### `insight try_select`

```
/epiphany insight try_select <player> [-silent] <insight>
```

**尝试点亮**指定心得。检查前置条件与心得点消耗，失败则返回 failure 消息。

### `insight reset`

```
/epiphany insight reset <player> [-silent] <insight>
```

**重置**单个心得，退还心得点，移除奖励（调反向 remove）。

### `insight query`

```
/epiphany insight query <player> <insight>
```

查询心得状态。输出：**是否已点亮 / 所属模块是否已选**。

### `insight points`(心得点)

```
/epiphany insight points add <player> [-silent] <amount: int>
/epiphany insight points set <player> [-silent] <amount: int>
```

**增加 / 设置**可用心得点。`set` 直接覆盖可用心得点（不影响 `totalInsightPointsSpent`）。

## `/epiphany module`(模块)

### `module unlock`

```
/epiphany module unlock <player> [-silent] <module>
```

**解锁**模块

### `module select`(强制)

```
/epiphany module select <player> [-silent] <module>
```

**强制选择**模块（忽略解锁状态、心得点、上限）。

### `module try_select`

```
/epiphany module try_select <player> [-silent] <module>
```

**尝试选择**模块。检查解锁 / 心得点 / 上限，失败返回 failure。

### `module complete`(强制)

```
/epiphany module complete <player> [-silent] <module>
```

**强制完成**模块（忽略"所有心得是否已点亮"）。
### `module reset`

```
/epiphany module reset <player> [-silent] <module>
```

**重置**模块：退还所有心得点（含已点亮心得的 cost + 模块选择 cost），移除所有奖励（逐个 `remove`）。`initial_state = "selectable"` 的模块重置后保持 `unlocked = true`。

### `module query`

```
/epiphany module query <player> <module>
```

查询模块状态。输出：**是否已解锁 / 是否已选 / 是否已完成**。

## `/epiphany epiphany`（顿悟）

### `epiphany unlock`

```
/epiphany epiphany unlock <player> [-silent] <epiphany>
```

**解锁**顿悟。

### `epiphany select`(强制)

```
/epiphany epiphany select <player> [-silent] <epiphany>
```

**强制激活**顿悟（忽略槽位与解锁限制）。

### `epiphany try_select`

```
/epiphany epiphany try_select <player> [-silent] <epiphany>
```

**尝试激活**顿悟。检查解锁状态与可用槽位，失败返回 failure。

### `epiphany reset`

```
/epiphany epiphany reset <player> [-silent] <epiphany>
```

**重置**单个顿悟：扣除顿悟槽（若曾激活）+ 移除奖励。

### `epiphany query`

```
/epiphany epiphany query <player> <epiphany>
```

查询顿悟状态。输出：**是否已解锁 / 是否已激活**。

## `/epiphany path`（道路）

### `path list`

```
/epiphany path list
```

列出当前注册的全部道路（Path）ID。纯查询，不针对具体玩家。

## `/epiphany reset`（全局重置）

危险操作，慎用。

### `reset all`

```
/epiphany reset all <player> [-silent]
```

**完全清空**玩家在 Epiphany 系统中的所有数据（阅历、心得点、模块状态、心得状态、顿悟状态、槽位）。

- 调用所有可能 reward 的 `remove()` 反向操作（尽量撤销）
- 用 `PlayerEpiphanyData.createDefault()` 覆盖玩家数据
- 重新触发 `ModuleManager.checkAutoUnlock` + `EpiphanyManager.checkAutoUnlock`（满足条件的 locked 模块 / 顿悟会立即自动解锁）

### `reset select`

```
/epiphany reset select <player> [-silent]
```

**仅清除选择**（modules / insights / epiphanies 的 selected 状态），但**保留**阅历值与心得点。

- 调用所有可能 reward 的 `remove()`
- 退还所有已花费心得点（心得 cost + 模块选择 cost）回到可用余额
- 再次触发自动解锁检查

适合"让玩家重选而不重置进度"的场景。

## `/epiphany open`

### `open`

```
/epiphany open <player>
```

**强制打开**指定玩家的 Epiphany UI（等同于该玩家按 K 键）。常用于：
- 数据包 / 命令链中给玩家任务"打开 UI 查看本阶段进度"
- 教程引导（玩家可能与 UI 不熟悉）

## 常用配方

### 给测试玩家发完整资源

```
# 给 Steve 100 阅历 + 10 心得点 + 打开 UI
/epiphany aptitude add Steve 100
/epiphany insight points add Steve 10
/epiphany open Steve
```

### 让玩家重玩(保留阅历)

```
# 玩家想撤销所有选择的决定
/epiphany reset select @s
```

### 强制为玩家完成某模块

```
# 直接 complete(本身就是强制语义,跳过"所有心得已点亮"检查)
/epiphany module complete @s mymod:warrior
```

### 批量查询场景

```
# 在命令方块或 KubeJS 脚本中查询全部玩家,避免刷屏
/epiphany aptitude query @a
```

::: tip `-silent` 仅对 mutation 命令有效
`query` / `path list` **本身就不会广播**，无需 `-silent` 标志。`-silent` 只对修改类命令（`add` / `set` / `unlock` / `select` / `reset` 等）有效。
:::
