# KubeJS 兼容

「顿悟 Epiphany」提供了完整的 KubeJS 兼容，允许整合包作者通过 JS 脚本监听事件、调用 API 和查询数据。所有功能通过标准 KubeJS 插件机制注册。

::: tip
所有脚本均位于 `server_scripts/` 目录,仅在服务端运行。
:::

::: info
本章节介绍的所有概念与 [自定义事件](Custom%20Event%20List.md) 和 [Manager API](Manager%20API.md) 一一对应。如未特别说明,行为与 Java 端完全一致。
:::

## 总览

Epiphany 通过 KubeJS 插件提供两种入口：

| 命名空间 | 用途 | 来源 |
|---------|------|------|
| `EpiphanyEvents.*` | **监听事件**(Module/Insight/Epiphany/Aptitude 相关的 15 个事件) | KubeJS EventGroup |
| `Epiphany.*` | **调用 API**(Manager 方法 + 数据查询) | KubeJS Binding |

::: warning 命名分离
事件监听用 `EpiphanyEvents.*`，API 调用用 `Epiphany.*`。两者刻意分到不同命名空间，避免重名冲突。
:::

插件入口:`ink.myumoon.epiphany.event.kubejs.EpiphanyKubeJSPlugin`,在 `kubejs.plugins.txt` 中被发现。

## 事件(EpiphanyEvents.*)

所有事件均携带 `player` 字段（`ServerPlayer`）。每个事件在发生时携带相关的 id 字段（如 `moduleId` / `insightId` / `epiphanyId`），供脚本读取。

### 命名约定

| 后缀 | 含义 | 可取消 |
|------|------|:------:|
| **现在时**(如 `moduleUnlock` / `moduleSelect` / `moduleComplete`) | Pre 事件,**通过 `event.cancel()` 取消** | ✅ |
| **过去时**(如 `moduleUnlocked` / `moduleSelected` / `moduleCompleted`) | Post 事件,仅通知 | ❌ |

::: tip 取消机制
Pre 事件取消使用 KubeJS 标准的 `event.cancel()`,**不是** Java 端的 `setCanceled(true)`。插件内部会自动桥接到原生 NeoForge 事件。
:::

### Module 事件


| 事件名 | 类型 | 触发时机 |
|--------|:----:|--------|
| `moduleUnlock` | Pre(可取消) | 模块即将解锁时 |
| `moduleUnlocked` | Post | 模块已解锁时 |
| `moduleSelect` | Pre(可取消) | 模块即将被选择时 |
| `moduleSelected` | Post | 模块已被选择时 |
| `moduleComplete` | Pre(可取消) | 模块即将完成时 |
| `moduleCompleted` | Post | 模块已完成时 |

### Insight 事件

::: tip 级联
`insightSelected` 触发后，若所属模块的所有心得因此全部点亮，会**自动连锁**触发 Module 的 `moduleComplete` / `moduleCompleted`。一次 `insightSelect` 调用可能引发完整的 4 事件链。
:::

| 事件名 | 类型 | 描述 |
|--------|:----:|--------|
| `insightSelect` | Pre(可取消) | 心得即将被点亮时 |
| `insightSelected` | Post | 心得已被点亮时 |

### Epiphany 事件


| 事件名 | 类型 | 描述 |
|--------|:----:|--------|
| `epiphanyUnlock` | Pre(可取消) | 顿悟即将解锁时 |
| `epiphanyUnlocked` | Post | 顿悟已解锁时 |
| `epiphanySelect` | Pre(可取消) | 顿悟即将被激活时 |
| `epiphanySelected` | Post | 顿悟已被激活时 |

### Aptitude 事件(全部 Post)

::: warning 触发频率差异
`aptitudeLevelUp` **每次 +1 都会单独触发**(一次 `addAptitude` 可能触发**多次**)。而 `insightPointsChanged` 是**结算级事件**,无论一次调用内部升级多少次,只触发一次。通知类用后者,逐次记录用前者。
:::

| 事件名 | 描述 |
|--------|--------|
| `aptitudeChanged` | 阅历值变动时 |
| `aptitudeLevelUp` | 阅历条充满、获得心得点时(每 +1 一次) |
| `insightPointsChanged` | 心得点余额变动时(结算级一次) |

## 绑定(Epiphany.*)

所有方法均在服务端同步执行。`player` 参数必须是 `ServerPlayer` 类型。

### 工具

```js
Epiphany.id(namespace, path)   // 构造 ResourceLocation
Epiphany.id('mymod', 'foo')    // → 'mymod:foo'
```

也可以直接用 KubeJS 字面量字符串 `'mymod:foo'`,两者等价。

### Module

| 方法 | 描述 |
|------|------|
| `isModuleUnlocked(player, id)` | 查询:模块是否已解锁 |
| `isModuleSelected(player, id)` | 查询:模块是否已选择 |
| `isModuleCompleted(player, id)` | 查询:模块是否已完成 |
| `moduleUnlock(player, id)` | 解锁模块 |
| `moduleLock(player, id)` | 锁定模块 |
| `moduleSelect(player, id)` | 选择模块(消耗 心得点 ) |
| `moduleForceSelect(player, id)` | 强制选择(忽略消耗/条件/上限) |
| `moduleComplete(player, id)` | 完成模块(需所有心得已点亮) |
| `moduleForceComplete(player, id)` | 强制完成 |
| `moduleReset(player, id)` | 重置模块(退还 心得点 ,移除奖励) |

### Insight

| 方法 | 描述 |
|------|------|
| `isInsightSelected(player, id)` | 查询:心得是否已点亮 |
| `isInsightModuleSelected(player, id)` | 查询:心得所属模块是否已选 |
| `insightSelect(player, insightId, moduleId)` | 点亮心得(消耗心得点) |
| `insightForceSelect(player, insightId, moduleId)` | 强制点亮心得(忽略消耗/前置) |
| `insightReset(player, id)` | 重置心得 |

### Epiphany

| 方法 | 描述 |
|------|------|
| `isEpiphanyUnlocked(player, id)` | 查询:顿悟是否已解锁 |
| `isEpiphanySelected(player, id)` | 查询:顿悟是否已激活 |
| `epiphanyUnlock(player, id)` | 解锁顿悟 |
| `epiphanyLock(player, id)` | 锁定顿悟 |
| `epiphanySelect(player, id)` | 激活顿悟(消耗 1 槽位) |
| `epiphanyForceSelect(player, id)` | 强制激活(忽略槽位限制) |
| `epiphanyReset(player, id)` | 重置顿悟 |

### Aptitude / Points

| 方法 | 返回 | 描述 |
|------|:----:|------|
| `getAptitude(player)` | `long` | 当前阅历 |
| `getInsightPoints(player)` | `int` | 可用心得点 |
| `getTotalInsightPointsSpent(player)` | `int` | 累计已花费心得点 |
| `setAptitude(player, value)` | — | 设置阅历 |
| `addAptitude(player, amount)` | — | 增加阅历(可能触发升级) |
| `setInsightPoints(player, value)` | — | 设置心得点 |
| `calcRequiredAptitude(totalSpent, points)` | `long` | 计算下一心得点所需阅历 |

### Aptitude Source(自定义阅历来源)

| 方法 | 返回 | 描述 |
|------|:----:|------|
| `grantAptitude(player, behaviorId, targetId, registry)` | `boolean` | 按数据包规则发放阅历 |
| `resolveAptitudeSource(player, behaviorId, targetId, registry)` | `Resolution` | 纯查询 |

`registry` 参数传 `null` 即可（用于解析 tag 引用）。

### 数据查询(Datapack Registry)

四个方法用于查询数据包中定义的内容,查不到时返回 `null`:

| 方法 | 返回类型 |
|------|---------|
| `getModule(id)` | `ModuleData` |
| `getInsight(id)` | `InsightData` |
| `getEpiphany(id)` | `EpiphanyData` |
| `getPath(id)` | `PathData` |

返回的 record 可以直接访问字段,例如:

```js
let module = Epiphany.getModule('mymod:combat');
if (module) {
    console.info(module.name);          // Optional<Component>
    console.info(module.description);   // Optional<Component>
    console.info(module.initialState);  // 'locked' 或 'selectable'
    console.info(module.weight);        // number
    module.insights.forEach(entry => {
        console.info(entry.id, entry.depth);  // 心得 ID + 层级
    });
}
```

::: warning 注意 Optional 与 lang 回退
record 暴露的 `name` / `description` / `*_description` 字段都是**原始 Optional**,即数据包 JSON 里填了什么就是什么,没有应用缺省 lang 回退逻辑。例:

- `module.name` → `Optional<Component>`,可能为空(若 JSON 未写 name)
- `module.name.get().getString()` → 取出 JSON 字面值(或翻译键字符串)，**不会**走 lang 翻译回退

如果你通过资源包提供多语言支持，请用各数据类型提供的 `effectiveXxx(id)` 方法:

```js
let id = 'mymod:combat';
let module = Epiphany.getModule(id);
if (module) {
    // 为空
    let rawName = module.name;  // Optional<Component>

    // 返回 lang
    let displayName = module.effectiveName(id).getString();
    let displayDesc = module.effectiveDescription(id).getString();
}
```

每个类型提供的 `effectiveXxx` 方法对应数据包的 Component 字段(name / description / condition_description / reward_description 等),缺省时按约定翻译键查询 `assets/<ns>/lang/*.json`。命名规则见 [Module · 文本组件与 i18n](Module.md#文本组件与-i18n)。
:::

## KubeJS Stage 条件

Epiphany 提供了基于 KubeJS Stage 的 condition 和 Reward 类型,可在数据包 JSON 中使用:

```json
{ "type": "epiphany:kubejs_stage", "stage": "nether_access" }
```

当玩家拥有指定的 KubeJS Stage 时,该条件成立。未安装 KubeJS 时,此条件永远返回 `false`,不会崩溃。

## 示例脚本

### 监听模块选择并发放欢迎奖励

```js
// server_scripts/welcome.js

EpiphanyEvents.moduleSelected(event => {
    let player = event.player;
    let moduleId = event.moduleId;

    // 给玩家发送提示
    player.tell('你已选择模块: ' + moduleId);

    // 示例:首次选择战斗模块时给一把铁剑
    if (moduleId === 'mymod:combat') {
        let hasClaimed = player.stages.has('combat_welcome');
        if (!hasClaimed) {
            player.give('minecraft:iron_sword');
            player.stages.add('combat_welcome');
            player.tell('欢迎加入战士之路!获得:铁剑 x1');
        }
    }
});
```

### Pre 事件:阻止某些模块被选

```js
// server_scripts/restrict.js

EpiphanyEvents.moduleSelect(event => {
    let player = event.player;

    // 示例:在 Boss 战期间禁止选择任何模块
    if (player.stages.has('boss_fight_active')) {
        event.cancel();
        player.tell('Boss 战进行中,无法选择新模块。');
    }
});

// 顿悟同样规则
EpiphanyEvents.epiphanySelect(event => {
    if (event.player.stages.has('boss_fight_active')) {
        event.cancel();
    }
});
```

### 阅历监听 + 通知

```js
// server_scripts/aptitude_notify.js

// 玩家获得心得点时提示
EpiphanyEvents.insightPointsChanged(event => {
    if (event.isGain) {
        event.player.tell(
            `获得心得点!当前: ${event.newValue} (+'${event.delta})`
        );
    }
});

// 每次阅历升级单独记录
let levelUpCounter = {};
EpiphanyEvents.aptitudeLevelUp(event => {
    let uuid = event.player.uuid;
    levelUpCounter[uuid] = (levelUpCounter[uuid] || 0) + 1;
    // 每 10 次升级给奖励
    if (levelUpCounter[uuid] % 10 === 0) {
        event.player.give('minecraft:diamond');
    }
});
```

### 通过 API 操作玩家数据

```js
// server_scripts/admin_helper.js

PlayerEvents.loggedIn(event => {
    let player = event.player;

    // 查询玩家进度
    let pts = Epiphany.getInsightPoints(player);
    let apt = Epiphany.getAptitude(player);
    console.info(`[Epiphany] ${player.name} 心得点=${pts}, 阅历=${apt}`);

    // 首次登录赠送 100 阅历
    if (!player.stages.has('epiphany_gift')) {
        Epiphany.addAptitude(player, 100);
        player.stages.add('epiphany_gift');
        player.tell('欢迎礼物:阅历 +100');
    }
});
```

### 查询数据包定义

```js
// server_scripts/inspect.js

// 列出某模块的所有心得及其层级
let moduleId = 'mymod:combat';
let module = Epiphany.getModule(moduleId);
if (!module) {
    console.warn('Module not found: ' + moduleId);
} else {
    console.info(`Module: ${moduleId}, weight=${module.weight}`);
    module.insights.forEach(entry => {
        let insight = Epiphany.getInsight(entry.id);
        if (!insight) {
            console.info(`  - depth=${entry.depth}: ${entry.id} → (缺失)`);
        } else {
            let desc = insight.effectiveDescription(entry.id.toString()).getString();
            console.info(`  - depth=${entry.depth}: ${entry.id} → ${desc}`);
        }
    });
}
```

### 自定义阅历来源

```js
// server_scripts/custom_aptitude.js

// 假设你的数据包中定义了:
// data/mymod/epiphany/aptitude/fishing.json
// { "default": 2, "specials": [{ "target": "minecraft:cod", "reward": 5 }] }

// 监听原版钓鱼事件,发放 Epiphany 阅历
FishingHookEvent(event => {
    let player = event.player;
    let caught = event.stack;  // 钓到的物品
    let targetId = caught.getItem().getRegistryName(); // ResourceLocation
    Epiphany.grantAptitude(
        player,
        Epiphany.id('mymod', 'fishing'),
        targetId,
        BuiltInRegistries.ITEM
    );
});
```

::: warning
这是一个假想事件，实际 KubeJS 中没有 `FishingHookEvent`，也未经过实际测试。请根据实际情况使用正确的事件类型。
:::
