# 快速开始

本页帮助整合包作者 / 模组开发者 5 分钟快速上手模组。文档包含三个板块：**引入依赖**、**最小可工作的数据包**、**通过 API 控制玩家数据**。

> 本页面向**有 NeoForge 开发经验**的读者。纯数据包作者可只看前两节（无需写 Java）。

## 环境要求

| 项 | 版本 |
|----|------|
| Minecraft | `1.21.1` |
| NeoForge | `21.1.234` 或更高 |
| Java | `21` |
| LDLib2 | `2.2.26`（必装前置，UI 框架） |

联动模组
- FTB Quests（`2101.1.0+`）—— 启用 `epiphany:ftbq_quest` / `epiphany:ftbq_chapter_completed` 等条件与阅历行为
- KubeJS（`2101.7.2+`）—— 启用 [KubeJS 兼容](KubeJS%20Compat.md) 与 `epiphany:kubejs_stage` 条件 / 奖励

## 第一个数据包：Module + Insight + Aptitude

只需 4 个 JSON 文件，你就能定义一个完整的技能树模块。把它们放到 datapack 目录（或在 mod 中 `src/main/resources/data/<你的 ns>/`）。

### 文件 1:定义一个心得

```jsonc
// data/myfirstpack/epiphany/insight/sturdy.json
{
    "name": "坚韧",
    "description": "最大生命 +4",
    "icon": "minecraft:textures/item/golden_apple.png",
    "cost": 1,
    "reward": {
        "type": "epiphany:attribute",
        "attribute": "minecraft:generic.max_health",
        "amount": 4.0,
        "operation": "add_value"
    },
    "reward_description": "+4 最大生命"
}
```

→ 注册 ID `myfirstpack:sturdy`

### 文件 2：定义模块,引用该心得

```jsonc
// data/myfirstpack/epiphany/module/survivor.json
{
    "name": "幸存者",
    "description": "在你的冒险中存活下来,强化体魄。",
    "icon": "minecraft:textures/item/golden_chestplate.png",
    "initial_state": "selectable",
    "insights": [
        { "id": "myfirstpack:sturdy", "depth": 0 }
    ]
}
```

→ 注册 ID `myfirstpack:survivor`，开局即可见可选。

### 文件 3:配置阅历来源

```jsonc
// data/myfirstpack/epiphany/aptitude/kill_entity.json
{
    "default": 3,
    "specials": [
        { "target": "minecraft:zombie", "reward": 5, "first_reward": 50 }
    ],
    "exclude": [
        "#epiphany:friendly",
        "minecraft:armor_stand"
    ]
}
```

### 文件 4:测试 / lang 文件(可选)

如果你想实现国际化，你可以不写 `name` 字段，直接在 `assets/myfirstpack/lang/zh_cn.json` 加:

```json
{
    "module.myfirstpack.survivor.name": "幸存者",
    "module.myfirstpack.survivor.description": "在冒险中存活,强化体魄"
}
```

详见 [i18n](i18n.md)。

## 用 Manager API 控制玩家

引入 Epiphany 作为 dependency 后（在 build.gradle `implementation` 加上 Epiphany 的 jar 或 maven 坐标），你可以在自己的 mod 中调用 Manager API：

```java

@EventBusSubscriber(modid = "mymod")
public class MyIntegration {

    @SubscribeEvent
    static void onLogin(PlayerEvent.PlayerLoggedInEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer sp)) return;

        // 查询玩家进度
        long apt = AptitudeManager.getAptitude(sp);
        int pts = AptitudeManager.getInsightPoints(sp);

        // 示例:首次登录送 50 阅历 + 解锁幸存者模块
        ResourceLocation survivor = ResourceLocation.fromNamespaceAndPath("myfirstpack", "survivor");
        if (!ModuleManager.isUnlocked(sp, survivor)) {
            ModuleManager.setUnlocked(sp, survivor, true);
            AptitudeManager.addAptitude(sp, 50);
        }
    }
}
```

完整 API 见 [Manager API](Manager%20API.md)。所有 mutation 方法触发 [Custom Event](Custom%20Event%20List.md)。

## 监听事件

通过 NeoForge 标准事件机制监听 15 个自定义事件:

```java

@EventBusSubscriber(modid = "mymod")
public class MyModuleRule {
    @SubscribeEvent
    static void onSelect(ModuleSelectEvent e) {
        // Pre 事件:取消模块选择
        if (/* 你的条件 */) {
            e.setCanceled(true);
            e.getPlayer().sendSystemMessage(
                Component.literal("此模块在剧情期间不可用。"));
        }
    }
}
```

## 注册新的扩展

| 想做的事 | 章节 |
|---------|------|
| 注册新的条件类型(Java → 数据包) | [注册新的 Condition](Register%20New%20Condition.md) |
| 注册新的奖励类型 | [注册新的 Reward](Register%20New%20Reward.md) |
| 注册新的阅历来源 | [注册新的 Aptitude Source](Register%20New%20Aptitude%20Source.md) |

## 调试建议

- **命令调试**：见 [Command 命令参考](../Players/Command.md)（管理员命令可强制查询 / 修改玩家状态）
- **解析失败降级**：Epiphany 用 `DefaultedCodec` 把错误的 `type` / JSON 格式**静默回退**到默认值（Always / NoOp），不会崩溃。如果你的配置不生效，检查 type 命名 / 字段拼写 / 命名空间是否匹配

## 推荐学习路径

1. 读 [机制详解](../Players/Gameplay.md) 了解玩家视角
2. 读 [Module](Module.md) / [Insight](Insight.md) / [Epiphany](Epiphany.md) / [Path](Path.md) 数据包字段
3. 读 [Manager API](Manager%20API.md) 与 [Custom Event List](Custom%20Event%20List.md)
4. 读 [Aptitude & Insight Point](Aptitude%20&%20Insight%20Point.md) 了解资源经济
5. 上手 [Condition](Condition.md) / [Reward](Reward.md) 各类型
6. 注册自己的扩展（Condition / Reward / Aptitude Source）
