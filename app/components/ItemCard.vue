<template>
    <!-- ItemRow: tap opens the item, a long press starts selecting. -->
    <button type="button"
        class="flex items-center gap-3 w-full min-h-16 p-3 text-left border rounded-md cursor-pointer select-none [-webkit-touch-callout:none] transition-[background-color,border-color] duration-150"
        :class="selected
            ? 'bg-accent-dim border-accent'
            : 'bg-bg-surface border-border-subtle hover:bg-bg-elevated hover:border-border active:bg-bg-hover'"
        :aria-pressed="selectable ? selected : undefined" v-on="longPress.listeners" @click="onClick">

        <!-- Checkbox while selecting, otherwise the compartment thumbnail -->
        <span v-if="selectable"
            class="size-6 rounded-sm border-2 shrink-0 flex items-center justify-center transition-colors"
            :class="selected ? 'bg-accent border-accent text-on-accent' : 'border-border-strong text-transparent'">
            <Check :size="16" />
        </span>
        <ZoneMap v-else-if="showMap && item.container" :container="item.container"
            :highlight-id="item.zoneLocationId" compact :size="40" />
        <span v-else-if="showMap"
            class="shrink-0 size-10 rounded-sm border border-border bg-bg-elevated flex items-center justify-center text-text-muted">
            <Box :size="16" />
        </span>

        <span class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="font-name text-title-sm text-text-primary truncate">
                <template v-if="query">
                    <span v-for="(part, i) in highlightParts(item.name, query)" :key="i"
                        :class="part.match ? 'text-accent-text bg-accent-dim rounded-[3px]' : ''">{{ part.text }}</span>
                </template>
                <template v-else>{{ item.name }}</template>
            </span>

            <span v-if="item.note" class="text-meta text-text-muted truncate">{{ item.note }}</span>

            <span v-if="showPath" class="flex items-center flex-wrap gap-x-1 text-meta text-text-secondary">
                <template v-for="(seg, i) in pathSegments" :key="i">
                    <ChevronRight v-if="i > 0" :size="12" class="text-text-muted" />
                    <span :class="i === pathSegments.length - 1 ? 'font-medium text-accent-text' : ''">{{ seg }}</span>
                </template>
            </span>
        </span>

        <UserBadge v-if="showAuthor" :user-id="item.createdBy" :show-name="false" class="shrink-0" />
    </button>
</template>

<script setup lang="ts">
import { Box, Check, ChevronRight } from "lucide-vue-next"
import type { ItemView } from "~/types"
import { highlightParts } from "~/utils/highlight"

const props = withDefaults(defineProps<{
    item: ItemView
    query?: string
    /** Show the full location breadcrumb — on for search, off inside a location. */
    showPath?: boolean
    /** Show the container thumbnail with the zone spotlighted. */
    showMap?: boolean
    selectable?: boolean
    selected?: boolean
    showAuthor?: boolean
}>(), {
    showPath: false,
    showMap: true,
    selectable: false,
    selected: false,
    showAuthor: false,
})

const emit = defineEmits<{ activate: []; longpress: [] }>()

const longPress = useLongPress(() => emit("longpress"))

function onClick() {
    if (longPress.consumeClick()) return
    emit("activate")
}

/** Drop the leading room when the path is long, so the tail stays readable. */
const pathSegments = computed(() => {
    const names = props.item.locationNames
    return names.length > 3 ? names.slice(names.length - 3) : names
})
</script>
