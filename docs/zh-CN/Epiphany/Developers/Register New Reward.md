# 注册新的 Reward

「顿悟」的奖励系统是数据驱动 + Codec dispatch 模式，与其他模组通过 NeoForge `DeferredRegister` 标准机制扩展。本页演示如何注册一个全新的 Reward 类型供数据包使用。

::: tip 前置阅读
本页假设你已了解数据包 JSON 端的 reward 用法,见 [Reward](Reward.md)。另外需熟悉 NeoForge `DeferredRegister` 与 Codec dispatch。
:::

## 总览

注册一个新 Reward 类型分三步:

1. **实现 `InsightReward` 或 `EpiphanyReward` 接口**(或两者都实现以共享)
2. **提供该类的 `MapCodec<T>`**(序列化)
3. **通过 `DeferredRegister` 把 codec 注册到对应注册表**

注册表键有三个,位于 `EpiphanyRegistries`:

| 注册表键 | 用途 |
|---------|------|
| `INSIGHT_REWARD_SERIALIZERS` | 用于 Module.on_select / on_complete + Insight.reward |
| `EPIPHANY_REWARD_SERIALIZERS` | 用于 Epiphany.reward |
| (两者都注册) | 想让 reward 在 Module/Insight/Epiphany 三处通用 |

> 💡 「顿悟」内置的所有 reward 类都**同时实现两个接口**，并在两个注册表各注册一次，JSON 字段完全一致。这不完全是技术债，如果遇到了非常不适合某一用途的奖励，或许可以只 implement 一个接口

## 第 1 步：实现接口

接口定义（`content/reward/InsightReward.java`）：

```java
public interface InsightReward {

    // Dispatch codec —— 由 Epiphany 提供,无需自己实现
    Codec<InsightReward> CODEC = DefaultedCodec.registryDispatch(...);

    // 你的类要返回这个,用于 dispatch
    MapCodec<? extends InsightReward> codec();

    // 发放奖励 —— reward JSON 被触发时立即调用
    void apply(ServerPlayer player, ResourceLocation sourceId);

    // 移除奖励 —— 可选,默认空实现。重置时反向调用
    default void remove(ServerPlayer player, ResourceLocation sourceId) {}
}
```

`EpiphanyReward` 接口与它的签名**完全相同**(方法 / codec 类型不一致,接口本身平行)。

### 完整示例

下面注册一个 `my_multi_item` 类型,JSON 为 `{ "type": "mymod:my_multi_item", "items": [...] }`,发放多个不同物品。

```java
public record MyMultiItemReward(List<Holder<Item>> items) implements InsightReward, EpiphanyReward {

    public static final MapCodec<MyMultiItemReward> CODEC = RecordCodecBuilder.mapCodec(instance -> instance.group(
            BuiltInRegistries.ITEM.holderByNameCodec().listOf().fieldOf("items")
                    .forGetter(MyMultiItemReward::items)
    ).apply(instance, MyMultiItemReward::new));

    @Override
    public MapCodec<MyMultiItemReward> codec() { return CODEC; }

    @Override
    public void apply(ServerPlayer player, ResourceLocation sourceId) {
        for (var item : items) {
            player.getInventory().add(new ItemStack(item));
        }
    }

    // 不实现 remove —— 该奖励是一次性的
}
```

## 第 2 步：注册到注册表

在你的 mod 的初始化阶段（通常是 `@Mod` 主类或注册类）注册：

```java
@Mod("mymod")
public class MyMod {
    public static final DeferredRegister<MapCodec<? extends InsightReward>> INSIGHT_REWARDS =
            DeferredRegister.create(EpiphanyRegistries.INSIGHT_REWARD_SERIALIZERS, "mymod");

    public static final DeferredRegister<MapCodec<? extends EpiphanyReward>> EPIPHANY_REWARDS =
            DeferredRegister.create(EpiphanyRegistries.EPIPHANY_REWARD_SERIALIZERS, "mymod");

    // 注册 ID 是 JSON 中 type 字段的 path 部分 —— 完整 type 为 mymod:my_multi_item
    public static final DeferredHolder<MapCodec<? extends InsightReward>, MapCodec<MyMultiItemReward>>
            MY_MULTI_ITEM_INSIGHT = INSIGHT_REWARDS.register("my_multi_item", () -> MyMultiItemReward.CODEC);

    public static final DeferredHolder<MapCodec<? extends EpiphanyReward>, MapCodec<MyMultiItemReward>>
            MY_MULTI_ITEM_EPIPHANY = EPIPHANY_REWARDS.register("my_multi_item", () -> MyMultiItemReward.CODEC);

    public MyMod(IEventBus modBus) {
        INSIGHT_REWARDS.register(modBus);
        EPIPHANY_REWARDS.register(modBus);
    }
}
```

::: tip type 命名
注册的 ID（`"my_multi_item"`）决定 JSON 中的 `type` 字段。完整 type 形式为 `<你的modid>:<id>`（即 `mymod:my_multi_item`）。
:::

## 第 3 步：在数据包中使用

注册后，数据包 JSON 即可使用新 type：

```jsonc
// data/mymod/epiphany/insight/welcome_gift.json
{
    "name": "欢迎礼包",
    "reward": {
        "type": "mymod:my_multi_item",
        "items": [
            "minecraft:bread",
            "minecraft:iron_axe",
            "minecraft:torch"
        ]
    }
}
```

## PersistentReward（可选）

若你的 reward 想在玩家**死亡重生后自动重新应用**（典型：属性修饰、永久效果），额外实现 `PersistentReward` 标记接口：

```java
public record MyRegenReward(double amount) implements InsightReward, EpiphanyReward, PersistentReward {
    // ...

    @Override
    public void apply(ServerPlayer player, ResourceLocation sourceId) {
        // ⚠️ 必须幂等!重生时 reapply 链会再次调用 apply()
        // 检查是否已施加,只施加一次
        // 例如:用 sourceId 作为 key,检查是否已有该 modifier
    }
}
```

::: warning apply 必须幂等
`PersistentReward.reapplyAll` 在 `PlayerRespawnEvent` 触发时直接调用 `apply()`，**不检查是否已施加**。因此你的 `apply()` 必须自行保证幂等性 —— 否则会叠加效果（如多次 +2 生命 → 累计 +N）。

参考内置 `AttributeReward` 的实现，它通过检查 `attr.getModifier(modifierId)` 是否存在来跳过重复施加。
:::

## Codec 编写要点

| 需求 | 推荐 API |
|------|---------|
| 必填字段 | `XXX.fieldOf("name")` |
| 可选字段 + 默认值 | `XXX.optionalFieldOf("name", defaultValue)` |
| 直接通过 id 解析（实体 / 方块 / 物品等） | `BuiltInRegistries.ENTITY_TYPE.holderByNameCodec()` 或对应注册表 |
| Tag 支持（`"#tag"` / plain id） | 自己写 `Codec.STRING` 解析，或用内置的 `OrTagCodec`（若有） |
| 嵌套 Component / Reward / Condition | 使用各自的 `CODEC` 静态字段 |

`RecordCodecBuilder.mapCodec(...)` 是最常用的 record-friendly 模式 —— 字段顺序与 record 构造器参数一致。

## 仅注册到一个注册表

如果你的奖励明确只用于 Insight / 明确只用于 Epiphany，可以只注册一个注册表。但缺一个会导致该 reward 在另一种上下文中 JSON 解析失败（回退到 NoOp）。

## 解析失败行为

Epiphany 用 `DefaultedCodec.registryDispatch(...)` 包裹了 dispatch codec:

- 未注册的 `type` → 回退到 `NoOpInsightReward.INSTANCE` / `NoOpEpiphanyReward.INSTANCE`
- JSON 格式损坏 → 同上

**这意味着你的数据包不会因拼写错误而崩溃**,但奖励会静默失效。请仔细测试。

