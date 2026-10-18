<template>
    <Teleport to="body">
        <div ref="scrimRef" class="fixed inset-0 bg-scrim flex items-end lg:items-center justify-center animate-fade-in"
            :style="{ zIndex: nested ? 'var(--z-sheet-nested)' : 'var(--z-sheet)' }" role="dialog" aria-modal="true"
            :aria-label="title" @click.self="dismiss">
            <!-- The drag offset sits on this wrapper so the slide-in animation can't override it. -->
            <div class="w-full flex justify-center pointer-events-none"
                :style="{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragging ? 'none' : 'transform .2s ease' }">
            <div
                class="pointer-events-auto bg-bg-surface border border-border border-b-0 lg:border-b rounded-t-xl lg:rounded-xl w-full flex flex-col shadow-sheet animate-slide-up lg:animate-fade-in"
                :class="[widthClass, fullHeight ? 'h-[92dvh] lg:h-[86vh]' : '']"
                :style="{ maxHeight, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }">

                <!-- Grip + header: dragging either down closes the sheet -->
                <div class="shrink-0 touch-none" @touchstart="onDragStart" @touchmove="onDragMove"
                    @touchend="onDragEnd" @touchcancel="onDragEnd">
                    <div class="lg:hidden flex justify-center pt-2 pb-1">
                        <div class="w-10 h-1 rounded-full bg-border-strong" />
                    </div>

                    <div v-if="title || $slots.header" class="flex items-center gap-3 pl-5 pr-4 pt-1 pb-3 lg:pt-4">
                        <slot name="header">
                            <div class="flex-1 min-w-0">
                                <h2 class="font-name text-title-md text-text-primary truncate">{{ title }}</h2>
                                <p v-if="subtitle" class="text-meta text-text-muted truncate">{{ subtitle }}</p>
                            </div>
                        </slot>
                        <UiIconButton v-if="dismissible" :icon="X" label="Schließen" @click="dismiss" />
                    </div>
                </div>

                <!-- Body -->
                <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <slot />
                </div>

                <!-- Actions -->
                <div v-if="$slots.footer" class="px-5 pt-3 pb-5 border-t border-border-subtle shrink-0">
                    <slot name="footer" />
                </div>

                <slot name="after" />
            </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next"

/**
 * The one shell for anything that sits on top of a page. A bottom sheet on the
 * phone, a centred dialog from 1024px. Closes via X, scrim, Esc or a downward
 * swipe on the grip. At most two levels: a `nested` sheet sits above the first.
 */
const props = withDefaults(defineProps<{
    title?: string
    subtitle?: string
    /** `md` for forms, `lg` for content-heavy sheets like dissolving a location. */
    size?: "md" | "lg"
    maxHeight?: string
    /** Sheet on top of a sheet (location picker inside the create sheet). */
    nested?: boolean
    /** Always 92% tall, for content that needs room (layout editor). */
    fullHeight?: boolean
    /** False only for the first-run name prompt, which must be answered. */
    dismissible?: boolean
}>(), {
    size: "md",
    maxHeight: "88dvh",
    nested: false,
    fullHeight: false,
    dismissible: true,
})

const emit = defineEmits<{ close: [] }>()

const widthClass = computed(() => (props.size === "lg" ? "max-w-180" : "max-w-140"))

function dismiss() {
    if (props.dismissible) emit("close")
}

// ── Swipe down to close ──────────────────────────────────────────────────────

const scrimRef = ref<HTMLElement>()
const dragY = ref(0)
const dragging = ref(false)
let startY = 0

function onDragStart(e: TouchEvent) {
    if (!props.dismissible) return
    startY = e.touches[0]?.clientY ?? 0
    dragging.value = true
}

function onDragMove(e: TouchEvent) {
    if (!dragging.value) return
    const y = (e.touches[0]?.clientY ?? startY) - startY
    dragY.value = Math.max(0, y)
}

function onDragEnd() {
    if (!dragging.value) return
    dragging.value = false
    if (dragY.value > 96) emit("close")
    dragY.value = 0
}

// ── Keyboard ─────────────────────────────────────────────────────────────────

function onKey(e: KeyboardEvent) {
    // Only the topmost sheet answers Esc.
    if (e.key !== "Escape" || !props.dismissible) return
    const sheets = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
    if (sheets[sheets.length - 1] === scrimRef.value) emit("close")
}

onMounted(() => window.addEventListener("keydown", onKey))
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>
