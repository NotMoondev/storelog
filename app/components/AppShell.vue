<template>
    <div class="app-shell">
        <!-- Header -->
        <header class="app-header">
            <div class="header-brand">
                <span class="brand-icon">
                    <img src="/icons/icon-192.png" width="18" height="18" />
                </span>
                <span class="brand-name">STORELOG</span>
            </div>
            <nav class="header-nav">
                <button v-for="tab in tabs" :key="tab.id" class="nav-tab" :class="{ active: activeTab === tab.id }"
                    @click="$emit('tab-change', tab.id)">
                    <component :is="tab.icon" :size="16" class="nav-icon" />
                    <span class="nav-label" v-if="tab.label">{{ tab.label }}</span>
                </button>
            </nav>
        </header>

        <!-- Content -->
        <main class="app-content">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { Search, MapPin, Settings } from 'lucide-vue-next'

defineProps<{
    activeTab: string;
}>();

defineEmits<{
    "tab-change": [tab: string];
}>();

const tabs = [
    { id: "search", label: "Suche", icon: Search },
    { id: "locations", label: "Orte", icon: MapPin },
    { id: "settings", icon: Settings },
];
</script>

<style scoped>
.app-shell {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--bg);
    overflow: hidden;
}

.app-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 52px;
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg);
    position: relative;
    z-index: 10;
}

.header-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: "Syne", sans-serif;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.1em;
    color: var(--text-primary);
}

.brand-icon {
    color: var(--accent);
    font-size: 20px;
}

.header-nav {
    display: flex;
    gap: 2px;
}

.nav-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-family: "DM Mono", monospace;
    font-size: 14px;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.03em;
}

.nav-tab:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
}

.nav-tab.active {
    background: var(--accent-dim);
    color: var(--accent);
}

.nav-icon {
    font-size: 16px;
}

.app-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
</style>
