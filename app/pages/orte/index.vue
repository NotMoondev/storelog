<template>
    <!--
        Order, not DOM order: the filter belongs directly above the nav on a
        phone so the thumb reaches it, and in its conventional place under the
        heading on a desktop. The markup stays heading → list → filter.
    -->
    <div class="flex flex-col h-full min-h-0">

        <!-- Heading -->
        <header class="order-1 shrink-0 px-4 lg:px-8 pt-4 lg:pt-6 pb-3">
            <div class="lg:max-w-4xl lg:mx-auto w-full flex items-end gap-3">
                <h1 class="font-name text-title-lg lg:text-title-xl text-text-primary">Deine Orte</h1>
                <p v-if="roots.length" class="ml-auto shrink-0 text-caption text-text-muted tabular-nums pb-1">
                    {{ locationCount(roots.length) }}
                </p>
            </div>
        </header>

        <!-- Filter -->
        <div
            class="order-3 lg:order-2 shrink-0 relative z-10 px-4 pt-2 pb-2 lg:px-8 lg:pt-0 lg:pb-3 lg:border-b lg:border-border-subtle bg-bg">
            <!-- Softens the scroll edge where the list runs under the field. -->
            <div class="lg:hidden pointer-events-none absolute inset-x-0 -top-6 h-6"
                style="background: linear-gradient(to top, var(--bg), transparent)" />
            <label
                class="lg:max-w-4xl lg:mx-auto w-full flex items-center gap-2 h-13 pl-4 pr-1 bg-bg-surface border rounded-lg text-text-muted transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]"
                :class="filter ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]' : 'border-border'">
                <Search :size="18" class="shrink-0" />
                <input v-model="filter" type="search" enterkeyhint="search" placeholder="Ort filtern" autocomplete="off"
                    spellcheck="false" aria-label="Orte filtern"
                    class="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-body text-text-primary placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
                    @keydown.escape="filter = ''" />
                <UiIconButton v-if="filter" :icon="X" label="Filter leeren" variant="plain" :icon-size="18"
                    @click="filter = ''" />
            </label>
        </div>

        <!-- List -->
        <div class="order-2 lg:order-3 flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 pt-1 pb-4 lg:py-6">
            <div class="lg:max-w-4xl lg:mx-auto flex flex-col gap-2">

                <p v-if="filter" class="eyebrow px-1">
                    {{ shown.length }} Treffer im gesamten Baum
                </p>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    <LocationCard v-for="loc in shown" :key="loc.id" :location="loc" :to="`/orte/${loc.id}`"
                        :query="filter" :show-path="!!filter" @longpress="actionsFor = loc" />
                </div>

                <!-- Empty states -->
                <UiEmptyState v-if="!shown.length && filter" :icon="MapPinOff" title="Kein Ort gefunden"
                    :text="`Kein Ort heißt „${filter.trim()}“.`">
                    <UiButton variant="primary" :icon="Plus" block
                        @click="openCreate({ kind: 'location', name: filter })">
                        „{{ filter.trim() }}“ als Ort anlegen
                    </UiButton>
                </UiEmptyState>

                <UiEmptyState v-else-if="!shown.length" :icon="MapPinOff" title="Noch keine Orte"
                    text="Fang mit einem Raum an. Schränke, Kisten und Fächer kommen als Unterorte hinein.">
                    <UiButton variant="primary" :icon="Plus" block @click="openCreate({ kind: 'location' })">
                        Ersten Ort anlegen
                    </UiButton>
                </UiEmptyState>
            </div>
        </div>

        <LocationActionsSheet v-if="actionsFor" :location="actionsFor" @close="actionsFor = null"
            @rename="goTo(actionsFor!, 'umbenennen')" @edit-layout="goTo(actionsFor!, 'aufteilung')" />
    </div>
</template>

<script setup lang="ts">
import { MapPinOff, Plus, Search, X } from "lucide-vue-next"
import type { Location } from "~/types"
import { locationCount } from "~/utils/plural"

const { locations, ensureLoaded: loadLocations } = useLocations()
const { ensureLoaded: loadItems } = useItems()
const { ensureLoaded: loadContainers } = useContainers()
const { childrenOf, zoneLocationIds, getLocationPath } = useTopology()
const { openCreate } = useCreate()
const router = useRouter()

const filter = ref("")
const actionsFor = ref<Location | null>(null)

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

/** Rename and layout editing happen on the place's page; open it ready for that. */
function goTo(location: Location, intent: "umbenennen" | "aufteilung") {
    router.push({ path: `/orte/${location.id}`, query: { [intent]: "1" } })
}

onMounted(() => {
    loadLocations()
    loadItems()
    loadContainers()
})
</script>
