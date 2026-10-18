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
        :aria-pressed="interactive ? isHighlighted : undefined"
        class="w-full h-full flex items-start gap-1 border-none m-0 text-left overflow-hidden transition-colors"
        :class="[leafClass, labels ? 'px-2 py-1' : 'p-0', interactive && node.locationId ? 'cursor-pointer' : 'cursor-default']"
        @click="node.locationId && $emit('select', node.locationId)">
        <!-- Name and count share one line, so even a thin drawer reads -->
        <template v-if="labels">
            <span class="flex-1 min-w-0 text-caption truncate" :class="labelClass">{{ node.name }}</span>
            <span v-if="count" class="shrink-0 text-caption font-semibold tabular-nums" :class="countClass">{{ count }}</span>
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

/**
 * Highlighted: tinted fill with a 2px accent ring (the compartment meant).
 * Thumbnails keep a solid accent fill, which stays readable at 40px.
 */
const leafClass = computed(() => {
    if (isHighlighted.value) {
        return props.compact ? "bg-accent" : "bg-accent-dim shadow-[inset_0_0_0_2px_var(--accent)]"
    }
    if (props.compact) return count.value > 0 ? "bg-accent/30" : "bg-bg-surface"
    return "bg-bg-elevated hover:bg-bg-hover"
})

const labelClass = computed(() => (isHighlighted.value ? "text-accent-text font-semibold" : "text-text-secondary font-medium"))
const countClass = computed(() => (isHighlighted.value ? "text-accent-text" : "text-text-muted"))
</script>
