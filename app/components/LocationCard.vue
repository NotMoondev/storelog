<template>
    <!--
        LocationRow. A plain <NuxtLink>, not <component :is="'NuxtLink'">: resolving
        a global component from a string silently falls back to a custom element,
        which renders a dead <nuxtlink> tag with no href.

        Set apart from an item row by shape (taller, larger radius, chevron), not
        by colour. A long press opens this place's actions without opening it.
    -->
    <NuxtLink :to="to"
        class="group flex items-center gap-3 w-full min-h-20 p-3 text-left bg-bg-surface border border-border rounded-lg cursor-pointer select-none [-webkit-touch-callout:none] transition-[background-color,border-color] duration-150 hover:border-accent/50 hover:bg-bg-elevated active:bg-bg-hover"
        v-on="longPress.listeners" @click.capture="onClick">

        <LocationGlyph :container="container" :own="counts.own" :child-count="childCount" :size="glyphSize" />

        <div class="flex-1 min-w-0 flex flex-col gap-1">
            <div class="font-name text-title-sm text-text-primary truncate">
                <template v-if="query">
                    <span v-for="(part, i) in highlightParts(location.name, query)" :key="i"
                        :class="part.match ? 'text-accent-text bg-accent-dim rounded-[3px]' : ''">{{ part.text }}</span>
                </template>
                <template v-else>{{ location.name }}</template>
            </div>

            <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-caption text-text-muted tabular-nums">
                <span v-if="container" class="inline-flex items-center gap-1 text-accent-text">
                    <LayoutGrid :size="12" />
                    {{ zoneCount(zones) }}
                </span>
                <span v-else-if="childCount">{{ subLocationCount(childCount) }}</span>
                <span v-if="counts.total">{{ itemCount(counts.total) }}</span>
                <span v-else>leer</span>
            </div>
            <div v-if="showPath && parentPath" class="text-meta text-text-muted truncate">{{ parentPath }}</div>
        </div>

        <ChevronRight :size="20"
            class="shrink-0 text-text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
    </NuxtLink>
</template>

<script setup lang="ts">
import { ChevronRight, LayoutGrid } from "lucide-vue-next"
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
}>(), { showPath: false, glyphSize: 56 })

const emit = defineEmits<{ longpress: [] }>()

const { containerOf, countsOf, childrenOf, ancestorsOf } = useTopology()

const longPress = useLongPress(() => emit("longpress"))

/** Capture phase, so the router never sees the click that ends a long press. */
function onClick(e: MouseEvent) {
    if (longPress.consumeClick()) {
        e.preventDefault()
        e.stopPropagation()
    }
}

const container = computed(() => containerOf(props.location.id))
const counts = computed(() => countsOf(props.location.id))
const childCount = computed(() => childrenOf(props.location.id).length)
const zones = computed(() => (container.value ? collectLeaves(container.value.rootNode).length : 0))

const parentPath = computed(() =>
    ancestorsOf(props.location.id).slice(0, -1).map((l) => l.name).join(" › ")
)
</script>
