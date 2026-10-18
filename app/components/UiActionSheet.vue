<template>
    <UiSheet :title="title" :subtitle="subtitle" @close="$emit('close')">
        <div class="flex flex-col gap-0.5 px-3 pb-4">
            <template v-for="(action, i) in actions" :key="action.label">
                <div v-if="action.danger && i > 0" class="h-px bg-border-subtle mx-3 my-2" />
                <button type="button"
                    class="flex items-center gap-3 w-full min-h-16 px-3 py-2 rounded-md text-left cursor-pointer transition-colors hover:bg-bg-elevated active:bg-bg-hover"
                    :class="action.danger ? 'text-danger' : 'text-text-primary'" @click="run(action)">
                    <span class="size-10 shrink-0 rounded-md flex items-center justify-center"
                        :class="action.danger ? 'bg-danger-dim text-danger' : 'bg-bg-elevated text-text-secondary'">
                        <component :is="action.icon" :size="20" />
                    </span>
                    <span class="flex-1 min-w-0">
                        <span class="block text-body font-medium">{{ action.label }}</span>
                        <span v-if="action.hint" class="block text-meta"
                            :class="action.danger ? 'text-danger/80' : 'text-text-muted'">{{ action.hint }}</span>
                    </span>
                </button>
            </template>
        </div>
    </UiSheet>
</template>

<script setup lang="ts">
import type { Component } from "vue"

export interface SheetAction {
    label: string
    hint?: string
    icon: Component
    danger?: boolean
    run: () => void
}

/**
 * Actions for one thing, behind ⋯ or a long press. Ordered by how often they
 * are needed; the destructive one comes last, after a rule.
 */
defineProps<{
    title: string
    subtitle?: string
    actions: SheetAction[]
}>()

const emit = defineEmits<{ close: [] }>()

function run(action: SheetAction) {
    emit("close")
    nextTick(action.run)
}
</script>
