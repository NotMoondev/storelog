<template>
    <!-- Split node -->
    <div v-if="node.type !== 'leaf'" class="flex w-full h-full overflow-hidden"
        :class="node.type === 'vsplit' ? 'flex-row' : 'flex-col'">
        <div class="shrink-0 overflow-hidden" :style="aStyle">
            <ZoneMapNode :node="node.children[0]" :item-counts="itemCounts" :highlight-id="highlightId"
                :interactive="interactive" :compact="compact" :labels="labels" @select="$emit('select', $event)" />
        </div>
        <!--
            The divider has to hold its own against three different cell fills
            (empty, filled, highlighted) in both themes, so it is drawn from the
            muted text colour rather than a background token.
        -->
        <div class="shrink-0" :class="[
            node.type === 'vsplit' ? 'w-px' : 'h-px',
            compact ? 'bg-text-muted/55' : 'bg-text-muted/35',
        ]" />
        <div class="flex-1 min-w-0 min-h-0 overflow-hidden">
            <ZoneMapNode :node="node.children[1]" :item-counts="itemCounts" :highlight-id="highlightId"
                :interactive="interactive" :compact="compact" :labels="labels" @select="$emit('select', $event)" />
        </div>
    </div>

    <!-- Leaf zone -->
    <button v-else type="button" :disabled="!interactive || !node.locationId" :title="compact ? node.name : undefined"
        class="w-full h-full flex flex-col items-center justify-center gap-0.5 border-none p-0 m-0 transition-colors"
        :class="[leafClass, interactive && node.locationId ? 'cursor-pointer' : 'cursor-default']"
        @click="node.locationId && $emit('select', node.locationId)">
        <template v-if="labels">
            <span class="text-[10px] leading-tight text-center px-1 max-w-full truncate" :class="labelClass">
                {{ node.name }}
            </span>
            <span v-if="count"
                class="text-[9px] leading-none rounded-full px-1.5 py-0.5 tabular-nums"
                :class="isHighlighted ? 'bg-black/25 text-black' : 'bg-accent-dim text-accent'">
                {{ count }}
            </span>
        </template>
    </button>
</template>

<script setup lang="ts">
import type { ContainerNode } from "~/types/container"

const props = withDefaults(defineProps<{
    node: ContainerNode
    itemCounts?: Record<string, number>
    /** Location id of the zone to spotlight (search hit / active zone). */
    highlightId?: string | null
    interactive?: boolean
    /** Label-free rendering for thumbnails. */
    compact?: boolean
    /** Draw zone names and counts. Off wherever the cells are too narrow to read. */
    labels?: boolean
}>(), {
    itemCounts: () => ({}),
    highlightId: null,
    interactive: false,
    compact: false,
    labels: true,
})

defineEmits<{ select: [locationId: string] }>()

const aStyle = computed(() => {
    if (props.node.type === "leaf") return {}
    const n = props.node
    return n.type === "vsplit"
        ? { width: `${n.splitPos * 100}%`, height: "100%" }
        : { height: `${n.splitPos * 100}%`, width: "100%" }
})

const count = computed(() =>
    props.node.type === "leaf" && props.node.locationId
        ? (props.itemCounts[props.node.locationId] ?? 0)
        : 0
)

const isHighlighted = computed(() =>
    props.node.type === "leaf" && !!props.node.locationId && props.node.locationId === props.highlightId
)

const leafClass = computed(() => {
    if (isHighlighted.value) return "bg-accent"
    if (count.value > 0) {
        return props.compact
            ? "bg-accent/30"
            : "bg-accent-dim hover:bg-accent/25"
    }
    return props.compact
        ? "bg-bg-surface"
        : "bg-bg-surface hover:bg-bg-elevated"
})

const labelClass = computed(() => {
    if (isHighlighted.value) return "text-black font-semibold"
    return count.value > 0 ? "text-accent" : "text-text-muted"
})
</script>
