<template>
    <!--
        A plain <NuxtLink>, not <component :is="'NuxtLink'">: resolving a global
        component from a string silently falls back to a custom element, which
        renders a dead <nuxtlink> tag with no href.

        Same surface, border and type as an item row on purpose — a place is set
        apart by the size of its plan, not by a palette of its own.
    -->
    <NuxtLink :to="to"
        class="group flex items-center gap-3 w-full text-left bg-bg-surface border border-border rounded-2xl px-3 py-3 transition-all duration-150 cursor-pointer hover:border-accent/50 hover:bg-bg-elevated active:scale-[0.99]">

        <LocationGlyph :container="container" :own="counts.own" :child-count="childCount" :size="glyphSize" />

        <div class="flex-1 min-w-0">
            <div class="font-['Syne'] text-[15px] font-bold text-text-primary leading-tight truncate">
                <template v-if="query">
                    <span v-for="(part, i) in highlightParts(location.name, query)" :key="i"
                        :class="part.match ? 'text-accent bg-accent-dim rounded-sm px-px' : ''">{{ part.text }}</span>
                </template>
                <template v-else>{{ location.name }}</template>
            </div>

            <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-text-muted">
                <span v-if="container" class="inline-flex items-center gap-1 text-accent">
                    <IconLayoutGrid :size="11" />
                    {{ zoneCount(zones) }}
                </span>
                <span v-else-if="childCount">{{ subLocationCount(childCount) }}</span>
                <span v-if="counts.total">{{ itemCount(counts.total) }}</span>
                <span v-else class="italic">leer</span>
                <span v-if="showPath && parentPath" class="w-full truncate text-text-muted/70">{{ parentPath }}</span>
            </div>
        </div>

        <IconChevronRight :size="18"
            class="shrink-0 text-text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
    </NuxtLink>
</template>

<script setup lang="ts">
import type { Location } from "~/types"
import { highlightParts } from "~/utils/highlight"
import { collectLeaves } from "~/repositories/containerRepository"
import { itemCount, subLocationCount, zoneCount } from "~/utils/plural"

const props = withDefaults(defineProps<{
    location: Location
    /** Target route for this card. */
    to: string
    query?: string
    showPath?: boolean
    /** Edge length of the plan thumbnail — big enough that splits stay readable. */
    glyphSize?: number
}>(), { showPath: false, glyphSize: 60 })

const { containerOf, countsOf, childrenOf, ancestorsOf } = useTopology()

const container = computed(() => containerOf(props.location.id))
const counts = computed(() => countsOf(props.location.id))
const childCount = computed(() => childrenOf(props.location.id).length)
const zones = computed(() => (container.value ? collectLeaves(container.value.rootNode).length : 0))

const parentPath = computed(() =>
    ancestorsOf(props.location.id).slice(0, -1).map((l) => l.name).join(" › ")
)
</script>
