<!-- components/IndexView.vue -->
<template>
    <div class="flex flex-col h-full overflow-y-auto pb-24">

        <!-- Header -->
        <div class="px-4 pt-5 pb-4 shrink-0">
            <div class="text-[11px] text-text-muted tracking-widest uppercase mb-1">Übersicht</div>
            <h1 class="font-['Syne'] text-[24px] font-bold text-text-primary leading-tight">{{ greeting }}</h1>
        </div>

        <!-- Stat cards -->
        <div class="px-4 grid grid-cols-2 gap-2.5 mb-4">

            <!-- Wide card -->
            <div class="col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-0.5">
                <div class="text-[11px] text-text-muted tracking-[0.08em] uppercase">Gegenstände gesamt</div>
                <div class="font-['Syne'] text-[32px] font-bold text-text-primary leading-[1.1] my-1">{{ items.length }}
                </div>
                <div class="text-[11px] text-text-muted">in {{ locations.length }} Orten gespeichert</div>
                <div class="h-0.5 bg-border rounded-full mt-3 overflow-hidden">
                    <div class="h-full bg-accent rounded-full transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        :style="{ width: itemCapacityPercent + '%' }" />
                </div>
            </div>

            <!-- Orte -->
            <div class="bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-0.5">
                <div class="text-[11px] text-text-muted tracking-[0.08em] uppercase">Orte</div>
                <div class="font-['Syne'] text-[32px] font-bold text-text-primary leading-[1.1] my-1">{{
                    locations.length }}</div>
                <div class="text-[11px] text-text-muted">{{ rootLocationCount }} Hauptorte</div>
            </div>

            <!-- Zuletzt hinzugefügt -->
            <div class="bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-0.5">
                <div class="text-[11px] text-text-muted tracking-[0.08em] uppercase">Zuletzt hinzugefügt</div>
                <div class="font-['Syne'] text-[15px] font-bold text-text-primary leading-snug mt-1">{{ lastAddedName }}
                </div>
                <div class="text-[11px] text-text-muted">{{ lastAddedDate }}</div>
            </div>

        </div>

        <!-- Top locations -->
        <div class="px-4 mb-4" v-if="topLocations.length > 0">
            <div class="text-[11px] text-text-muted tracking-widest uppercase mb-2 px-0.5">Meiste Gegenstände</div>
            <div class="flex flex-col gap-1.5">
                <div v-for="(loc, i) in topLocations" :key="loc.id"
                    class="flex items-center gap-3 px-4 py-3 bg-bg-surface border border-border-subtle rounded-[10px]">
                    <span class="text-[11px] text-text-muted w-4 shrink-0 text-right">{{ i + 1 }}</span>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] text-text-primary truncate">{{ loc.name }}</div>
                        <div class="text-[10px] text-text-muted truncate">{{ loc.path }}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <div class="w-12 h-0.5 bg-border rounded-full overflow-hidden">
                            <div class="h-full bg-accent rounded-full transition-[width] duration-400"
                                :style="{ width: (loc.count / topLocations[0]!.count * 100) + '%' }" />
                        </div>
                        <span class="text-[11px] text-accent tabular-nums w-6 text-right">{{ loc.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent items -->
        <div class="px-4 mb-4" v-if="recentItems.length > 0">
            <div class="text-[11px] text-text-muted tracking-widest uppercase mb-2 px-0.5">Zuletzt hinzugefügt</div>
            <div class="flex flex-col gap-1.5">
                <div v-for="item in recentItems" :key="item.id"
                    class="flex items-center gap-3 px-4 py-3 bg-bg-surface border border-border-subtle rounded-[10px] cursor-pointer transition-all duration-150 hover:border-border hover:bg-bg-elevated"
                    @click="selectedItem = item">
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] text-text-primary font-['Syne'] font-semibold truncate">{{ item.name }}
                        </div>
                        <div class="flex items-center gap-0.5 mt-0.5">
                            <span v-for="(seg, i) in item.locationNames" :key="i"
                                class="text-[10px] text-accent flex items-center gap-0.5">
                                <IconChevronRight v-if="i > 0" :size="9" class="text-text-muted" />
                                {{ seg }}
                            </span>
                        </div>
                    </div>
                    <span class="text-[10px] text-text-muted shrink-0 tabular-nums">{{ formatRelative(item.createdAt)
                        }}</span>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-if="items.length === 0"
            class="flex flex-col items-center justify-center flex-1 px-6 text-center gap-2.5 py-16">
            <div class="text-text-muted mb-2">
                <IconPackageOpen :size="52" />
            </div>
            <div class="font-['Syne'] text-[18px] font-semibold text-text-secondary">Noch nichts hier</div>
            <div class="text-[13px] text-text-muted max-w-60 leading-[1.7]">
                Füge deinen ersten Gegenstand hinzu um die Übersicht zu befüllen.
            </div>
        </div>

        <ItemDetailModal v-if="selectedItem" :item="selectedItem" @close="selectedItem = null"
            @deleted="selectedItem = null" />

    </div>
</template>

<script setup lang="ts">
import type { ItemWithPath } from '~/types'

const { items } = useItems()
const { locations, getLocationPath } = useLocations()

const selectedItem = ref<ItemWithPath | null>(null)

const greeting = computed(() => {
    const h = new Date().getHours()
    if (h < 5) return 'Gute Nacht.'
    if (h < 12) return 'Guten Morgen.'
    if (h < 17) return 'Guten Tag.'
    if (h < 22) return 'Guten Abend.'
    return 'Gute Nacht.'
})

const rootLocationCount = computed(() => locations.value.filter(l => l.parentId === null).length)
const itemCapacityPercent = computed(() => Math.min((items.value.length / 200) * 100, 100))
const lastItem = computed(() => [...items.value].sort((a, b) => b.createdAt - a.createdAt)[0])
const lastAddedName = computed(() => lastItem.value?.name ?? '—')
const lastAddedDate = computed(() => lastItem.value ? formatRelative(lastItem.value.createdAt) : 'Noch nichts hinzugefügt')

const topLocations = computed(() => {
    const counts: Record<string, number> = {}
    for (const item of items.value) counts[item.locationId] = (counts[item.locationId] || 0) + 1
    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([id, count]) => {
            const loc = locations.value.find(l => l.id === id)
            return { id, count, name: loc?.name ?? 'Unbekannt', path: getLocationPath(id).slice(0, -1).join(' / ') }
        })
})

const recentItems = computed<ItemWithPath[]>(() =>
    [...items.value]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(item => ({
            ...item,
            locationNames: getLocationPath(item.locationId),
            locationPath: getLocationPath(item.locationId).join(' / '),
        }))
)

function formatRelative(ts: number): string {
    const diff = Date.now() - ts
    const m = Math.floor(diff / 60_000)
    const h = Math.floor(diff / 3_600_000)
    const d = Math.floor(diff / 86_400_000)
    if (m < 1) return 'Gerade eben'
    if (m < 60) return `vor ${m} Min.`
    if (h < 24) return `vor ${h} Std.`
    if (d < 7) return `vor ${d} Tag${d !== 1 ? 'en' : ''}`
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(ts))
}
</script>