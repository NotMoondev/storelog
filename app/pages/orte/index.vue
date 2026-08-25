<template>
    <div class="flex flex-col h-full min-h-0">

        <!-- Header -->
        <div class="shrink-0 px-4 lg:px-8 pt-4 lg:pt-6 pb-3 flex flex-col gap-3 border-b border-border-subtle">
            <div class="lg:max-w-4xl lg:mx-auto w-full flex items-center gap-3">
                <div class="min-w-0">
                    <p class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase">Übersicht</p>
                    <h1 class="font-['Syne'] text-[22px] lg:text-[26px] font-bold text-text-primary leading-tight">
                        Deine Orte
                    </h1>
                </div>
                <button type="button" @click="createPickerOpen = true"
                    class="ml-auto flex items-center gap-1.5 h-10 px-3.5 bg-accent text-black rounded-xl border-none cursor-pointer text-[13px] font-medium shrink-0 transition-all hover:brightness-110 active:scale-95">
                    <IconPlus :size="15" />
                    Ort
                </button>
            </div>

            <div class="lg:max-w-4xl lg:mx-auto w-full flex items-center gap-2.5 bg-bg-surface border border-border rounded-xl px-3 h-10 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                <IconSearch :size="15" class="text-text-muted shrink-0" />
                <input v-model="filter" type="text" placeholder="Ort filtern…" autocomplete="off" spellcheck="false"
                    aria-label="Orte filtern"
                    class="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px] text-text-primary placeholder:text-text-muted" />
                <button v-if="filter" type="button" aria-label="Filter leeren" @click="filter = ''"
                    class="bg-transparent border-none text-text-muted cursor-pointer p-1 hover:text-text-secondary transition-colors">
                    <IconX :size="14" />
                </button>
            </div>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
            <div class="lg:max-w-4xl lg:mx-auto flex flex-col gap-2">

                <p v-if="filter" class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase px-0.5 mb-1">
                    {{ shown.length }} Treffer im gesamten Baum
                </p>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    <LocationCard v-for="loc in shown" :key="loc.id" :location="loc" :to="`/orte/${loc.id}`"
                        :query="filter" :show-path="!!filter" />
                </div>

                <!-- Empty states -->
                <div v-if="!shown.length && filter"
                    class="flex flex-col items-center justify-center py-14 px-6 text-center gap-2">
                    <IconMapPinOff :size="44" class="text-text-muted" />
                    <p class="font-['Syne'] text-[16px] font-semibold text-text-secondary">Kein Ort gefunden</p>
                    <p class="text-[13px] text-text-muted">Nichts passt zu „{{ filter }}".</p>
                </div>

                <div v-else-if="!shown.length"
                    class="flex flex-col items-center justify-center py-16 px-6 text-center gap-2.5">
                    <IconMapPinOff :size="48" class="text-text-muted" />
                    <p class="font-['Syne'] text-[17px] font-semibold text-text-secondary">Noch keine Orte</p>
                    <p class="text-[13px] text-text-muted max-w-65 leading-relaxed">
                        Fang mit einem Raum an — Schränke, Kisten und Fächer kommen als Unterorte hinein.
                    </p>
                    <button type="button" @click="createPickerOpen = true"
                        class="mt-2 px-5 py-2.5 bg-accent text-black border-none rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:brightness-110 active:scale-95">
                        Ersten Ort erstellen
                    </button>
                </div>
            </div>
        </div>

        <CreatePickerSheet :open="createPickerOpen" @close="createPickerOpen = false" @pick="onPick" />
        <CreateLocationSheet :open="createSheetOpen" :parent-id="null" @close="createSheetOpen = false"
            @created="onLocationCreated" />
        <CreateContainerSheet :open="createContainerOpen" :parent-id="null" @close="createContainerOpen = false"
            @created="onContainerCreated" />
    </div>
</template>

<script setup lang="ts">
import type { Location } from "~/types"

const router = useRouter()
const { locations, ensureLoaded: loadLocations, createLocation } = useLocations()
const { ensureLoaded: loadItems } = useItems()
const { ensureLoaded: loadContainers, createContainer, buildGridTree } = useContainers()
const { childrenOf, zoneLocationIds, getLocationPath } = useTopology()

const filter = ref("")
const createPickerOpen = ref(false)
const createSheetOpen = ref(false)
const createContainerOpen = ref(false)

const roots = computed(() => childrenOf(null))

/** Without a filter this is the top level; with one, the whole tree is fair game. */
const shown = computed<Location[]>(() => {
    const q = filter.value.trim().toLowerCase()
    if (!q) return roots.value
    return locations.value
        .filter((l) => !zoneLocationIds.value.has(l.id))
        .filter((l) =>
            l.name.toLowerCase().includes(q) ||
            getLocationPath(l.id).join(" ").toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
})

function onPick(type: "location" | "container") {
    if (type === "location") createSheetOpen.value = true
    else createContainerOpen.value = true
}

function onLocationCreated(location?: Location) {
    createSheetOpen.value = false
    if (location?.id) router.push(`/orte/${location.id}`)
}

async function onContainerCreated(name: string, width: number, height: number, useGrid: boolean) {
    createContainerOpen.value = false
    const location = await createLocation(name, null)
    await createContainer(
        name,
        location.id,
        { unit: "ratio", width, height },
        useGrid ? buildGridTree(width, height) : undefined
    )
    router.push(`/orte/${location.id}`)
}

onMounted(() => {
    loadLocations()
    loadItems()
    loadContainers()
})
</script>
