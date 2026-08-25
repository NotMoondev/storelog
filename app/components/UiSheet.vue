<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end lg:items-center justify-center"
            role="dialog" aria-modal="true" @click.self="$emit('close')">
            <div class="bg-bg-surface border-t lg:border border-border rounded-t-[20px] lg:rounded-[20px] w-full flex flex-col animate-slide-up lg:animate-fade-in"
                :class="widthClass"
                :style="{ maxHeight: maxHeight, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }">

                <!-- Drag handle (mobile affordance) -->
                <div class="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Header -->
                <div v-if="title || $slots.header"
                    class="flex items-center gap-3 px-5 pt-2 pb-3.5 border-b border-border-subtle shrink-0">
                    <slot name="header">
                        <h2 class="font-['Syne'] text-[18px] font-bold text-text-primary flex-1 min-w-0 truncate">
                            {{ title }}
                        </h2>
                    </slot>
                    <button v-if="!hideClose" type="button" aria-label="Schließen" @click="$emit('close')"
                        class="bg-bg-elevated border border-border text-text-secondary w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95 hover:text-text-primary hover:border-text-muted">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Body -->
                <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <slot />
                </div>

                <!-- Footer -->
                <div v-if="$slots.footer" class="px-5 pt-3 pb-5 border-t border-border-subtle shrink-0">
                    <slot name="footer" />
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    title?: string
    /** `md` for forms, `lg` for content-heavy sheets like dissolving a location. */
    size?: "md" | "lg"
    maxHeight?: string
    hideClose?: boolean
}>(), {
    size: "md",
    maxHeight: "88dvh",
    hideClose: false,
})

const emit = defineEmits<{ close: [] }>()

const widthClass = computed(() =>
    props.size === "lg" ? "max-w-180 lg:max-h-[86vh]" : "max-w-140 lg:max-h-[85vh]"
)

function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") emit("close")
}

onMounted(() => window.addEventListener("keydown", onKey))
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>
