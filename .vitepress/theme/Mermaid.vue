<template>
  <div v-html="svg" :class="props.class"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw } from "vue"
import { useData } from "vitepress"

const props = defineProps<{
  graph: string
  id: string
  class?: string
}>()

const { page } = useData()
const frontmatter = toRaw(page.value).frontmatter
const mermaidPageTheme = frontmatter?.mermaidTheme || ""

const svg = ref<string | null>(null)

onMounted(async () => {
  try {
    const hasDarkClass = document.documentElement.classList.contains("dark")
    const config: Record<string, any> = {
      securityLevel: "loose",
      startOnLoad: false,
    }
    if (mermaidPageTheme) config.theme = mermaidPageTheme
    if (hasDarkClass) config.theme = "dark"

    const { default: mermaid } = await import("mermaid")
    mermaid.initialize(config)
    const { svg: svgCode } = await mermaid.render(props.id, decodeURIComponent(props.graph))
    const salt = Math.random().toString(36).substring(7)
    svg.value = `${svgCode} <span style="display: none">${salt}</span>`
  } catch (e) {
    console.error("Mermaid render error:", e)
  }
})
</script>
