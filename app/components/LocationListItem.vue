<template>
    <div class="bg-bg-surface border border-border-subtle flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors hover:border-border cursor-pointer group"
        :class="isContainer ? 'border-l-2 border-l-accent/40' : ''" @click="$emit('click')">

        <div class="flex items-center gap-2 min-w-0 flex-1">
            <!-- Tree indent arrow -->
            <span v-if="(indent ?? 0) > 0" class="text-text-muted shrink-0">
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
                    <span v-if="isContainer" class="text-accent/70 font-['DM_Mono']">Container</span>
                    <span v-if="itemCount" class="text-text-muted">
                        {{ itemCount }} Gegenstand{{ itemCount !== 1 ? 'e' : '' }}
                    </span>
                </span>
            </div>
        </div>

        <!-- Action buttons (always visible on mobile) -->
        <div class="flex gap-1 shrink-0 ml-2" @click.stop>
            <button
                class="w-9 h-9 rounded-lg bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all active:scale-95 hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"
                title="Unterort hinzufügen" @click.stop="$emit('addChild')">
                <IconPlus :size="15" />
            </button>
            <button
                class="w-9 h-9 rounded-lg bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all active:scale-95 hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"
                title="Umbenennen" @click.stop="$emit('rename')">
                <IconPen :size="15" />
            </button>
            <button
                class="w-9 h-9 rounded-lg bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all active:scale-95 hover:bg-danger hover:text-white hover:border-danger"
                title="Löschen" @click.stop="$emit('delete')">
                <IconTrash :size="15" />
            </button>
        </div>
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
}>()

defineEmits<{
    click: []
    addChild: []
    rename: []
    delete: []
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
