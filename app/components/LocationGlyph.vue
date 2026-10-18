<template>
    <!-- A container shows its compartment layout as a square schematic. -->
    <ZoneMap v-if="container" :container="container" :item-counts="itemCountByLocation" compact :size="size" />

    <!-- A location with sub-locations: nested frames, reads as "goes deeper". -->
    <svg v-else-if="childCount > 0" :width="size" :height="size" viewBox="0 0 40 40" class="shrink-0"
        role="img" :aria-label="`${childCount} Unterorte`">
        <rect x="2.5" y="2.5" width="35" height="35" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <rect x="8.5" y="8.5" width="23" height="23" rx="4" fill="none" stroke="var(--text-muted)" stroke-width="1.2"
            opacity="0.7" />
        <rect x="14.5" y="14.5" width="11" height="11" rx="2.5" fill="none"
            :stroke="own > 0 ? 'var(--accent)' : 'var(--text-muted)'" stroke-width="1.2"
            :opacity="own > 0 ? 1 : 0.45" />
    </svg>

    <!-- A plain place like "unterm Bett": one dot per item, so a glance gives the load. -->
    <svg v-else :width="size" :height="size" viewBox="0 0 40 40" class="shrink-0" role="img"
        :aria-label="`${own} Gegenstände`">
        <rect x="2.5" y="2.5" width="35" height="35" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
        <g>
            <circle v-for="(dot, i) in dots" :key="i" :cx="dot.cx" :cy="dot.cy" r="2.4"
                :fill="dot.on ? 'var(--accent)' : 'var(--border)'" />
        </g>
    </svg>
</template>

<script setup lang="ts">
import type { Container } from "~/types/container"

const props = withDefaults(defineProps<{
    container?: Container
    /** Items directly in this location. */
    own?: number
    /** Sub-locations, container zones not counted. */
    childCount?: number
    size?: number
}>(), {
    own: 0,
    childCount: 0,
    size: 40,
})

const { itemCountByLocation } = useTopology()

/** A 3x3 field: filled dots stand for items, up to nine. */
const dots = computed(() => {
    const filled = Math.min(props.own, 9)
    return Array.from({ length: 9 }, (_, i) => ({
        cx: 11 + (i % 3) * 9,
        cy: 11 + Math.floor(i / 3) * 9,
        on: i < filled,
    }))
})
</script>
