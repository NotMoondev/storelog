<template>
    <!-- Opens the location picker; shows the full path with the target in accent. -->
    <button type="button"
        class="flex items-center gap-3 w-full min-h-13 py-2 pl-4 pr-3 rounded-md bg-bg-elevated border text-left cursor-pointer transition-colors hover:border-border-strong"
        :class="locationId ? 'border-accent/55' : 'border-border'">
        <span v-if="segments.length" class="flex-1 min-w-0 flex flex-wrap items-center gap-x-1 text-meta text-text-secondary">
            <template v-for="(seg, i) in segments" :key="i">
                <ChevronRight v-if="i > 0" :size="12" class="text-text-muted" />
                <span :class="i === segments.length - 1 ? 'font-medium text-accent-text' : ''">{{ seg }}</span>
            </template>
        </span>
        <span v-else class="flex-1 text-body text-text-muted">{{ placeholder }}</span>
        <ChevronRight :size="18" class="text-text-muted shrink-0" />
    </button>
</template>

<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next"

const props = defineProps<{
    locationId: string | null
    placeholder: string
    /** An empty value is a valid answer (e.g. "Oberste Ebene"). */
    allowEmpty?: boolean
}>()

const { getLocationPath } = useTopology()

const segments = computed(() => (props.locationId ? getLocationPath(props.locationId) : []))
</script>
