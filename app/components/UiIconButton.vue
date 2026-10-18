<template>
    <component :is="to ? NuxtLink : 'button'" :to="to" :type="to ? undefined : 'button'" :aria-label="label"
        :title="label"
        class="tap-area inline-flex items-center justify-center shrink-0 size-10 rounded-md border cursor-pointer transition-[transform,color,border-color,background-color] duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        :class="variantClass">
        <component :is="icon" :size="iconSize" />
    </component>
</template>

<script setup lang="ts">
import type { Component } from "vue"
import { NuxtLink } from "#components"

/** Icon-only button: 40px to look at, always 44px to hit. `label` is required. */
const props = withDefaults(defineProps<{
    icon: Component
    label: string
    variant?: "default" | "plain" | "accent" | "danger"
    iconSize?: number
    to?: string
}>(), {
    variant: "default",
    iconSize: 20,
})

const variantClass = computed(() => ({
    default: "bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-strong",
    plain: "bg-transparent border-transparent text-text-muted hover:bg-bg-hover hover:text-text-primary",
    accent: "bg-accent border-accent text-on-accent hover:brightness-108",
    danger: "bg-danger-dim border-danger/30 text-danger hover:border-danger",
}[props.variant]))
</script>
