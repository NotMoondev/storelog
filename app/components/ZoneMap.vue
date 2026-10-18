<template>
    <div class="overflow-hidden bg-bg-elevated shrink-0" :class="frameClass" :style="sizeStyle">
        <ZoneMapNode :node="container.rootNode" :item-counts="itemCounts" :highlight-id="highlightId"
            :interactive="interactive" :compact="compact" :labels="showLabels" @select="$emit('select', $event)" />
    </div>
</template>

<script setup lang="ts">
import type { Container } from "~/types/container"

const props = withDefaults(defineProps<{
    container: Container
    itemCounts?: Record<string, number>
    highlightId?: string | null
    interactive?: boolean
    /** Label-free square thumbnail instead of the true-to-scale plan. */
    compact?: boolean
    /** Edge length of the thumbnail in pixels. Ignored unless `compact`. */
    size?: number
    /** Ceiling for the full-size plan so a tall shelf cannot fill the screen. */
    maxHeight?: string
    /** Zone names. Defaults to on for the full plan, off for thumbnails. */
    labels?: boolean
}>(), {
    itemCounts: () => ({}),
    highlightId: null,
    interactive: false,
    compact: false,
    size: 40,
    maxHeight: "min(46dvh, 420px)",
    labels: undefined,
})

defineEmits<{ select: [locationId: string] }>()

const showLabels = computed(() => props.labels ?? !props.compact)

const frameClass = computed(() =>
    props.compact
        ? "rounded-sm border border-border"
        : "rounded-lg border border-border"
)

/**
 * A thumbnail is a schematic, not a scale drawing: it always fills the same
 * square. Inheriting real proportions made a 1:4 wardrobe 136px tall in a list
 * row and squashed a 3:2 shelf to a 23px sliver — in both cases the highlighted
 * compartment became unreadable. The splits stay proportional inside the square,
 * so "third band from the top" still reads correctly.
 *
 * The full plan keeps true proportions, capped on the axis that would otherwise
 * overflow: binding both axes at once would squash the layout instead of fitting it.
 */
const sizeStyle = computed(() => {
    const { width, height } = props.container.dimensions
    if (props.compact) {
        return { width: `${props.size}px`, height: `${props.size}px` }
    }
    const ratio = `${width} / ${height}`
    return height > width
        ? { aspectRatio: ratio, height: props.maxHeight, width: "auto", marginInline: "auto" }
        : { aspectRatio: ratio, width: "100%", maxHeight: props.maxHeight }
})
</script>
