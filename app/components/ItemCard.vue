<template>
    <button type="button"
        class="flex items-start gap-3 w-full text-left border rounded-xl px-3 py-2.5 transition-all duration-150 cursor-pointer"
        :class="selected
            ? 'bg-accent-dim border-accent'
            : 'bg-bg-surface border-border-subtle hover:border-border hover:bg-bg-elevated'"
        :aria-pressed="selectable ? selected : undefined" @click="$emit('activate')">

        <!-- Selection marker in move mode, otherwise the zone thumbnail -->
        <span v-if="selectable"
            class="mt-0.5 w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-colors"
            :class="selected ? 'bg-accent border-accent text-black' : 'border-border text-transparent'">
            <IconCheck :size="13" />
        </span>
        <ZoneMap v-else-if="showMap && item.container" :container="item.container"
            :highlight-id="item.zoneLocationId" compact :size="40" class="mt-0.5" />
        <span v-else-if="showMap"
            class="shrink-0 mt-0.5 w-10 h-10 rounded-md border border-border bg-bg-elevated flex items-center justify-center text-text-muted">
            <IconBox :size="16" />
        </span>

        <span class="flex-1 min-w-0">
            <span class="block font-['Syne'] text-[14px] font-semibold text-text-primary leading-snug truncate">
                <template v-if="query">
                    <span v-for="(part, i) in highlightParts(item.name, query)" :key="i"
                        :class="part.match ? 'text-accent bg-accent-dim rounded-sm px-px' : ''">{{ part.text }}</span>
                </template>
                <template v-else>{{ item.name }}</template>
            </span>

            <span v-if="item.note" class="block text-[11.5px] text-text-muted italic truncate mt-0.5">{{ item.note }}</span>

            <span v-if="showPath" class="flex items-center flex-wrap gap-x-1 mt-1">
                <span v-for="(seg, i) in pathSegments" :key="i" class="text-[11px] text-accent flex items-center gap-1">
                    <IconChevronRight v-if="i > 0" :size="9" class="text-text-muted" />
                    {{ seg }}
                </span>
            </span>
        </span>

        <UserBadge v-if="showAuthor" :user-id="item.createdBy" :show-name="false" class="shrink-0 mt-0.5" />
    </button>
</template>

<script setup lang="ts">
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

defineEmits<{ activate: [] }>()

/** Drop the leading room when the path is long, so the tail stays readable. */
const pathSegments = computed(() => {
    const names = props.item.locationNames
    return names.length > 3 ? names.slice(names.length - 3) : names
})
</script>
