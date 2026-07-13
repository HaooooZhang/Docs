import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme"
import Mermaid from "./Mermaid.vue"
import "katex/dist/katex.min.css"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Mermaid", Mermaid)
  },
} satisfies Theme
