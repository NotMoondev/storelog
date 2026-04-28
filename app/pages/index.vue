<template>
    <AppShell :active-tab="activeTab" @tab-change="activeTab = $event">
        <Transition name="view" mode="out-in">
            <SearchView v-if="activeTab === 'search'" key="search" @add-item="addItemModal = true" />
            <LocationsView v-else-if="activeTab === 'locations'" key="locations" />
            <SettingsView v-else key="settings" />
        </Transition>

        <AddItemModal v-if="addItemModal" @close="addItemModal = false" @saved="addItemModal = false" />
    </AppShell>
</template>

<script setup lang="ts">
import { useLocations } from '~/composables/useLocations';
import { useItems } from '~/composables/useItems';

const activeTab = ref("search");
const addItemModal = ref(false);

const { load: loadLocations } = useLocations();
const { load: loadItems } = useItems();

onMounted(async () => {
    await Promise.all([loadLocations(), loadItems()]);
});
</script>

<style>
.view-enter-active,
.view-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.view-enter-from {
    opacity: 0;
    transform: translateY(4px);
}

.view-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
