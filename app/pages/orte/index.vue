<template>
    <!--
        Order, not DOM order: the filter belongs directly above the nav on a
        phone so the thumb reaches it, and in its conventional place under the
        heading on a desktop. The markup stays heading → list → filter.
    -->
    <div class="flex flex-col h-full min-h-0">

        <!-- Heading -->
        <header
            class="order-1 shrink-0 px-4 lg:px-8 pt-4 lg:pt-6 pb-3 border-b border-border-subtle lg:border-b-0">
            <div class="lg:max-w-4xl lg:mx-auto w-full flex items-end gap-3">
                <div class="min-w-0">
                    <p class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase">Übersicht</p>
                    <h1 class="font-['Syne'] text-[22px] lg:text-[26px] font-bold text-text-primary leading-tight">
                        Deine Orte
                    </h1>
                </div>
                <p v-if="roots.length" class="ml-auto shrink-0 text-[12px] text-text-muted tabular-nums pb-1">
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
            <div class="lg:max-w-4xl lg:mx-auto w-full flex items-center gap-2.5 bg-bg-surface border rounded-2xl px-3.5 h-12 transition-all duration-150"
                :class="filter
                    ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]'
                    : 'border-border focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]'">
                <IconSearch :size="17" class="text-text-muted shrink-0" />
                <input v-model="filter" type="text" placeholder="Ort filtern…" autocomplete="off" spellcheck="false"
                    aria-label="Orte filtern"
                    class="flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-muted" />
                <button v-if="filter" type="button" aria-label="Filter leeren" @click="filter = ''"
                    class="bg-transparent border-none text-text-muted cursor-pointer p-1 hover:text-text-secondary transition-colors">
                    <IconX :size="15" />
                </button>
            </div>
        </div>

        <!-- List -->
        <div class="order-2 lg:order-3 flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
            <div class="lg:max-w-4xl lg:mx-auto flex flex-col gap-2">

                <p v-if="filter" class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase px-0.5">
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
                    <button type="button" @click="openCreateMenu()"
                        class="mt-2 px-5 py-2.5 bg-accent text-black border-none rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:brightness-110 active:scale-95">
                        Ersten Ort erstellen
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Location } from "~/types"
import { locationCount } from "~/utils/plural"

const { locations, ensureLoaded: loadLocations } = useLocations()
const { ensureLoaded: loadItems } = useItems()
const { ensureLoaded: loadContainers } = useContainers()
const { childrenOf, zoneLocationIds, getLocationPath } = useTopology()
const { openCreateMenu } = useCreateMenu()

const filter = ref("")

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

onMounted(() => {
    loadLocations()
    loadItems()
    loadContainers()
})
</script>
