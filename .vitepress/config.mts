import { defineConfig } from "vitepress"
import { katex } from "@mdit/plugin-katex"

export default defineConfig({
  srcDir: "docs",
  lang: "en",
  title: "HaooooZhang's Docs",
  description: "Docs for some Repositories",

  head: [
    ["link", { rel: "icon", href: "/icon.png" }],
    ["meta", { property: "og:image", content: "/icon.png" }],
  ],

  locales: {
    root: {
      label: "English",
      lang: "en",
      link: "/",
    },
    "zh-CN": {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh-CN/",
      themeConfig: {
        nav: [
          { text: "首页", link: "/zh-CN/" },
          { text: "Epiphany", link: "/zh-CN/Epiphany/Overview" },
        ],
        sidebar: {
          "/zh-CN/Epiphany/": [
            {
              text: "Epiphany",
              items: [
                { text: "概述", link: "/zh-CN/Epiphany/Overview" },
                { text: "相关链接", link: "/zh-CN/Epiphany/Links" },
              ],
            },
            {
              text: "玩家文档",
              items: [
                { text: "快速开始", link: "/zh-CN/Epiphany/Players/Quick Start" },
                { text: "核心机制", link: "/zh-CN/Epiphany/Players/Gameplay" },
                { text: "配置", link: "/zh-CN/Epiphany/Players/Config" },
                { text: "命令", link: "/zh-CN/Epiphany/Players/Command" },
              ],
            },
            {
              text: "开发者文档",
              items: [
                { text: "快速开始", link: "/zh-CN/Epiphany/Developers/Quick Start" },
                { text: "模块 Module", link: "/zh-CN/Epiphany/Developers/Module" },
                { text: "心得 Insight", link: "/zh-CN/Epiphany/Developers/Insight" },
                { text: "顿悟 Epiphany", link: "/zh-CN/Epiphany/Developers/Epiphany" },
                { text: "道路 Path", link: "/zh-CN/Epiphany/Developers/Path" },
                { text: "阅历与心得点", link: "/zh-CN/Epiphany/Developers/Aptitude & Insight Point" },
                { text: "条件类型 Condition", link: "/zh-CN/Epiphany/Developers/Condition" },
                { text: "奖励类型 Reward", link: "/zh-CN/Epiphany/Developers/Reward" },
                { text: "Manager API", link: "/zh-CN/Epiphany/Developers/Manager API" },
                { text: "自定义事件列表", link: "/zh-CN/Epiphany/Developers/Custom Event List" },
                { text: "KubeJS 兼容", link: "/zh-CN/Epiphany/Developers/KubeJS Compat" },
                { text: "国际化", link: "/zh-CN/Epiphany/Developers/i18n" },
                { text: "注册新的 Condition", link: "/zh-CN/Epiphany/Developers/Register New Condition" },
                { text: "注册新的 Reward", link: "/zh-CN/Epiphany/Developers/Register New Reward" },
                { text: "注册新的 Aptitude Source", link: "/zh-CN/Epiphany/Developers/Register New Aptitude Source" },
              ],
            },
          ],
        },
      },
    },
  },

  markdown: {
    math: false,
    config: (md) => {
      md.use(katex)
      const fence = md.renderer.rules.fence
      md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args
        const token = tokens[idx]
        if (token.info.trim() === "mermaid") {
          return `<Mermaid id="mermaid-${idx}" graph="${encodeURIComponent(token.content)}"></Mermaid>`
        }
        return fence!(...args)
      }

    },
  },

  themeConfig: {
    logo: "/icon.png",

    search: {
      provider: "local",
    },

    nav: [
      { text: "Home", link: "/" },
      { text: "Epiphany", link: "/Epiphany/Overview" },
    ],

    sidebar: {
      "/Epiphany/": [
        {
          text: "Epiphany",
          items: [
            { text: "Overview", link: "/Epiphany/Overview" },
            { text: "Links", link: "/Epiphany/Links" },
          ],
        },
        {
          text: "Players",
          items: [
            { text: "Quick Start", link: "/Epiphany/Players/Quick Start" },
            { text: "Gameplay", link: "/Epiphany/Players/Gameplay" },
            { text: "Config", link: "/Epiphany/Players/Config" },
            { text: "Command", link: "/Epiphany/Players/Command" },
          ],
        },
        {
          text: "Developers",
          items: [
            { text: "Quick Start", link: "/Epiphany/Developers/Quick Start" },
            { text: "Module", link: "/Epiphany/Developers/Module" },
            { text: "Insight", link: "/Epiphany/Developers/Insight" },
            { text: "Epiphany", link: "/Epiphany/Developers/Epiphany" },
            { text: "Path", link: "/Epiphany/Developers/Path" },
            { text: "Aptitude & Insight Point", link: "/Epiphany/Developers/Aptitude & Insight Point" },
            { text: "Condition", link: "/Epiphany/Developers/Condition" },
            { text: "Reward", link: "/Epiphany/Developers/Reward" },
            { text: "Manager API", link: "/Epiphany/Developers/Manager API" },
            { text: "Custom Event List", link: "/Epiphany/Developers/Custom Event List" },
            { text: "KubeJS Compat", link: "/Epiphany/Developers/KubeJS Compat" },
            { text: "i18n", link: "/Epiphany/Developers/i18n" },
            { text: "Register New Condition", link: "/Epiphany/Developers/Register New Condition" },
            { text: "Register New Reward", link: "/Epiphany/Developers/Register New Reward" },
            { text: "Register New Aptitude Source", link: "/Epiphany/Developers/Register New Aptitude Source" },
          ],
        },
      ],

    },

    socialLinks: [
      { icon: "github", link: "https://github.com/HaooooZhang/Docs" },
    ],
  },
})
