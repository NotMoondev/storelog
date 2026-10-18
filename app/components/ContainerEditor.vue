<template>
    <UiSheet v-if="open && container" size="lg" full-height title="Aufteilung bearbeiten" :subtitle="container.name"
        @close="handleClose">
        <div class="h-full flex flex-col">
            <!-- Tools -->
            <div class="flex items-center gap-2 px-4 pb-3 shrink-0">
                <UiIconButton :icon="Undo2" label="Rückgängig (Strg+Z)" :disabled="historyIndex <= 0" @click="undo" />
                <UiIconButton :icon="Redo2" label="Wiederholen (Strg+Y)"
                    :disabled="historyIndex >= history.length - 1" @click="redo" />
                <p class="flex-1 min-w-0 text-meta text-text-muted">
                    Ziehen teilt · Antippen benennt · <span class="whitespace-nowrap">✕ entfernt eine Trennung</span>
                </p>
                <span class="shrink-0 text-caption text-text-muted tabular-nums">{{ zoneCountLabel }}</span>
            </div>

            <!-- Canvas -->
            <div class="flex-1 min-h-0 flex items-center justify-center p-4 bg-bg border-y border-border-subtle">
                <div ref="canvasEl"
                    class="bg-bg-surface border-2 border-dashed border-border-strong rounded-lg overflow-hidden max-w-full max-h-full w-full"
                    :style="{ aspectRatio: `${container.dimensions.width} / ${container.dimensions.height}` }">
                    <ContainerZoneNode v-if="localRoot" :node="localRoot" :editing="true" :item-counts="itemCounts"
                        @split="onSplit" @remove-split="onRemoveSplit" @resize-split="onResizeSplit"
                        @rename="onRename" />
                </div>
            </div>
        </div>

        <template #footer>
            <UiActionBar>
                <UiButton variant="primary" :loading="saving" @click="finish">Fertig</UiButton>
            </UiActionBar>
        </template>
    </UiSheet>
</template>

<script setup lang="ts">
import { Redo2, Undo2 } from "lucide-vue-next"
import type { Container, ContainerNode, ContainerLeafNode, ContainerSplitNode } from "~/types/container"
import { collectLeaves, makeLeaf, replaceNode } from "~/repositories/containerRepository"
import { zoneCount } from "~/utils/plural"

/**
 * Edits a container's compartments. It opens ready to edit — reading the plan
 * is the location page's job. "Fertig" saves; closing any other way discards,
 * and the toast offers to save after all.
 */

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

const toast = useToast()

// ── State ─────────────────────────────────────────────────────────────────────

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
    }
}, { immediate: true })

onMounted(() => window.addEventListener("keydown", onKeyDown))
onUnmounted(() => window.removeEventListener("keydown", onKeyDown))

function onKeyDown(e: KeyboardEvent) {
    if (!props.open) return
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo() }
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

async function save(root: ContainerNode) {
    if (!props.container) return
    const previous = JSON.parse(JSON.stringify(props.container.rootNode)) as ContainerNode
    const plainRoot = JSON.parse(JSON.stringify(root)) as ContainerNode
    const container = props.container
    await saveContainerTree(container.id, plainRoot)
    dirty.value = false
    emit("saved", { ...container, rootNode: plainRoot })
    toast.show({
        message: "Aufteilung gespeichert",
        undo: () => saveContainerTree(container.id, previous),
    })
}

async function finish() {
    if (!dirty.value || !localRoot.value) {
        emit("close")
        return
    }
    saving.value = true
    try {
        await save(localRoot.value)
    } catch (err) {
        toast.error(err, "Speichern hat nicht geklappt.")
    } finally {
        saving.value = false
    }
}

/** Closing without "Fertig" discards; the toast can still save what was drawn. */
function handleClose() {
    if (dirty.value && localRoot.value) {
        const draft = JSON.parse(JSON.stringify(localRoot.value)) as ContainerNode
        toast.show({
            message: "Änderungen an der Aufteilung verworfen",
            undoLabel: "Speichern",
            undo: () => save(draft),
        })
    }
    emit("close")
}

// ── Computed ──────────────────────────────────────────────────────────────────

const zoneCountLabel = computed(() => zoneCount(localRoot.value ? collectLeaves(localRoot.value).length : 0))
</script>
