<template>
    <!-- What an empty list shows: what is missing, and the one step that changes it. -->
    <div class="flex flex-col items-center text-center gap-2 px-6" :class="compact ? 'py-8' : 'py-10'">
        <component :is="icon" :size="40" class="text-text-muted mb-2" />
        <h3 class="font-name text-title-md text-text-primary">{{ title }}</h3>
        <p v-if="text" class="max-w-[30ch] text-meta text-text-muted">{{ text }}</p>
        <div v-if="$slots.default" class="flex flex-col gap-2 w-full max-w-70 mt-3">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Component } from "vue"

defineProps<{
    icon: Component
    title: string
    text?: string
    compact?: boolean
}>()
</script>
