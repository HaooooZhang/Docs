# 注册新的 Aptitude Source

模组内置 13 种阅历来源，但游戏内可能有无限多种值得奖励的行为。第三方模组可以通过注册自定义监听器 + 调用 `AptitudeSourceManager.grant(...)` 来扩展阅历来源。

::: tip 
本页假设你已了解阅历系统的数据包用法，见 [Aptitude & Insight Point](Aptitude%20&%20Insight%20Point.md)。另外请你熟悉 `AptitudeSourceManager` 与 `AptitudeSourceResolver` 的 API，见 [Manager API](Manager%20API.md#AptitudeSourceManager--AptitudeSourceResolver)。
:::

## 总览

首先必须要明确：

> **阅历行为本身没有"类型注册"机制**。你只需要在自己的 mod 里写监听器，然后在适当时机调 grant。

与 [Reward](Register%20New%20Reward.md) / [Condition](Register%20New%20Condition.md) 不同，阅历行为不是 Entity / Codec dispatch 系统 —— **`epiphany:aptitude` 注册表本身就是一个普通 datapack registry**，任何 namespace + 文件名都可以作为行为 id。

因此"注册新行为"实际上是 **3 步**：

1. **数据包**：定义该行为的 JSON（决定 default / specials / exclude）
2. **监听器**：注册一个 NeoForge 事件监听器（仅 Java，无需往 Epiphany 注册）
3. **API 调用**：在监听器中调 `AptitudeSourceManager.grant(sp, behaviorId, targetId, registry)`

## 第 1 步：定义数据包 JSON

在 `data/<你的modid>/epiphany/aptitude/<behavior>.json` 下创建配置文件。

例：为"玩家钓鱼"自定义行为：

```jsonc
// data/mymod/epiphany/aptitude/fishing.json
{
    "default": 2,
    "specials": [
        { "target": "minecraft:cod",          "reward": 5, "first_reward": 30 },
        { "target": "minecraft:tropical_fish", "reward": 8, "first_reward": 50 },
        { "target": "minecraft:pufferfish",   "reward": 6, "first_reward": 40 }
    ],
    "exclude": []
}
```

行为 id 即 `mymod:fishing`（namespace + 文件名）。

target 字段的具体含义由**你的 grant 调用**决定 —— JSON 中 `"target": "minecraft:cod"` 等匹配规则按 [Aptitude & Insight Point](Aptitude%20&%20Insight%20Point.md#字段说明) 描述的机制工作。

## 第 2 步：写监听器

在你的 mod 中，创建一个 NeoForge 事件监听器，监听你关心的游戏事件：

```java
@EventBusSubscriber(modid = "mymod")
public class FishingAptitudeListener {

    // 与 JSON 文件名对应:行为 id = mymod:fishing
    private static final ResourceLocation FISHING =
            ResourceLocation.fromNamespaceAndPath("mymod", "fishing");

    @SubscribeEvent
    static void onItemFished(ItemFishedEvent event) {
        foo();

        AptitudeSourceManager.grant(sp, FISHING, targetId, BuiltInRegistries.ITEM);
    }
}

// 这个事件并不存在，只是为了演示。请根据实际情况使用正确的事件类型。
```

行为 id `FISHING = mymod:fishing` 与数据包文件名对应。每次玩家钓鱼，event 主物品作为 target，grant 内部会按 JSON 的 `default / specials / exclude` 决定要不要发放、发放多少。

## grant API 参考

```java
public static boolean grant(
        ServerPlayer       sp,
        ResourceLocation   behaviorId,    // 行为 id(如 mymod:fishing)
        ResourceLocation   targetId,      // 触发对象的具体 id
        @Nullable Registry<?> registry    // 用于解析 #tag 引用,无 tag 时 null
);
```

参数说明:

| 参数 | 用途 |
|------|------|
| `sp` | 触发行为的玩家 |
| `behaviorId` | 数据包 JSON 的注册 id（`namespace:文件名`），与第 1 步的文件一致 |
| `targetId` | 该次事件的具体对象 id（钓到的物品 / 击杀的实体 / 进入的群系 等） |
| `registry` | 用于解析 `"#tag"` 引用的注册表。BuiltInRegistries 提供常见注册表（ITEM / BLOCK / ENTITY_TYPE / BIOME / STRUCTURE），无自然 target 时传 `null`，此时 `#tag` 不匹配 |

::: tip 选 registry 的指引
- 实体相关 → `BuiltInRegistries.ENTITY_TYPE`
- 方块相关 → `BuiltInRegistries.BLOCK`
- 物品相关 → `BuiltInRegistries.ITEM`
- 群系相关 → 从 `sp.level().registryAccess()` 取 BIOME registry（数据包加载的 tag）
- 结构相关 → 同上，取 STRUCTURE registry
- 无自然 target（如经验升级）→ `null`，`#tag` 不匹配，只走 `default`
:::

返回值 `true` / `false`：
- `true` = 已发放阅历（规则命中，值 > 0）
- `false` = 未发放（exclude 命中、reward 为 0、未配置 JSON 等）

## 内部流程

`grant(sp, behaviorId, targetId, registry)` 内部:

1. 调用 `AptitudeSourceResolver.resolve(...)` 查找 JSON 配置，得到 `Resolution { applies, reward, claimKey }`
2. 应用全局倍率：`scaled = reward × Config.aptitudeGainMultiplier`
3. 若 `scaled <= 0`，返回 false
4. 若 `claimKey != null`（首次奖励路径）→ 标记 `claimedFirsts` 在玩家数据中
5. 调用 `AptitudeManager.addAptitude(sp, scaled)` → 触发阅历事件链（AptitudeChanged / AptitudeLevelUp × N / InsightPointsChanged）

降级语义：
- malformed id、未知 tag、registry==null 用 `#tag` → 全部视为"该规则不命中"，**不抛异常**
- 未配置该 behaviorId 的 JSON → 整个 grant 返回 false（无效）
- exclude 命中 → 跳过 specials 与 default，返回 false

## 多事件源统一到同一 behaviorId

如果你想"钓鱼 + 杀稀有鱼 + 喂鱼"都奖励同一个 `mymod:fishing` JSON，只需在不同监听器里调同一个 `grant(sp, FISHING, ...)` 即可。每个事件自行选择 target，JSON 配置可以按多种 target 用 specials 配置不同奖励。