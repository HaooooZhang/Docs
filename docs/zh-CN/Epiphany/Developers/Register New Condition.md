# 注册新的 Condition

「顿悟」的条件类型是数据驱动 + Codec dispatch 模式，可由第三方模组通过 NeoForge `DeferredRegister` 标准机制扩展。本页演示如何注册一个全新的 Condition 类型供数据包使用。

::: tip 前置阅读
本页假设你已了解数据包 JSON 端的 condition 用法，见 [Condition](Condition.md)。另外需熟悉 NeoForge `DeferredRegister` 与 Codec dispatch。
:::

## 总览

注册新 Condition 类型分三步:

1. **实现 `Condition` 接口**
2. **提供该类的 `MapCodec<T>`**
3. **通过 `DeferredRegister` 把 codec 注册到 `EpiphanyRegistries.CONDITION_SERIALIZERS`**

## Condition 接口

`content/condition/Condition.java` 节选:

```java
public interface Condition {

    // Dispatch codec —— Epiphany 提供,无需自己实现
    Codec<Condition> CODEC = DefaultedCodec.registryDispatch(
        EpiphanyRegistries.CONDITION_SERIALIZERS,
        Condition::codec,
        Function.identity(),
        () -> AlwaysCondition.INSTANCE
    );

    // 你的类要返回这个,用于 dispatch
    MapCodec<? extends Condition> codec();

    // 核心评估方法 —— Epiphany 自动解锁轮询时调用
    boolean test(ServerPlayer player);

    // 可选:是否事件驱动(见下方"事件驱动")
    default boolean isEventDriven() {
        return false;
    }
}
```

## 第 1 步：实现接口

### 完整示例：游戏模式条件

下面实现一个 `game_mode` 类型，判断玩家当前的 GameType（生存 / 创造 / ...）：

```java
public record GameModeCondition(GameType gameMode) implements Condition {

    public static final MapCodec<GameModeCondition> CODEC =
            RecordCodecBuilder.mapCodec(instance -> instance.group(
                    GameType.CODEC.fieldOf("mode")
                            .forGetter(GameModeCondition::gameMode)
            ).apply(instance, GameModeCondition::new));

    @Override
    public MapCodec<? extends Condition> codec() {
        return CODEC;
    }

    @Override
    public boolean test(ServerPlayer player) {
        return player.server.getPlayerList().getPlayerGameType(player) == gameMode;
    }
}
```

## 第 2 步：注册到注册表

在你的 mod 主类或注册类中：

```java
@Mod("mymod")
public class MyMod {
    public static final DeferredRegister<MapCodec<? extends Condition>> CONDITIONS =
            DeferredRegister.create(EpiphanyRegistries.CONDITION_SERIALIZERS, "mymod");

    public static final DeferredHolder<MapCodec<? extends Condition>, MapCodec<GameModeCondition>>
            GAME_MODE = CONDITIONS.register("game_mode", () -> GameModeCondition.CODEC);

    public MyMod(IEventBus modBus) {
        CONDITIONS.register(modBus);
    }
}
```

## 第 3 步：在数据包中使用

```jsonc
{
    "name": "创造模式专属模块",
    "condition": {
        "type": "mymod:game_mode",
        "mode": "creative"
    },
    "initial_state": "locked"
}
```

## isEventDriven（可选覆写）

某些 condition **不应该被 10-tick 轮询评估**，因为评估本身的代价高（如遍历 FTBQ 注册表、远程查询等）。这类 condition 应该覆写 `isEventDriven()` 返回 `true`：

```java
@Override
public boolean isEventDriven() {
    return true;
}
```

::: warning 事件驱动条件的工作方式
- Epiphany 的 **`AutoUnlockListener` 周期性轮询**会跳过 `isEventDriven() == true` 的条件
- 这类条件只能在**特定事件触发**时被强制重评估 —— 比如内置的 FTBQ 条件是在 FTBQ 的 quest 完成事件中触发解锁检查

如果你注册了事件驱动 condition 但没注册对应的"触发器监听器"，该 condition 永远不会被评估，模块 / 顿悟永远卡在 locked。**务必配套提供触发逻辑**。
:::

## 同一类共享给 Module + Epiphany

与 Reward 不同（Reward 有 InsightReward / EpiphanyReward 两个平行接口），**Condition 接口是统一的**。同一个 Condition 类型可直接被 Module JSON 与 Epiphany JSON 同时引用，无需重复注册。

## 解析失败行为

Epiphany 的 `DefaultedCodec.registryDispatch(...)` 保证:

- 未注册的 `type` → 回退为 `AlwaysCondition.INSTANCE`（恒真）
- JSON 格式损坏 → 同上

**不会崩溃**,但 condition 会变成恒真 —— 这可能导致模块在你没预期时自动解锁。请测试 type 命名拼写。

## 重置 / reapply 行为

condition **只在评估时被调用**,不涉及持久化。Epiphany 不会在重置 / reapply 链中重新调用 condition。

不需要关心 `remove()` 之类的反向操作。
