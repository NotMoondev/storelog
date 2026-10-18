<template>
    <div v-if="!location" class="flex-1 flex flex-col items-center justify-center">
        <UiEmptyState :icon="MapPinOff" title="Ort nicht gefunden" text="Er wurde aufgelöst oder verschoben.">
            <UiButton variant="secondary" to="/orte" block>Zur Übersicht</UiButton>
        </UiEmptyState>
    </div>

    <div v-else class="flex flex-col h-full min-h-0">

        <!-- ── Header: where am I, what is it called, what can I do here ──── -->
        <header class="shrink-0 border-b border-border-subtle bg-bg">
            <div class="px-4 lg:px-8 pt-2 lg:pt-5 pb-4 lg:max-w-4xl lg:mx-auto w-full flex flex-col gap-3">

                <div class="flex items-center gap-2">
                    <UiIconButton :icon="ChevronLeft" :label="`Zurück zu ${backLabel}`" :to="backTo" />
                    <nav class="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar text-meta"
                        aria-label="Pfad">
                        <NuxtLink to="/orte"
                            class="shrink-0 h-11 flex items-center text-text-muted hover:text-text-primary transition-colors">
                            Orte
                        </NuxtLink>
                        <template v-for="crumb in ancestors.slice(0, -1)" :key="crumb.id">
                            <ChevronRight :size="12" class="text-text-muted shrink-0" />
                            <NuxtLink :to="`/orte/${crumb.id}`"
                                class="shrink-0 h-11 flex items-center whitespace-nowrap text-text-secondary hover:text-text-primary transition-colors">
                                {{ crumb.name }}
                            </NuxtLink>
                        </template>
                    </nav>
                    <UiIconButton :icon="Ellipsis" label="Weitere Aktionen" @click="actionsOpen = true" />
                </div>

                <div>
                    <!-- Tap the title to rename; Enter or leaving the field saves -->
                    <UiTextField v-if="renaming" ref="renameRef" v-model="renameDraft" variant="title"
                        @enter="commitRename" @escape="renaming = false" @blur="commitRename" />
                    <button v-else type="button" class="flex items-center gap-2 max-w-full text-left cursor-text"
                        :aria-label="`${location.name} umbenennen`" @click="startRename">
                        <h1 class="font-name text-title-lg lg:text-title-xl text-text-primary truncate">
                            {{ location.name }}
                        </h1>
                        <Pen :size="16" class="text-text-muted shrink-0" />
                        <span v-if="container"
                            class="shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded-[6px] bg-accent-dim text-accent-text text-caption font-semibold uppercase tracking-[0.04em]">
                            <LayoutGrid :size="12" />
                            Container
                        </span>
                    </button>

                    <p v-if="!renaming" class="mt-1 flex flex-wrap gap-x-1 text-caption text-text-muted tabular-nums">
                        <span>{{ itemCount(counts.total) }}</span>
                        <span v-if="subLocations.length">· {{ subLocationCount(subLocations.length) }}</span>
                        <span v-if="container">· {{ zoneCount(zoneLeaves.length) }}</span>
                    </p>
                </div>

                <div class="flex gap-2">
                    <UiButton variant="primary" :icon="Plus" class="flex-1 lg:flex-none" @click="addItem()">
                        Gegenstand
                    </UiButton>
                    <UiButton variant="secondary" :icon="Plus" class="flex-1 lg:flex-none"
                        @click="openCreate({ kind: 'location', locationId: location.id })">
                        Unterort
                    </UiButton>
                </div>
            </div>
        </header>

        <!-- ── Body ───────────────────────────────────────────────────────── -->
        <div class="flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
            <!--
                With a container the layout splits on wide screens: the plan of
                the shelf stays visible on the left while its contents scroll on
                the right. Without one there is nothing to pin.
            -->
            <div class="grid gap-6 lg:gap-8" :class="planContainer
                ? 'lg:max-w-5xl lg:mx-auto lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start'
                : 'lg:max-w-4xl lg:mx-auto grid-cols-1'">

                <!--
                    The same plan answers two questions: on a shelf it is its own
                    layout, on a compartment it is the shelf around it with this
                    compartment lit.
                -->
                <section v-if="planContainer" class="flex flex-col gap-2 lg:sticky lg:top-0">
                    <div class="flex items-center gap-2 px-1 min-h-11">
                        <h2 class="eyebrow truncate">{{ isZone ? `Im ${planContainer.name}` : 'Aufteilung' }}</h2>
                        <button type="button"
                            class="tap-area ml-auto shrink-0 inline-flex items-center gap-1 text-meta font-medium text-accent-text cursor-pointer"
                            @click="editorOpen = true">
                            <Pen :size="16" />
                            Bearbeiten
                        </button>
                    </div>
                    <ZoneMap :container="planContainer" :item-counts="itemCountByLocation"
                        :highlight-id="planHighlightId" interactive @select="onZoneSelect" />
                    <div class="flex items-center gap-2 min-h-9">
                        <UiChip v-if="activeZoneId && !isZone" pressed removable @click="activeZoneId = null">
                            Nur {{ zoneName(activeZoneId) }}
                        </UiChip>
                        <p v-else class="px-1 text-meta text-text-muted">
                            {{ isZone ? 'Anderes Fach antippen, um dorthin zu wechseln.' : 'Fach antippen, um nur dessen Inhalt zu sehen.' }}
                        </p>
                    </div>
                </section>

                <div class="flex flex-col gap-6 min-w-0">

                    <!-- Sub-locations -->
                    <section v-if="subLocations.length" class="flex flex-col gap-2">
                        <h2 class="eyebrow px-1">
                            Unterorte <span class="text-text-muted tracking-normal tabular-nums">{{ subLocations.length }}</span>
                        </h2>
                        <div class="grid gap-2" :class="wideGrid">
                            <LocationCard v-for="child in subLocations" :key="child.id" :location="child"
                                :to="`/orte/${child.id}`" @longpress="childActionsFor = child" />
                        </div>
                    </section>

                    <!-- Items -->
                    <section class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 px-1 min-h-11">
                            <h2 class="eyebrow">
                                Gegenstände <span class="text-text-muted tracking-normal tabular-nums">{{ visibleItemCount }}</span>
                            </h2>
                            <div v-if="visibleItemCount" class="ml-auto flex items-center gap-5">
                                <template v-if="selection.active.value">
                                    <button type="button"
                                        class="tap-area text-meta font-medium text-text-secondary cursor-pointer"
                                        @click="selection.selectAll(visibleItemIds)">
                                        Alle
                                    </button>
                                    <button type="button"
                                        class="tap-area text-meta font-medium text-accent-text cursor-pointer"
                                        @click="selection.stop()">
                                        Fertig
                                    </button>
                                </template>
                                <button v-else type="button"
                                    class="tap-area text-meta font-medium text-accent-text cursor-pointer"
                                    @click="selection.start()">
                                    Auswählen
                                </button>
                            </div>
                        </div>

                        <div v-for="group in visibleGroups" :key="group.locationId" class="flex flex-col gap-2">
                            <div v-if="showGroupHeaders" class="flex items-center gap-2 pl-1 pt-1">
                                <span class="text-meta font-medium"
                                    :class="group.locationId === activeZoneId ? 'text-accent-text' : 'text-text-secondary'">
                                    {{ group.label }}
                                </span>
                                <span class="text-caption text-text-muted tabular-nums">{{ group.items.length }}</span>
                                <UiIconButton class="ml-auto" :icon="Plus" variant="plain" :icon-size="18"
                                    :label="`Gegenstand in ${group.label} ablegen`" @click="addItem(group.locationId)" />
                            </div>
                            <div class="grid gap-2" :class="wideGrid">
                                <ItemCard v-for="item in group.items" :key="item.id" :item="item" :show-map="false"
                                    :selectable="selection.active.value" :selected="selection.has(item.id)"
                                    @activate="onItemActivate(item)" @longpress="onItemLongPress(item)" />
                            </div>
                        </div>

                        <!--
                            Two empty states: a place that holds nothing gets the
                            full invitation, one that only routes onward gets a
                            single line so the sub-locations stay in view.
                        -->
                        <div v-if="!visibleItemCount && subLocations.length"
                            class="flex items-center gap-3 min-h-14 pl-4 pr-2 rounded-md border border-dashed border-border text-meta text-text-muted">
                            <span class="flex-1">
                                {{ activeZoneId ? `In „${zoneName(activeZoneId)}“ liegt nichts.` : 'Direkt hier liegt nichts, alles steckt in den Unterorten.' }}
                            </span>
                            <UiButton variant="ghost-accent" size="sm" @click="addItem()">Ablegen</UiButton>
                        </div>

                        <UiEmptyState v-else-if="!visibleItemCount" compact :icon="PackageOpen" :title="emptyTitle"
                            :text="emptyText">
                            <UiButton variant="primary" :icon="Plus" block @click="addItem()">
                                {{ activeZoneId ? `In „${zoneName(activeZoneId)}“ ablegen` : `In ${location.name} ablegen` }}
                            </UiButton>
                        </UiEmptyState>
                    </section>
                </div>
            </div>
        </div>

        <!-- ── Sheets ─────────────────────────────────────────────────────── -->
        <ItemDetailSheet v-if="detailItem" :item="detailItem" @close="detailItem = null" @deleted="detailItem = null" />

        <ContainerEditor :open="editorOpen" :container="planContainer ?? null" :item-counts="itemCountByLocation"
            @close="editorOpen = false" @saved="editorOpen = false" />

        <LocationActionsSheet v-if="actionsOpen" :location="location" @close="actionsOpen = false"
            @rename="startRename" @edit-layout="editorOpen = true" />

        <LocationActionsSheet v-if="childActionsFor" :location="childActionsFor" @close="childActionsFor = null"
            @rename="openChild(childActionsFor!, 'umbenennen')" @edit-layout="openChild(childActionsFor!, 'aufteilung')" />
    </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Ellipsis, LayoutGrid, MapPinOff, PackageOpen, Pen, Plus } from "lucide-vue-next"
import type { ItemView, Location } from "~/types"
import { collectLeaves } from "~/repositories/containerRepository"
import { itemCount, subLocationCount, zoneCount } from "~/utils/plural"

interface ItemGroup {
    locationId: string
    label: string
    items: ItemView[]
}

const route = useRoute()
const router = useRouter()

const { ensureLoaded: loadLocations, updateLocation } = useLocations()
const { ensureLoaded: loadItems } = useItems()
const { ensureLoaded: loadContainers } = useContainers()
const {
    getLocation, ancestorsOf, containerOf, containerOwning, childrenOf, countsOf,
    itemsIn, decorateItem, itemCountByLocation,
} = useTopology()
const { openCreate } = useCreate()
const selection = useSelection()
const toast = useToast()

const locationId = computed(() => String(route.params.id))
const location = computed(() => getLocation(locationId.value))
const ancestors = computed(() => (location.value ? ancestorsOf(location.value.id) : []))
const container = computed(() => (location.value ? containerOf(location.value.id) : undefined))
/** Set when this location is not a shelf itself but one compartment of one. */
const parentContainer = computed(() =>
    location.value && !container.value ? containerOwning(location.value.id) : undefined
)
const isZone = computed(() => !!parentContainer.value)
const planContainer = computed(() => container.value ?? parentContainer.value)
const planHighlightId = computed(() =>
    isZone.value ? (location.value?.id ?? null) : activeZoneId.value
)
const subLocations = computed(() => (location.value ? childrenOf(location.value.id) : []))
const counts = computed(() => (location.value ? countsOf(location.value.id) : { own: 0, total: 0, locations: 0 }))
const zoneLeaves = computed(() =>
    container.value ? collectLeaves(container.value.rootNode).filter((l) => l.locationId) : []
)

/** Back goes one level up, not through browser history. */
const parent = computed(() => ancestors.value.at(-2))
const backTo = computed(() => (parent.value ? `/orte/${parent.value.id}` : "/orte"))
const backLabel = computed(() => parent.value?.name ?? "Orte")

// ── Item groups ───────────────────────────────────────────────────────────────

/**
 * A container's items live in its zones, so they are grouped by zone in the
 * order the zones appear in the layout. A plain place like "unterm Bett" has a
 * single group and no headers — just a clean list.
 */
const groups = computed<ItemGroup[]>(() => {
    if (!location.value) return []
    const result: ItemGroup[] = []

    const direct = itemsIn(location.value.id).map(decorateItem)
    if (direct.length || !container.value) {
        result.push({
            locationId: location.value.id,
            label: container.value ? "Direkt im Container" : "Direkt hier",
            items: sortItems(direct),
        })
    }

    for (const leaf of zoneLeaves.value) {
        result.push({
            locationId: leaf.locationId!,
            label: leaf.name,
            items: sortItems(itemsIn(leaf.locationId!).map(decorateItem)),
        })
    }
    return result
})

function sortItems(list: ItemView[]): ItemView[] {
    return [...list].sort((a, b) => b.createdAt - a.createdAt)
}

const activeZoneId = ref<string | null>(null)

const visibleGroups = computed(() => {
    const withItems = groups.value.filter((g) => g.items.length)
    if (!activeZoneId.value) return withItems
    return groups.value.filter((g) => g.locationId === activeZoneId.value && g.items.length)
})

const visibleItemCount = computed(() =>
    visibleGroups.value.reduce((sum, g) => sum + g.items.length, 0)
)

const visibleItemIds = computed(() => visibleGroups.value.flatMap((g) => g.items.map((i) => i.id)))

/** In the split layout the right column is already narrow, so cards stay single-file. */
const wideGrid = computed(() => (planContainer.value ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"))

/** Headers only earn their space once there is more than one place to tell apart. */
const showGroupHeaders = computed(() => !!container.value && visibleGroups.value.length > 0)

const emptyTitle = computed(() => {
    if (activeZoneId.value) return "Dieses Fach ist leer"
    if (isZone.value) return "In diesem Fach liegt nichts"
    return "Hier liegt noch nichts"
})

const emptyText = computed(() => {
    if (container.value && !activeZoneId.value) return "Tipp oben ein Fach an, um gezielt dort abzulegen."
    return undefined
})

/** New items land in the focused zone, else in the location itself. */
const defaultAddLocationId = computed(() => activeZoneId.value ?? location.value?.id ?? null)

function zoneName(id: string): string {
    return groups.value.find((g) => g.locationId === id)?.label ?? "Fach"
}

/** From a place, adding means filling it: the place is fixed, several in a row. */
function addItem(targetId?: string) {
    openCreate({ kind: "item", locationId: targetId ?? defaultAddLocationId.value, series: true })
}

/** On a shelf a tap filters; on a compartment it is a sideways move to a sibling. */
function onZoneSelect(zoneLocationId: string) {
    if (!isZone.value) {
        activeZoneId.value = activeZoneId.value === zoneLocationId ? null : zoneLocationId
        return
    }
    if (zoneLocationId !== location.value?.id) router.push(`/orte/${zoneLocationId}`)
}

// ── Items: tap opens, long press selects ─────────────────────────────────────

const detailItem = ref<ItemView | null>(null)

function onItemActivate(item: ItemView) {
    if (selection.active.value) selection.toggle(item.id)
    else detailItem.value = item
}

function onItemLongPress(item: ItemView) {
    if (selection.active.value) selection.toggle(item.id)
    else selection.start(item.id)
}

// ── Rename in place ──────────────────────────────────────────────────────────

const renaming = ref(false)
const renameDraft = ref("")
const renameRef = ref<{ focus: () => void; select: () => void }>()

function startRename() {
    if (!location.value) return
    renameDraft.value = location.value.name
    renaming.value = true
    nextTick(() => {
        renameRef.value?.focus()
        renameRef.value?.select()
    })
}

async function commitRename() {
    if (!renaming.value) return
    renaming.value = false
    const name = renameDraft.value.trim()
    const current = location.value
    if (!current || !name || name === current.name) return
    const before = current.name
    try {
        await updateLocation(current.id, { name })
        toast.show({ message: `Umbenannt in „${name}“`, undo: () => updateLocation(current.id, { name: before }) })
    } catch (err) {
        toast.error(err, "Umbenennen hat nicht geklappt.")
    }
}

// ── Sheets ───────────────────────────────────────────────────────────────────

const editorOpen = ref(false)
const actionsOpen = ref(false)
const childActionsFor = ref<Location | null>(null)

function openChild(child: Location, intent: "umbenennen" | "aufteilung") {
    router.push({ path: `/orte/${child.id}`, query: { [intent]: "1" } })
}

/**
 * Arriving with ?umbenennen=1 or ?aufteilung=1 (from a long press in a list,
 * or right after creating a container) lands straight in that task.
 */
function applyIntent() {
    if (!location.value) return
    const { umbenennen, aufteilung } = route.query
    if (!umbenennen && !aufteilung) return
    if (umbenennen) startRename()
    if (aufteilung && planContainer.value) editorOpen.value = true
    router.replace({ path: route.path })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

watch(locationId, () => {
    activeZoneId.value = null
    renaming.value = false
    editorOpen.value = false
})

watch([location, planContainer, () => route.query], applyIntent)

onMounted(async () => {
    await Promise.all([loadLocations(), loadItems(), loadContainers()])
    applyIntent()
})
</script>
