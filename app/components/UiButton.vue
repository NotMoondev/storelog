<template>
    <component :is="to ? NuxtLink : 'button'" :to="to" :type="to ? undefined : type"
        :disabled="to ? undefined : disabled || loading" :aria-busy="loading || undefined"
        class="inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap border font-medium cursor-pointer select-none transition-[transform,background-color,border-color,filter,color] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        :class="[sizeClass, variantClass, block ? 'w-full' : '', variant === 'primary' ? 'is-primary' : '']">
        <component :is="icon" v-if="icon" :size="size === 'sm' ? 16 : 18" class="shrink-0" />
        <slot />
    </component>
</template>

<script setup lang="ts">
import type { Component } from "vue"
import { NuxtLink } from "#components"

/**
 * The one button. `primary` is the action the view exists for, at most one
 * per view. `sm` is for pointer devices only; on a phone use `md` or `lg`.
 */
const props = withDefaults(defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "ghost-accent" | "danger" | "danger-solid"
    size?: "sm" | "md" | "lg"
    icon?: Component
    block?: boolean
    disabled?: boolean
    loading?: boolean
    type?: "button" | "submit"
    to?: string
}>(), {
    variant: "secondary",
    size: "md",
    type: "button",
})

const sizeClass = computed(() => ({
    sm: "h-9 px-3 rounded-md text-meta",
    md: "h-11 px-4 rounded-md text-label",
    lg: "h-13 px-5 rounded-md text-body",
}[props.size]))

const variantClass = computed(() => ({
    primary: "bg-accent border-accent text-on-accent hover:brightness-108",
    secondary: "bg-bg-elevated border-border text-text-primary hover:border-border-strong",
    ghost: "bg-transparent border-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary",
    "ghost-accent": "bg-transparent border-transparent text-accent-text hover:bg-accent-dim",
    danger: "bg-danger-dim border-danger/30 text-danger hover:border-danger",
    "danger-solid": "bg-danger border-danger text-on-danger hover:brightness-108",
}[props.variant]))
</script>
