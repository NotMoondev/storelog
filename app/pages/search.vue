<template>
    <div class="flex flex-col h-full relative">

        <!-- Search bar -->
        <div class="px-4 pt-3 pb-2 shrink-0 flex items-center gap-2">
            <div
                class="flex-1 flex items-center gap-2.5 bg-bg-surface border border-border rounded-[10px] px-3.5 h-12 transition-all duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                <span class="text-text-muted shrink-0">
                    <IconSearch :size="16" />
                </span>
                <input ref="inputRef" v-model="query" type="search" placeholder="Suchen..." autocomplete="off"
                    autocorrect="off" spellcheck="false"
                    class="flex-1 bg-transparent border-none outline-none text-[15px] tracking-[0.02em] text-text-primary placeholder:text-text-muted" />
                <button v-if="query" @click="clearQuery"
                    class="bg-transparent border-none text-text-muted cursor-pointer text-sm p-1 rounded transition-colors hover:text-text-secondary">✕</button>
            </div>
            <button @click="isAddSheetOpen = true"
                class="hidden lg:flex items-center gap-1.5 h-12 px-4 bg-accent text-black rounded-xl border-none cursor-pointer text-[13px] font-medium shrink-0 transition-all hover:brightness-110 active:scale-95">
                <IconPlus :size="15" />
                Neu
            </button>
        </div>

        <!-- Count -->
        <div class="px-4 pb-2 text-[12px] text-text-secondary/70 tracking-wider uppercase shrink-0">
            <span v-if="!query">{{ items.length }} Gegenstände gespeichert</span>
            <span v-else>{{ results.length }} Ergebnis{{ results.length !== 1 ? 'se' : '' }}</span>
        </div>

        <!-- Results -->
        <div ref="listRef" class="flex-1 overflow-y-auto px-4 pb-24 lg:pb-8">
            <TransitionGroup name="result-list" tag="div" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 lg:gap-2">
                <div v-for="item in results" :key="item.id"
                    class="px-4 py-3.5 lg:px-5 lg:py-4 bg-bg-surface border border-border-subtle rounded-[10px] cursor-pointer transition-all duration-150 select-none animate-fade-in hover:border-border hover:bg-bg-elevated hover:-translate-y-px active:-translate-y-px active:border-border active:bg-bg-elevated"
                    @click="openItem(item)">
                    <div class="mb-1.5">
                        <span class="font-['Syne'] text-[15px] lg:text-[16px] font-semibold text-text-primary leading-[1.3]">{{
                            item.name }}</span>
                    </div>
                    <div v-if="item.note" class="text-[12px] text-text-muted italic mb-2 line-clamp-1">{{ item.note }}</div>
                    <div class="flex items-center flex-wrap gap-1">
                        <span v-for="(seg, i) in item.locationNames" :key="i"
                            class="text-[12px] text-accent tracking-[0.02em] flex items-center gap-1">
                            <span v-if="i > 0" class="text-text-muted">
                                <IconChevronRight :size="10" />
                            </span>
                            {{ seg }}
                        </span>
                    </div>
                </div>
            </TransitionGroup>

            <!-- Empty state -->
            <div v-if="results.length === 0 && !loading"
                class="flex flex-col items-center justify-center py-20 px-6 text-center gap-2.5">
                <div class="text-text-muted mb-2">
                    <IconPackageOpen :size="64" />
                </div>
                <div class="font-['Syne'] text-[18px] font-semibold text-text-secondary">
                    {{ query ? 'Nichts gefunden' : 'Noch keine Gegenstände' }}
                </div>
                <div class="text-[13px] text-text-muted max-w-65 leading-relaxed">
                    {{ query ? `Kein Gegenstand für „${query}" gefunden.` : 'Tippe auf + um deinen ersten Gegenstand hinzuzufügen.' }}
                </div>
            </div>
        </div>

        <!-- FAB (mobile only) -->
        <button @click="isAddSheetOpen = true"
            class="lg:hidden fixed bottom-24 right-5 w-14 h-14 rounded-full bg-accent text-black text-[26px] border-none cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(74,222,128,0.4)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 animate-[pulse-accent_3s_ease_infinite] hover:scale-[1.08] hover:shadow-[0_6px_28px_rgba(74,222,128,0.55)] active:scale-95">
            <span class="leading-none -mt-0.5">+</span>
        </button>

        <!-- Item Detail Sheet -->
        <ItemDetailSheet v-if="selectedItem" :item="selectedItem" @close="selectedItem = null"
            @deleted="selectedItem = null" />

        <AddItemSheet v-if="isAddSheetOpen" @close="isAddSheetOpen = false" @saved="isAddSheetOpen = false" />
    </div>
</template>

<script setup lang="ts">
import type { ItemWithPath } from "~/types"
import { useSearch } from "~/composables/useSearch"
import { useItems } from "~/composables/useItems"

defineEmits<{
    "add-item": []
}>()

const { items, loading, load: loadItems } = useItems()
const { query, results, clearQuery } = useSearch()
const { load: loadLocations } = useLocations()
const inputRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const selectedItem = ref<ItemWithPath | null>(null)

const isAddSheetOpen = ref(false)

function openItem(item: ItemWithPath) {
    selectedItem.value = item
}

onMounted(() => {
    loadItems()
    loadLocations()
    nextTick(() => inputRef.value?.focus())
})
</script>

<style>
.result-list-move {
    transition: transform 0.2s ease
}
</style>
