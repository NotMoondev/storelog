<template>
    <Teleport to="body">
        <!--
            Above the bottom chrome on a phone (search field + navigation), bottom
            right on a desktop. One at a time; a new one replaces the old.
        -->
        <div class="fixed inset-x-0 flex justify-center lg:justify-end pointer-events-none px-4 lg:px-6 lg:bottom-6!"
            :style="{ zIndex: 'var(--z-toast)', bottom: `calc(max(12px, env(safe-area-inset-bottom)) + ${offset}px)` }"
            role="status" aria-live="polite">
            <Transition enter-active-class="transition-[opacity,transform] duration-200 ease-out"
                leave-active-class="transition-[opacity,transform] duration-150 ease-in"
                enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 translate-y-2">
                <div v-if="current" :key="current.id"
                    class="pointer-events-auto w-full max-w-110 flex items-center gap-3 min-h-14 pl-4 pr-2 py-2 rounded-md bg-bg-elevated border border-border shadow-float text-meta text-text-primary"
                    @pointerenter="hold" @pointerleave="release" @focusin="hold" @focusout="release">
                    <component :is="current.tone === 'danger' ? TriangleAlert : Check" :size="18" class="shrink-0"
                        :class="current.tone === 'danger' ? 'text-danger' : 'text-accent-text'" />
                    <p class="flex-1 min-w-0">{{ current.message }}</p>
                    <UiButton v-if="current.undo" variant="ghost-accent" @click="runUndo">
                        {{ current.undoLabel ?? 'Rückgängig' }}
                    </UiButton>
                    <UiIconButton v-else :icon="X" label="Meldung schließen" variant="plain" :icon-size="18"
                        @click="dismiss" />
                </div>
            </Transition>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Check, TriangleAlert, X } from "lucide-vue-next"

defineProps<{
    /** Height of the bottom chrome on a phone, so the toast sits just above it. */
    offset: number
}>()

const { current, dismiss, hold, release, runUndo } = useToast()
</script>
