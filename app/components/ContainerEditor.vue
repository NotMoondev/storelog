<template>
    <Teleport to="body">
        <div v-if="open"
            class="fixed inset-0 bg-black/80 backdrop-blur-sm z-200 flex items-end lg:items-center justify-center p-0 lg:p-4"
            @click.self="handleOverlayClick">

            <div
                class="w-full lg:max-w-195 h-[92dvh] max-h-[92dvh] lg:max-h-[90vh] flex flex-col overflow-hidden rounded-t-[18px] lg:rounded-2xl border border-border bg-bg-surface shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-slide-up lg:animate-fade-in">

                <!-- Header row 1: title + close -->
                <div class="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div
                            class="w-8 h-8 bg-accent-dim border border-accent/30 rounded-lg flex items-center justify-center text-accent shrink-0">
                            <IconLayoutGrid :size="16" />
                        </div>
                        <div class="min-w-0">
                            <div class="font-['Syne'] text-[15px] font-bold text-text-primary truncate">
                                {{ container?.name }}
                            </div>
                        </div>
                    </div>

                    <button
                        class="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:bg-(--danger-dim) hover:text-danger hover:border-danger shrink-0 ml-2"
                        title="Schließen" @click="handleClose">
                        <IconX :size="16" />
                    </button>
                </div>

                <!-- Header row 2: undo/redo + edit toggle + save -->
                <div class="flex items-center gap-1.5 px-4 pb-3 border-b border-border-subtle shrink-0">
                    <!-- Undo -->
                    <button
                        class="w-8 h-8 flex items-center justify-center rounded-[7px] bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:bg-bg-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        :disabled="historyIndex <= 0" title="Rückgängig (Ctrl+Z)" @click="undo">
                        <IconCornerUpLeft :size="14" />
                    </button>

                    <!-- Redo -->
                    <button
                        class="w-8 h-8 flex items-center justify-center rounded-[7px] bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:bg-bg-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        :disabled="historyIndex >= history.length - 1" title="Wiederholen (Ctrl+Y)" @click="redo">
                        <IconCornerUpRight :size="14" />
                    </button>

                    <div class="w-px h-5 bg-border mx-0.5 shrink-0" />

                    <!-- Edit / Done toggle -->
                    <button
                        class="flex items-center gap-1.5 h-8 px-3 rounded-[7px] border text-[12px] cursor-pointer transition-all"
                        :class="editing
                            ? 'bg-accent-dim border-accent text-accent'
                            : 'bg-bg-elevated border-border text-text-secondary hover:border-accent hover:text-accent'"
                        @click="editing = !editing">
                        <IconPen v-if="!editing" :size="12" />
                        <IconCheck v-else :size="12" />
                        {{ editing ? 'Fertig' : 'Bearbeiten' }}
                    </button>

                    <div class="flex-1" />

                    <!-- Save -->
                    <button
                        class="flex items-center gap-1.5 h-8 px-3.5 rounded-[7px] border-none text-[12px] cursor-pointer transition-all bg-accent text-black hover:brightness-110 disabled:opacity-35 disabled:cursor-not-allowed"
                        :disabled="saving || !dirty" @click="save">
                        <IconSave :size="13" />
                        {{ saving ? 'Speichern…' : 'Speichern' }}
                    </button>
                </div>

                <!-- Edit mode tips: desktop only -->
                <div v-if="editing"
                    class="hidden sm:flex items-center justify-between px-4 py-2 bg-bg-elevated border-b border-border-subtle shrink-0 gap-3">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span class="text-[10px] text-text-muted flex items-center gap-1">
                            <kbd
                                class="bg-bg-surface border border-border rounded px-1 py-px text-[9px] text-text-secondary">Drag</kbd>
                            Zone teilen
                        </span>
                        <span class="text-[10px] text-text-muted flex items-center gap-1">
                            <kbd
                                class="bg-bg-surface border border-border rounded px-1 py-px text-[9px] text-text-secondary">Tippen</kbd>
                            Zone umbenennen
                        </span>
                        <span class="text-[10px] text-text-muted flex items-center gap-1">
                            <kbd
                                class="bg-bg-surface border border-border rounded px-1 py-px text-[9px] text-text-secondary">✕</kbd>
                            Split entfernen
                        </span>
                    </div>
                    <span
                        class="text-[10px] text-text-muted bg-bg-surface border border-border-subtle rounded-[5px] px-2 py-0.5 shrink-0">
                        {{ zoneCount }} Zonen
                    </span>
                </div>

                <!-- Canvas -->
                <div class="flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-5 bg-bg min-h-0">
                    <div ref="canvasEl"
                        class="bg-bg-surface border-[1.5px] border-border rounded-lg overflow-hidden max-w-full max-h-full w-full shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                        :style="{ aspectRatio: `${container?.dimensions.width} / ${container?.dimensions.height}` }">
                        <ContainerZoneNode v-if="localRoot" :node="localRoot" :editing="editing"
                            :item-counts="itemCounts" @split="onSplit" @remove-split="onRemoveSplit"
                            @resize-split="onResizeSplit" @rename="onRename" />
                    </div>
                </div>

                <!-- Zone list (read mode) -->
                <div v-if="!editing && zoneList.length > 0"
                    class="flex flex-wrap gap-1.5 px-4 py-3 border-t border-border-subtle shrink-0 max-h-20 overflow-y-auto">
                    <div v-for="zone in zoneList" :key="zone.id"
                        class="flex items-center gap-1.5 bg-bg-elevated border border-border-subtle rounded-md px-2.5 py-1">
                        <div class="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span class="text-[11px] text-text-primary">{{ zone.name }}</span>
                        <span v-if="zone.locationId && itemCounts[zone.locationId]"
                            class="text-[10px] text-accent bg-accent-dim rounded-full px-1.5">
                            {{ itemCounts[zone.locationId] }}
                        </span>
                        <span v-else class="text-[10px] text-text-muted">leer</span>
                    </div>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import type { Container, ContainerNode, ContainerLeafNode, ContainerSplitNode } from "~/types/container"
import { collectLeaves, makeLeaf, replaceNode } from "~/repositories/containerRepository"

interface Props {
    open: boolean
    container: Container | null
    itemCounts: Record<string, number>
}

const props = defineProps<Props>()
const emit = defineEmits<{
    close: []
    saved: [container: Container]
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const editing = ref(false)
const saving = ref(false)
const dirty = ref(false)
const canvasEl = ref<HTMLElement>()

const localRoot = ref<ContainerNode | null>(null)

const history = ref<string[]>([])
const historyIndex = ref(-1)

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(() => props.container, (c) => {
    if (c) {
        localRoot.value = JSON.parse(JSON.stringify(c.rootNode))
        history.value = [JSON.stringify(c.rootNode)]
        historyIndex.value = 0
        dirty.value = false
        editing.value = false
    }
}, { immediate: true })

watch(() => props.open, (v) => {
    if (!v) editing.value = false
})

onMounted(() => window.addEventListener("keydown", onKeyDown))
onUnmounted(() => window.removeEventListener("keydown", onKeyDown))

function onKeyDown(e: KeyboardEvent) {
    if (!props.open) return
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo() }
    if (e.key === "Escape") handleClose()
}

// ── History ───────────────────────────────────────────────────────────────────

function pushHistory(node: ContainerNode) {
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(JSON.stringify(node))
    historyIndex.value = history.value.length - 1
    dirty.value = true
}

function undo() {
    if (historyIndex.value <= 0) return
    historyIndex.value--
    localRoot.value = JSON.parse(history.value[historyIndex.value]!)
    dirty.value = historyIndex.value > 0
}

function redo() {
    if (historyIndex.value >= history.value.length - 1) return
    historyIndex.value++
    localRoot.value = JSON.parse(history.value[historyIndex.value]!)
    dirty.value = true
}

// ── BSP Operations ────────────────────────────────────────────────────────────

function onSplit(event: { leafId: string; direction: "vsplit" | "hsplit"; pos: number }) {
    if (!localRoot.value) return

    const leaf = findLeaf(localRoot.value, event.leafId)
    if (!leaf) return

    const splitNode: ContainerSplitNode = {
        type: event.direction,
        id: leaf.id,
        splitPos: event.pos,
        children: [
            makeLeaf(`${leaf.name} A`),
            makeLeaf(`${leaf.name} B`),
        ],
    }

    if (localRoot.value.id === event.leafId) {
        localRoot.value = splitNode
    } else {
        localRoot.value = replaceNode(localRoot.value, event.leafId, splitNode)
    }

    pushHistory(localRoot.value)
}

function onResizeSplit(_event: { splitNodeId: string; pos: number }) {
    // The pos was already applied via direct mutation during drag — just push history
    if (localRoot.value) {
        pushHistory(localRoot.value)
    }
}

function onRemoveSplit(splitNodeId: string) {
    if (!localRoot.value) return

    if (localRoot.value.id === splitNodeId) {
        localRoot.value = makeLeaf("Hauptbereich")
        pushHistory(localRoot.value)
        return
    }

    const newRoot = removeSplitNode(localRoot.value, splitNodeId)
    if (newRoot) {
        localRoot.value = newRoot
        pushHistory(localRoot.value)
    }
}

function removeSplitNode(node: ContainerNode, targetId: string): ContainerNode | null {
    if (node.type === "leaf") return node
    if (node.id === targetId) return node.children[0]
    return {
        ...node,
        children: [
            removeSplitNode(node.children[0], targetId) ?? node.children[0],
            removeSplitNode(node.children[1], targetId) ?? node.children[1],
        ],
    }
}

function onRename(event: { leafId: string; name: string }) {
    if (!localRoot.value) return
    const leaf = findLeaf(localRoot.value, event.leafId)
    if (!leaf) return
    localRoot.value = replaceNode(localRoot.value, event.leafId, { ...leaf, name: event.name })
    pushHistory(localRoot.value)
}

function findLeaf(node: ContainerNode, id: string): ContainerLeafNode | null {
    if (node.type === "leaf") return node.id === id ? node : null
    return findLeaf(node.children[0], id) ?? findLeaf(node.children[1], id)
}

// ── Save / Close ──────────────────────────────────────────────────────────────

const { saveContainerTree } = useContainers()

async function save() {
    if (!props.container || !localRoot.value) return
    saving.value = true
    try {
        const plainRoot = JSON.parse(JSON.stringify(localRoot.value))
        await saveContainerTree(props.container.id, plainRoot)
        dirty.value = false
        emit("saved", { ...props.container, rootNode: plainRoot })
    } finally {
        saving.value = false
    }
}

function handleClose() {
    if (dirty.value) {
        if (!confirm("Änderungen verwerfen?")) return
    }
    emit("close")
}

function handleOverlayClick() {
    handleClose()
}

// ── Computed ──────────────────────────────────────────────────────────────────

const zoneList = computed<ContainerLeafNode[]>(() =>
    localRoot.value ? collectLeaves(localRoot.value) : []
)

const zoneCount = computed(() => zoneList.value.length)
</script>
