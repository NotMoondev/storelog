<template>
    <!-- Split node: two children with a draggable/removable divider -->
    <div v-if="node.type !== 'leaf'" class="flex w-full h-full overflow-hidden"
        :class="node.type === 'vsplit' ? 'flex-row' : 'flex-col'">

        <!-- Child A -->
        <div class="overflow-hidden relative shrink-0" :style="childAStyle">
            <ContainerZoneNode :node="node.children[0]" :depth="depth + 1" :editing="editing" :item-counts="itemCounts"
                @split="$emit('split', $event)" @remove-split="$emit('remove-split', $event)"
                @resize-split="$emit('resize-split', $event)" @rename="$emit('rename', $event)" />
        </div>

        <!-- Divider handle -->
        <div class="relative shrink-0 flex items-center justify-center z-10 group" :class="node.type === 'vsplit'
            ? 'w-3 h-full cursor-col-resize'
            : 'h-3 w-full cursor-row-resize'" @mousedown.stop="startDividerDrag($event, node)"
            @touchstart.stop.prevent="startDividerDragTouch($event, node)"
            @dblclick.stop="editing && $emit('remove-split', node.id)">

            <!-- Visual line -->
            <div class="absolute pointer-events-none bg-accent/40 group-hover:bg-accent/80 transition-colors" :class="node.type === 'vsplit'
                ? 'w-px h-full left-1/2 -translate-x-1/2'
                : 'h-px w-full top-1/2 -translate-y-1/2'" />

            <!-- Remove button: always visible on mobile, hover-only on sm+ -->
            <button v-if="editing"
                class="relative z-10 flex items-center justify-center bg-bg-elevated border border-accent/70 rounded text-accent w-5 h-5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                title="Split entfernen" @click.stop="$emit('remove-split', node.id)"
                @touchend.stop.prevent="$emit('remove-split', node.id)">
                <IconX :size="10" />
            </button>
        </div>

        <!-- Child B -->
        <div class="overflow-hidden relative shrink-0" :style="childBStyle">
            <ContainerZoneNode :node="node.children[1]" :depth="depth + 1" :editing="editing" :item-counts="itemCounts"
                @split="$emit('split', $event)" @remove-split="$emit('remove-split', $event)"
                @resize-split="$emit('resize-split', $event)" @rename="$emit('rename', $event)" />
        </div>
    </div>

    <!-- Leaf node: the actual zone -->
    <div v-else
        class="w-full h-full relative overflow-hidden flex items-center justify-center transition-colors group/leaf"
        :class="editing ? 'cursor-crosshair hover:bg-bg-elevated' : ''"
        :style="hasItems ? { background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-surface))' } : {}"
        @mousedown="editing && startSplitDrag($event)" @touchstart.prevent="editing && startSplitDragTouch($event)">

        <!-- Zone label + badge -->
        <div class="flex flex-col items-center gap-1 px-2 py-2 text-center pointer-events-none z-1">
            <!-- Name — stops touch so parent drag doesn't fire, click = rename -->
            <div v-if="!renaming"
                class="font-['DM_Mono'] text-[11px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis max-w-30 px-1.5 py-1 rounded transition-all pointer-events-auto select-none"
                :class="editing ? 'cursor-text hover:text-text-primary hover:bg-bg-hover active:bg-bg-hover' : ''"
                @touchstart.stop @click.stop="editing && startRename()">
                {{ node.name }}
            </div>
            <input v-else ref="renameInput" v-model="renameDraft" type="text" autocomplete="off" spellcheck="false"
                class="font-['DM_Mono'] text-[11px] bg-bg-elevated border border-accent rounded text-text-primary outline-none px-1.5 py-0.5 w-24 text-center pointer-events-auto shadow-[0_0_0_3px_var(--accent-glow)]"
                @keydown.enter="commitRename" @keydown.escape="cancelRename" @blur="commitRename" @mousedown.stop
                @touchstart.stop @click.stop />

            <!-- Item count badge -->
            <div v-if="hasItems && !renaming"
                class="font-['DM_Mono'] text-[9px] bg-accent-dim text-accent rounded-full px-1.5 pointer-events-none">
                {{ itemCounts[node.locationId!] }}
            </div>
        </div>

        <!-- Split preview line while dragging -->
        <div v-if="dragPreview" class="absolute pointer-events-none z-20 bg-accent" :class="dragPreview.direction === 'vsplit'
            ? 'top-0 bottom-0 w-0.5 -translate-x-1/2 shadow-[0_0_8px_var(--accent)]'
            : 'left-0 right-0 h-0.5 -translate-y-1/2 shadow-[0_0_8px_var(--accent)]'" :style="dragPreview.direction === 'vsplit'
                    ? { left: dragPreview.pos * 100 + '%' }
                    : { top: dragPreview.pos * 100 + '%' }" />

        <!-- Edit hint: desktop only, appears on hover -->
        <div v-if="editing && !renaming && !dragPreview"
            class="absolute bottom-1.5 left-0 right-0 hidden sm:flex flex-col items-center gap-px pointer-events-none opacity-0 group-hover/leaf:opacity-100 transition-opacity">
            <span class="font-['DM_Mono'] text-[9px] text-text-muted">Ziehen zum Teilen</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ContainerNode, ContainerSplitNode } from "~/types/container"

interface Props {
    node: ContainerNode
    depth?: number
    editing: boolean
    itemCounts: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), { depth: 0 })

const emit = defineEmits<{
    split: [{ leafId: string; direction: "vsplit" | "hsplit"; pos: number }]
    "remove-split": [splitNodeId: string]
    "resize-split": [{ splitNodeId: string; pos: number }]
    rename: [{ leafId: string; name: string }]
}>()

// ── Divider drag (resize existing split) ─────────────────────────────────────

function startDividerDrag(e: MouseEvent, node: ContainerNode) {
    if (!props.editing || node.type === "leaf") return
    const splitNode = node as ContainerSplitNode
    e.preventDefault()

    const el = (e.currentTarget as HTMLElement).parentElement!
    const rect = el.getBoundingClientRect()
    const isV = splitNode.type === "vsplit"

    function onMove(me: MouseEvent) {
        const pos = isV
            ? (me.clientX - rect.left) / rect.width
            : (me.clientY - rect.top) / rect.height
        splitNode.splitPos = Math.min(Math.max(pos, 0.1), 0.9)
    }

    function onUp() {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
        emit("resize-split", { splitNodeId: splitNode.id, pos: splitNode.splitPos })
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
}

function startDividerDragTouch(e: TouchEvent, node: ContainerNode) {
    if (!props.editing || node.type === "leaf") return
    const splitNode = node as ContainerSplitNode

    const el = (e.currentTarget as HTMLElement).parentElement!
    const rect = el.getBoundingClientRect()
    const isV = splitNode.type === "vsplit"

    function onMove(te: TouchEvent) {
        const t = te.touches[0]
        if (!t) return
        const pos = isV
            ? (t.clientX - rect.left) / rect.width
            : (t.clientY - rect.top) / rect.height
        splitNode.splitPos = Math.min(Math.max(pos, 0.1), 0.9)
    }

    function onEnd() {
        window.removeEventListener("touchmove", onMove)
        window.removeEventListener("touchend", onEnd)
        emit("resize-split", { splitNodeId: splitNode.id, pos: splitNode.splitPos })
    }

    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onEnd)
}

// ── Leaf split drag (create new split) ───────────────────────────────────────

interface DragPreview {
    direction: "vsplit" | "hsplit"
    pos: number
}

const dragPreview = ref<DragPreview | null>(null)
const DRAG_THRESHOLD = 8

function startSplitDrag(e: MouseEvent) {
    if (!props.editing || props.node.type !== "leaf") return
    e.preventDefault()

    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    let locked = false
    let direction: "vsplit" | "hsplit" = "vsplit"

    function onMove(me: MouseEvent) {
        const dx = me.clientX - startX
        const dy = me.clientY - startY

        if (!locked && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
            direction = Math.abs(dx) > Math.abs(dy) ? "vsplit" : "hsplit"
            locked = true
        }

        if (locked) {
            const pos = direction === "vsplit"
                ? (me.clientX - rect.left) / rect.width
                : (me.clientY - rect.top) / rect.height
            dragPreview.value = { direction, pos: Math.min(Math.max(pos, 0.05), 0.95) }
        }
    }

    function onUp() {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)

        if (dragPreview.value && props.node.type === "leaf") {
            emit("split", {
                leafId: props.node.id,
                direction: dragPreview.value.direction,
                pos: dragPreview.value.pos,
            })
        }
        dragPreview.value = null
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
}

function startSplitDragTouch(e: TouchEvent) {
    if (!props.editing || props.node.type !== "leaf") return

    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const t0 = e.touches[0]
    if (!t0) return
    const startX = t0.clientX
    const startY = t0.clientY
    let locked = false
    let direction: "vsplit" | "hsplit" = "vsplit"

    function onMove(te: TouchEvent) {
        const t = te.touches[0]
        if (!t) return
        const dx = t.clientX - startX
        const dy = t.clientY - startY

        if (!locked && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
            direction = Math.abs(dx) > Math.abs(dy) ? "vsplit" : "hsplit"
            locked = true
        }

        if (locked) {
            const pos = direction === "vsplit"
                ? (t.clientX - rect.left) / rect.width
                : (t.clientY - rect.top) / rect.height
            dragPreview.value = { direction, pos: Math.min(Math.max(pos, 0.05), 0.95) }
        }
    }

    function onEnd() {
        window.removeEventListener("touchmove", onMove)
        window.removeEventListener("touchend", onEnd)

        if (dragPreview.value && props.node.type === "leaf") {
            emit("split", {
                leafId: props.node.id,
                direction: dragPreview.value.direction,
                pos: dragPreview.value.pos,
            })
        }
        dragPreview.value = null
    }

    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onEnd)
}

// ── Rename ────────────────────────────────────────────────────────────────────

const renaming = ref(false)
const renameDraft = ref("")
const renameInput = ref<HTMLInputElement>()

function startRename() {
    if (props.node.type !== "leaf") return
    renameDraft.value = props.node.name
    renaming.value = true
    nextTick(() => {
        renameInput.value?.focus()
        renameInput.value?.select()
    })
}

function commitRename() {
    if (!renaming.value || props.node.type !== "leaf") return
    const name = renameDraft.value.trim()
    if (name && name !== props.node.name) {
        emit("rename", { leafId: props.node.id, name })
    }
    renaming.value = false
}

function cancelRename() {
    renaming.value = false
}

// ── Computed ──────────────────────────────────────────────────────────────────

const DIVIDER_HALF = 6

const childAStyle = computed(() => {
    if (props.node.type === "leaf") return {}
    const pos = props.node.splitPos * 100
    return props.node.type === "vsplit"
        ? { width: `calc(${pos}% - ${DIVIDER_HALF}px)` }
        : { height: `calc(${pos}% - ${DIVIDER_HALF}px)` }
})

const childBStyle = computed(() => {
    if (props.node.type === "leaf") return {}
    const pos = (1 - props.node.splitPos) * 100
    return props.node.type === "vsplit"
        ? { width: `calc(${pos}% - ${DIVIDER_HALF}px)` }
        : { height: `calc(${pos}% - ${DIVIDER_HALF}px)` }
})

const hasItems = computed(() =>
    props.node.type === "leaf"
    && !!props.node.locationId
    && !!props.itemCounts[props.node.locationId]
)
</script>
