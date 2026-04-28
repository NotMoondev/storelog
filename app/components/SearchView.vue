<template>
    <div class="search-view">
        <!-- Search bar -->
        <div class="search-bar-container">
            <div class="search-bar">
                <span class="search-icon">
                    <IconSearch :size="16" />
                </span>
                <input ref="inputRef" v-model="query" type="text" placeholder="Suchen..." class="search-input"
                    autocomplete="off" autocorrect="off" spellcheck="false" />
                <button v-if="query" class="search-clear" @click="clearQuery">✕</button>
            </div>
        </div>

        <!-- Count -->
        <div class="results-meta">
            <span v-if="!query">{{ items.length }} Gegenstände gespeichert</span>
            <span v-else>{{ results.length }} Ergebnis{{ results.length !== 1 ? 'se' : '' }}</span>
        </div>

        <!-- Results -->
        <div class="results-list" ref="listRef">
            <TransitionGroup name="result-list" tag="div">
                <div v-for="item in results" :key="item.id" class="result-item stagger-item animate-fade-in"
                    @click="openItem(item)">
                    <div class="result-main">
                        <span class="result-name">{{ item.name }}</span>
                        <span v-if="item.note" class="result-note">{{ item.note }}</span>
                    </div>
                    <div class="result-path">
                        <span v-for="(seg, i) in item.locationNames" :key="i" class="path-segment">
                            <span v-if="i > 0" class="path-sep">
                                <IconChevronRight :size="10" />
                            </span>
                            {{ seg }}
                        </span>
                    </div>
                </div>
            </TransitionGroup>

            <!-- Empty state -->
            <div v-if="results.length === 0 && !loading" class="empty-state">
                <div class="empty-icon">
                    <IconPackageOpen :size="64" />
                </div>
                <div class="empty-title">
                    {{ query ? 'Nichts gefunden' : 'Noch keine Gegenstände' }}
                </div>
                <div class="empty-sub">
                    {{
                        query
                            ? `Kein Gegenstand für „${query}" gefunden.`
                            : 'Tippe auf + um deinen ersten Gegenstand hinzuzufügen.'
                    }}
                </div>
            </div>
        </div>

        <!-- FAB -->
        <button class="fab" @click="$emit('add-item')">
            <span class="fab-icon">+</span>
        </button>

        <!-- Item Detail Modal -->
        <ItemDetailModal v-if="selectedItem" :item="selectedItem" @close="selectedItem = null"
            @deleted="selectedItem = null" />
    </div>
</template>

<script setup lang="ts">
import type { ItemWithPath } from "~/types";
import { useSearch } from "~/composables/useSearch";
import { useItems } from "~/composables/useItems";

defineEmits<{
    "add-item": [];
}>();

const { items, loading } = useItems();
const { query, results, clearQuery } = useSearch();
const inputRef = ref<HTMLInputElement>();
const listRef = ref<HTMLElement>();
const selectedItem = ref<ItemWithPath | null>(null);

function openItem(item: ItemWithPath) {
    selectedItem.value = item;
}

onMounted(() => {
    nextTick(() => inputRef.value?.focus());
});
</script>

<style scoped>
.search-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
}

.search-bar-container {
    padding: 12px 16px 8px;
    flex-shrink: 0;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0 14px;
    height: 48px;
    transition: border-color 0.15s ease;
}

.search-bar:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
}

.search-icon {
    color: var(--text-muted);
    font-size: 20px;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: "DM Mono", monospace;
    font-size: 15px;
    color: var(--text-primary);
    letter-spacing: 0.02em;
}

.search-input::placeholder {
    color: var(--text-muted);
}

.search-clear {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.1s;
}

.search-clear:hover {
    color: var(--text-secondary);
}

.results-meta {
    padding: 0 16px 8px;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    flex-shrink: 0;
}

.results-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 100px;
}

.result-item {
    padding: 14px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    -webkit-user-select: none;
    user-select: none;
}

.result-item:hover,
.result-item:active {
    border-color: var(--border);
    background: var(--bg-elevated);
    transform: translateY(-1px);
}

.result-main {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
}

.result-name {
    font-family: "Syne", sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
}

.result-note {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
}

.result-path {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px;
}

.path-segment {
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    gap: 3px;
}

.path-sep {
    color: var(--text-muted);
    margin-right: 3px;
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    gap: 10px;
}

.empty-icon {
    font-size: 40px;
    color: var(--text-muted);
    margin-bottom: 8px;
}

.empty-title {
    font-family: "Syne", sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-secondary);
}

.empty-sub {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 260px;
    line-height: 1.7;
}

/* FAB */
.fab {
    position: fixed;
    bottom: 28px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 26px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(69, 163, 102, 0.4);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 50;
    animation: pulse-accent 3s ease infinite;
}

.fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(69, 163, 102, 0.55);
}

.fab:active {
    transform: scale(0.95);
}

.fab-icon {
    line-height: 1;
    margin-top: -2px;
}

/* Transition */
.result-list-move {
    transition: transform 0.2s ease;
}
</style>
