<template>
    <button type="button" :aria-pressed="pressed"
        class="inline-flex items-center gap-1 shrink-0 h-9 px-3 rounded-sm border text-meta font-medium whitespace-nowrap cursor-pointer transition-colors duration-150"
        :class="[
            pressed
                ? 'bg-accent-dim border-accent text-accent-text'
                : 'bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-strong',
            removable ? 'pr-2' : '',
        ]">
        <slot />
        <X v-if="removable" :size="16" aria-hidden="true" />
    </button>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next"

/** A one-tap choice: recent places, the active compartment filter. */
defineProps<{
    pressed?: boolean
    /** Shows an X; the whole chip then removes the filter it stands for. */
    removable?: boolean
}>()
</script>
