# Epiphany - Modular Skill Tree

![banner](/public/banner.png)

> 夫尽小者大，积微者著。  
> Greatness is built from the smallest deeds; distinction from the smallest gains.  
> *<p align="right">Xunzi · General Principles</p>*

**Epiphany** is a **data-driven**, modular skill tree mod for Minecraft, inspired by the Tradition mechanics of the classic sci-fi strategy game *Stellaris*. As an API mod designed for developers, it does not include any built-in skill tree content or attribute modifications. Instead, it provides a highly flexible character building framework for modpack and mod authors.

> **Requires [LDLib](https://github.com/LDLib-MC/LDLib-Mod) as a dependency.**

## Quick Start

- Press the **K** key to open the Build System GUI.
- Check out the example datapack and the Wiki to dive deeper into Epiphany and quickly create your own skill trees.

## Features

- **Modular Building**: Say goodbye to massive, monolithic skill trees. Players freely mix and match modules to craft their own unique progression path.
- **Fully Data-Driven**: All modules, insights, epiphanies, and paths are defined through datapacks. Create a vast RPG skill system without writing a single line of Java.
- **Rich Built-in Presets**: The mod ships with an extensive set of conditions and rewards ready to use out of the box:
  1. **30+ Condition Types**: Dynamically evaluate player attributes, current structure, statistics, and more to auto-unlock modules and epiphanies. Includes logical and relational operators for complex expressions.
  2. **14+ Reward Types**: Vanilla attribute modifiers, command execution, item granting, status effects, and much more.
  3. **13 Aptitude Sources**: Mining blocks, exploring biomes, slaying mobs... and what's more — aptitude gain is fully customizable!
- **Highly Configurable**: Through the config file, authors can easily adjust the aptitude level-up formula, player slot limits, experience gain multipliers, and notification toggles, blending seamlessly into any modpack's progression balance.
- **Strong Compatibility & Mod Support**: Integrates with FTB Quests, KubeJS, and other mainstream modpack development tools. Provides an open API, custom events, and supports KubeJS scripting for both event listening and API calls.
- **Polished GUI**: Built on LDLib, Epiphany features a carefully crafted UI with smooth node connections, draggable insight trees, and dynamic layout adjustments for a refined player experience.

- [Github](https://github.com/HaooooZhang/Epiphany)
- [Discord](https://discord.gg/xSEWpdae9C)

## Mod Architecture

- **Module**: An independent, self-contained skill tree unit. Developers can configure selection costs, module caps, and more.
- **Insight**: The smallest unit within a module — incremental upgrade nodes. Their effects tend toward quantitative changes (minor stat adjustments, etc.). Insights within a module automatically form a tree structure based on depth; an insight can only be unlocked once all of its parent nodes are lit.
- **Epiphany**: When a player fully unlocks every insight within a module, the module is completed and grants **+1 Epiphany Slot**. The player can then use this slot to freely activate an Epiphany. Epiphany effects tend toward qualitative changes (new mechanics, powerful passives). Developers can set the maximum epiphany slot count.
- **Path**: An optional categorization label for epiphanies. Epiphanies without a specified path fall into the default group.
- **Aptitude**: The player's experience reservoir, earned by performing behaviors defined in datapacks. The formula for required aptitude per level is configurable.
- **Insight Point**: Each time the aptitude bar fills, it automatically converts into 1 Insight Point. Players spend Insight Points to select modules and unlock insights.

## Advanced Development & Future Plans

Want to go beyond the built-in presets? Epiphany offers comprehensive extension channels:

- Rich custom events and APIs
- KubeJS scripting support for event listening and data management
- Conditions, rewards, and aptitude sources are all registered through the registry system — developers are welcome to build advanced gameplay addons on top of Epiphany

The author is also planning a series of addon packs that integrate with more mainstream mods for expanded data and behavior compatibility. Stay tuned!

## AI Content Disclosure

During the development of this mod, AI tools were extensively used to automate batch coding tasks, greatly improving development efficiency. However, the core logic, framework architecture, UI/UX design, and all product details were fully directed and executed by human authors, while AI served only as an assistive tool.
