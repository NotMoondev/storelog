<template>
    <div class="bg-bg-surface border flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
        :class="[
            isContainer ? 'border-l-2 border-l-accent/40' : '',
            selected ? 'border-accent/40 bg-accent-dim' : 'border-border-subtle hover:border-border'
        ]" @click="$emit('click')">

        <div class="flex items-center gap-2 min-w-0 flex-1">
            <!-- Collapse toggle (chevron only) -->
            <button v-if="hasChildren" @click.stop="$emit('toggleCollapse')"
                class="shrink-0 text-text-muted hover:text-text-primary flex items-center cursor-pointer bg-transparent border-none p-1 -ml-1 rounded"
                :class="(indent ?? 0) > 0 ? '' : ''">
                <IconChevronRight :size="14" class="transition-transform duration-150" :class="collapsed ? '' : 'rotate-90'" />
            </button>

            <!-- Tree indent arrow (only when no children) -->
            <span v-else-if="(indent ?? 0) > 0" class="text-text-muted shrink-0">
                <IconCornerDownRight :size="12" />
            </span>

            <!-- Icon -->
            <span class="shrink-0" :class="isContainer ? 'text-accent' : 'text-accent'">
                <IconLayoutGrid v-if="isContainer" :size="(indent ?? 0) > 0 ? 14 : 16" />
                <IconMapPin v-else-if="indent === 0" :size="16" />
                <IconBox v-else :size="14" />
            </span>

            <!-- Text -->
            <div class="flex flex-col min-w-0">
                <span class="text-[16px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis leading-snug">
                    <!-- Highlighted search match -->
                    <template v-if="searchQuery">
                        <span v-for="(part, i) in highlightMatch(loc.name, searchQuery)" :key="i"
                            :class="part.match ? 'text-accent bg-accent-dim rounded-sm px-px' : ''">{{ part.text
                            }}</span>
                    </template>
                    <template v-else>{{ loc.name }}</template>
                </span>

                <!-- Path in search mode -->
                <span v-if="searchQuery && locationPath.length > 1"
                    class="text-[12px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                    {{ locationPath.slice(0, -1).join(' / ') }}
                </span>

                <!-- Sub-label -->
                <span class="text-[12px] tracking-[0.02em] flex items-center gap-1.5 mt-0.5">
                    <span v-if="isContainer" class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold tracking-wide">Container</span>
                    <span v-if="itemCount" class="text-text-muted">
                        {{ itemCount }} Gegenstand{{ itemCount !== 1 ? 'e' : '' }}
                    </span>
                </span>
            </div>
        </div>

        <!-- Action buttons removed — actions are contextual in detail panel/sheet -->
    </div>
</template>

<script setup lang="ts">
interface Loc {
    id: string
    name: string
    parentId?: string | null
    indent?: number
}

interface TextPart { text: string; match: boolean }

const props = defineProps<{
    loc: Loc
    isContainer: boolean
    itemCount?: number
    searchQuery?: string
    locationPath: string[]
    indent?: number
    hasChildren?: boolean
    collapsed?: boolean
    selected?: boolean
}>()

defineEmits<{
    click: []
    toggleCollapse: []
}>()

function highlightMatch(text: string, query: string): TextPart[] {
    if (!query) return [{ text, match: false }]
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return [{ text, match: false }]
    return [
        { text: text.slice(0, idx), match: false },
        { text: text.slice(idx, idx + query.length), match: true },
        { text: text.slice(idx + query.length), match: false },
    ].filter(p => p.text.length > 0)
}
</script>
