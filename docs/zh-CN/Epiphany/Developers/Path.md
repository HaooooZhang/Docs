# 道路 Path

道路是顿悟的**分类标签**,仅用于 UI 分组展示,本身不影响任何游戏逻辑。

> 本页介绍 Path 数据包格式。其他数据包类型：[Module](Module.md) / [Insight](Insight.md) / [Epiphany](Epiphany.md)。

## 文件位置

```
data/<namespace>/epiphany/path/<path>.json
```

- **道路的注册 ID = `<namespace>:<path>`**
  - `data/mymod/epiphany/path/war.json` → `mymod:war`
  - `data/mymod/epiphany/path/element/fire.json` → `mymod:element/fire`

## 完整样例

```jsonc
{
    "name": "所谓英雄...",                                // 可选,缺省走 lang 翻译键
    "description": "自当如何？",          // 可选
    "icon": "minecraft:textures/item/iron_sword.png",  // 可选
    "weight": 100                                      // 可选,默认 100
}
```


## 字段说明

### `name`（可选）

- 类型：`Component`（字符串、样式对象或翻译键）
- 默认：缺省时回退翻译键 `path.<ns>.<path>.name`

::: info 文本组件与 i18n
所有 Component 字段支持字符串 / 样式对象 / 翻译键三种写法，缺省时自动回退到约定翻译键。详见 [Module · 文本组件与 i18n](Module.md#文本组件与-i18n)。
:::

### `description`（可选）

- 类型：`Component`
- 默认：缺省时回退翻译键 `path.<ns>.<path>.description`
- 该分类的简介

### `icon`（可选）

- 类型：`ResourceLocation`，指向资源包纹理
- 当前 UI 不渲染（功能尚未完成），仅作为数据存储

### `weight`（可选）

- 类型：int
- 默认：`100`
- Path 之间的排序权重（影响 path 分组在 UI 中的左右顺序）
- 可为负数

## 使用方式

Path 本身仅是分类标签，需要：

1. **定义 Path**（本文件）
2. **在 Epiphany 中通过 `path` 字段引用**

```jsonc
// data/mymod/epiphany/path/war.json
{ "name": "战士之道", "weight": 100 }

// data/mymod/epiphany/epiphany/undying_rage.json
{
    "name": "不灭怒火",
    "path": "mymod:war",       // ← 引用上面的 Path
    "reward": { ... }
}
```

::: warning 单向引用
- Epiphany 通过 `path` 字段**单向引用** Path
- Path 自身**不持有**下属顿悟列表(顿悟集合由游戏运行时反向构建)
- 一个顿悟最多属于一条 Path(无法同时归多个组)
- 未指定 `path` 的顿悟归入"默认组"
- 引用不存在的 Path ID 不会崩溃,顿悟会归入默认组
:::

