<template>
    <div v-if="!location" class="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <IconMapPinOff :size="44" class="text-text-muted" />
        <p class="font-['Syne'] text-[17px] font-semibold text-text-secondary">Ort nicht gefunden</p>
        <NuxtLink to="/orte" class="text-[13px] text-accent">Zurück zur Übersicht</NuxtLink>
    </div>

    <div v-else class="flex flex-col h-full min-h-0">

        <!-- ── Header ─────────────────────────────────────────────── -->
        <div class="shrink-0 border-b border-border-subtle">
            <div class="px-4 lg:px-8 pt-3 lg:pt-5 pb-3 lg:max-w-4xl lg:mx-auto w-full flex flex-col gap-2.5">

                <!-- Where am I -->
                <nav class="flex items-center gap-1 overflow-x-auto trail" aria-label="Pfad">
                    <NuxtLink to="/orte"
                        class="text-[11.5px] text-text-muted hover:text-text-primary transition-colors shrink-0">
                        Orte
                    </NuxtLink>
                    <template v-for="crumb in ancestors.slice(0, -1)" :key="crumb.id">
                        <IconChevronRight :size="11" class="text-text-muted/60 shrink-0" />
                        <NuxtLink :to="`/orte/${crumb.id}`"
                            class="text-[11.5px] text-text-secondary hover:text-text-primary transition-colors shrink-0 whitespace-nowrap">
                            {{ crumb.name }}
                        </NuxtLink>
                    </template>
                </nav>

                <!-- Title -->
                <div class="flex items-start gap-3">
                    <div class="min-w-0 flex-1">
                        <div v-if="!renaming" class="flex items-center gap-2 min-w-0">
                            <h1
                                class="font-['Syne'] text-[22px] lg:text-[27px] font-bold text-text-primary leading-tight truncate">
                                {{ location.name }}
                            </h1>
                            <span v-if="container"
                                class="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-accent-dim text-accent">
                                <IconLayoutGrid :size="10" />
                                Container
                            </span>
                        </div>
                        <div v-else class="flex items-center gap-2">
                            <input ref="renameRef" v-model="renameDraft" type="text" autocomplete="off"
                                spellcheck="false" aria-label="Ort umbenennen"
                                class="flex-1 min-w-0 bg-bg-elevated border border-accent rounded-xl px-3 py-2 font-['Syne'] text-[19px] font-bold text-text-primary outline-none shadow-[0_0_0_3px_var(--accent-glow)]"
                                @keydown.enter="commitRename" @keydown.escape="renaming = false" />
                            <button type="button" aria-label="Abbrechen" @click="renaming = false"
                                class="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all active:scale-95">
                                <IconX :size="16" />
                            </button>
                            <button type="button" aria-label="Speichern" @click="commitRename"
                                class="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-accent border-none text-black cursor-pointer transition-all active:scale-95">
                                <IconCheck :size="16" />
                            </button>
                        </div>

                        <p v-if="!renaming" class="text-[12px] text-text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>{{ itemCount(counts.total) }}</span>
                            <span v-if="subLocations.length">· {{ subLocationCount(subLocations.length) }}</span>
                            <span v-if="container">· {{ zoneCount(zoneLeaves.length) }}</span>
                        </p>
                    </div>

                    <button v-if="!renaming" type="button" aria-label="Weitere Aktionen" @click="actionsOpen = true"
                        class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all active:scale-95 hover:text-text-primary hover:border-text-muted">
                        <IconEllipsis :size="18" />
                    </button>
                </div>

                <!-- Primary actions -->
                <div class="flex items-center gap-2 overflow-x-auto trail">
                    <button type="button" @click="openQuickAdd(defaultAddLocationId)"
                        class="shrink-0 flex items-center gap-1.5 h-9 px-3.5 bg-accent text-black rounded-xl border-none cursor-pointer text-[12.5px] font-medium transition-all hover:brightness-110 active:scale-95">
                        <IconPlus :size="14" />
                        Gegenstand
                    </button>
                    <button type="button" @click="createPickerOpen = true"
                        class="shrink-0 flex items-center gap-1.5 h-9 px-3.5 bg-bg-elevated text-text-secondary border border-border rounded-xl cursor-pointer text-[12.5px] transition-all hover:text-text-primary hover:border-text-muted active:scale-95">
                        <IconMapPin :size="14" />
                        Unterort
                    </button>
                </div>

                <p v-if="actionError"
                    class="flex items-start gap-1.5 text-[11.5px] text-danger bg-danger-dim border border-danger/30 rounded-lg px-2.5 py-2">
                    <IconTriangleAlert :size="13" class="shrink-0 mt-0.5" />
                    <span class="flex-1">{{ actionError }}</span>
                    <button type="button" aria-label="Hinweis schließen" @click="actionError = ''"
                        class="bg-transparent border-none text-danger cursor-pointer p-0 shrink-0">
                        <IconX :size="12" />
                    </button>
                </p>
            </div>
        </div>

        <!-- ── Body ───────────────────────────────────────────────── -->
        <div class="flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
            <!--
                With a container the layout splits on wide screens: the plan of
                the shelf stays visible on the left while its contents scroll on
                the right. Without one there is nothing to pin, so it stays a
                single column.
            -->
            <div class="grid gap-6 lg:gap-8"
                :class="planContainer
                    ? 'lg:max-w-5xl lg:mx-auto lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start'
                    : 'lg:max-w-4xl lg:mx-auto grid-cols-1'">

                <!--
                    The same plan answers two questions: on a shelf it is its own
                    layout, on a compartment it is the shelf around it with this
                    compartment lit — otherwise a page called "Mitte rechts" says
                    nothing about where that actually is.
                -->
                <section v-if="planContainer" class="flex flex-col gap-2 lg:sticky lg:top-0">
                    <div class="flex items-center gap-2 px-0.5">
                        <h2 class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase truncate">
                            {{ isZone ? `Im ${planContainer.name}` : 'Aufteilung' }}
                        </h2>
                        <button type="button" @click="editorOpen = true"
                            class="ml-auto shrink-0 text-[11.5px] text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer transition-colors">
                            Bearbeiten
                        </button>
                    </div>
                    <ZoneMap :container="planContainer" :item-counts="itemCountByLocation"
                        :highlight-id="planHighlightId" interactive @select="onZoneSelect" />
                    <div class="flex items-center gap-2 px-0.5 min-h-6">
                        <p v-if="isZone" class="text-[11px] text-text-muted">
                            Anderes Fach antippen, um dorthin zu wechseln.
                        </p>
                        <p v-else-if="!activeZoneId" class="text-[11px] text-text-muted">
                            Fach antippen, um nur dessen Inhalt zu sehen.
                        </p>
                        <button v-else type="button" @click="activeZoneId = null"
                            class="flex items-center gap-1.5 text-[11px] text-accent bg-accent-dim border border-accent/30 rounded-lg px-2 py-1 cursor-pointer transition-all hover:brightness-110">
                            Nur {{ zoneName(activeZoneId) }}
                            <IconX :size="11" />
                        </button>
                    </div>
                </section>

                <div class="flex flex-col gap-6 min-w-0">

                    <!-- Sub-locations get their own shape: framed, with a chevron -->
                    <section v-if="subLocations.length" class="flex flex-col gap-2">
                        <h2 class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase px-0.5">
                            Unterorte <span class="text-text-muted tabular-nums">{{ subLocations.length }}</span>
                        </h2>
                        <div class="grid gap-2" :class="wideGrid">
                            <LocationCard v-for="child in subLocations" :key="child.id" :location="child"
                                :to="`/orte/${child.id}`" />
                        </div>
                    </section>

                    <!-- Items -->
                    <section class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 px-0.5">
                            <h2 class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase">
                                Gegenstände <span class="text-text-muted tabular-nums">{{ visibleItemCount }}</span>
                            </h2>
                            <button v-if="visibleItemCount" type="button" @click="toggleSelectMode"
                                class="ml-auto text-[11.5px] cursor-pointer bg-transparent border-none transition-colors"
                                :class="selectMode ? 'text-accent' : 'text-text-muted hover:text-text-primary'">
                                {{ selectMode ? 'Fertig' : 'Auswählen' }}
                            </button>
                        </div>

                        <div v-for="group in visibleGroups" :key="group.locationId" class="flex flex-col gap-1.5">
                            <div v-if="showGroupHeaders" class="flex items-center gap-2 px-0.5 pt-1">
                                <span class="text-[12px] font-medium"
                                    :class="group.locationId === activeZoneId ? 'text-accent' : 'text-text-secondary'">
                                    {{ group.label }}
                                </span>
                                <span class="text-[10px] text-text-muted tabular-nums">{{ group.items.length }}</span>
                                <button type="button" @click="openQuickAdd(group.locationId)"
                                    class="ml-auto text-text-muted hover:text-accent cursor-pointer bg-transparent border-none p-1 transition-colors"
                                    :aria-label="`Gegenstand in ${group.label} hinzufügen`">
                                    <IconPlus :size="14" />
                                </button>
                            </div>
                            <div class="grid gap-2" :class="wideGrid">
                                <ItemCard v-for="item in group.items" :key="item.id" :item="item" :show-map="false"
                                    :selectable="selectMode" :selected="selectedIds.has(item.id)"
                                    @activate="onItemActivate(item)" />
                            </div>
                        </div>

                        <!--
                            Two empty states: a place that holds nothing gets the
                            full invitation, one that only routes onward gets a
                            single line so the sub-locations stay in view.
                        -->
                        <div v-if="!visibleItemCount && subLocations.length"
                            class="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border text-[12.5px] text-text-muted">
                            <span class="flex-1">
                                {{ activeZoneId ? `In „${zoneName(activeZoneId)}" liegt nichts.` : 'Direkt hier liegt nichts — alles steckt in den Unterorten.' }}
                            </span>
                            <button type="button" @click="openQuickAdd(activeZoneId ?? defaultAddLocationId)"
                                class="shrink-0 text-accent bg-transparent border-none cursor-pointer transition-colors hover:brightness-110">
                                Hinzufügen
                            </button>
                        </div>

                        <div v-else-if="!visibleItemCount"
                            class="flex flex-col items-center gap-2 py-10 px-6 text-center">
                            <IconPackageOpen :size="40" class="text-text-muted" />
                            <p class="text-[13.5px] text-text-secondary">{{ emptyMessage }}</p>
                            <button type="button" @click="openQuickAdd(activeZoneId ?? defaultAddLocationId)"
                                class="mt-1 px-4 py-2 bg-accent text-black border-none rounded-xl text-[12.5px] font-medium cursor-pointer transition-all hover:brightness-110 active:scale-95">
                                {{ activeZoneId ? `In „${zoneName(activeZoneId)}" ablegen` : 'Etwas hierher legen' }}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <!-- ── Selection bar ──────────────────────────────────────── -->
        <div v-if="selectMode && selectedIds.size"
            class="shrink-0 border-t border-border bg-bg-surface px-4 lg:px-8 py-3">
            <div class="lg:max-w-4xl lg:mx-auto flex items-center gap-2">
                <span class="text-[12.5px] text-text-secondary tabular-nums shrink-0">
                    {{ selectedIds.size }} ausgewählt
                </span>
                <button type="button" @click="movePickerOpen = true"
                    class="ml-auto flex items-center gap-1.5 h-9 px-3.5 bg-accent text-black rounded-xl border-none cursor-pointer text-[12.5px] font-medium transition-all hover:brightness-110 active:scale-95">
                    <IconCornerUpRight :size="14" />
                    Verschieben
                </button>
                <button type="button" @click="deleteSelected"
                    class="flex items-center gap-1.5 h-9 px-3.5 bg-danger-dim text-danger border border-danger/30 rounded-xl cursor-pointer text-[12.5px] transition-all hover:bg-danger hover:text-black active:scale-95">
                    <IconTrash :size="14" />
                    Löschen
                </button>
            </div>
        </div>

        <!-- ── Sheets ─────────────────────────────────────────────── -->
        <ItemDetailSheet v-if="detailItem" :item="detailItem" @close="detailItem = null" @deleted="detailItem = null" />

        <CreatePickerSheet :open="createPickerOpen" @close="createPickerOpen = false" @pick="onCreatePick" />

        <CreateLocationSheet :open="createSubOpen" :parent-id="location.id" @close="createSubOpen = false"
            @created="onSubLocationCreated" />

        <CreateContainerSheet :open="createContainerOpen" :parent-id="location.id"
            @close="createContainerOpen = false" @created="onSubContainerCreated" />

        <ContainerEditor :open="editorOpen" :container="planContainer ?? null" :item-counts="itemCountByLocation"
            @close="editorOpen = false" @saved="editorOpen = false" />

        <LocationPickerSheet :open="movePickerOpen" :model-value="''" @update:model-value="onMoveTarget"
            @close="movePickerOpen = false" />

        <LocationPickerSheet :open="moveSelfOpen" :model-value="location.parentId ?? ''"
            @update:model-value="onMoveSelfTarget" @close="moveSelfOpen = false" />

        <DissolveLocationSheet v-if="dissolveOpen" :location="location" @close="dissolveOpen = false"
            @dissolved="onDissolved" />

        <!-- Action menu -->
        <UiSheet v-if="actionsOpen" :title="location.name" @close="actionsOpen = false">
            <div class="px-4 py-3 flex flex-col gap-1.5">
                <button v-for="action in actions" :key="action.label" type="button" @click="runAction(action.run)"
                    class="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98]"
                    :class="action.danger
                        ? 'bg-danger-dim border-danger/30 text-danger hover:bg-danger hover:text-black hover:border-danger'
                        : 'bg-bg-elevated border-border text-text-primary hover:border-text-muted'">
                    <component :is="action.icon" :size="18" class="shrink-0" />
                    <span class="flex-1 min-w-0">
                        <span class="block text-[14px]">{{ action.label }}</span>
                        <span class="block text-[11px] opacity-70">{{ action.hint }}</span>
                    </span>
                </button>
            </div>
        </UiSheet>
    </div>
</template>

<script setup lang="ts">
import type { ItemView, Location } from "~/types"
import { collectLeaves } from "~/repositories/containerRepository"
import { Pen, CornerUpRight, CornerUpLeft, Trash2 } from "lucide-vue-next"
import { errorMessage } from "~/utils/errorMessage"
import { itemCount, subLocationCount, zoneCount } from "~/utils/plural"
import type { CreateKind } from "~/components/CreatePickerSheet.vue"

interface ItemGroup {
    locationId: string
    label: string
    items: ItemView[]
}

const route = useRoute()
const router = useRouter()

const { ensureLoaded: loadLocations, updateLocation, moveLocation, createLocation } = useLocations()
const { ensureLoaded: loadItems, moveItems, deleteItem } = useItems()
const { ensureLoaded: loadContainers, createContainer, buildGridTree } = useContainers()
const {
    getLocation, ancestorsOf, containerOf, containerOwning, childrenOf, countsOf,
    itemsIn, decorateItem, itemCountByLocation,
} = useTopology()
const { openQuickAdd } = useQuickAdd()

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
    return groups.value.filter((g) => g.locationId === activeZoneId.value)
})

const visibleItemCount = computed(() =>
    visibleGroups.value.reduce((sum, g) => sum + g.items.length, 0)
)

/** In the split layout the right column is already narrow, so cards stay single-file. */
const wideGrid = computed(() => (planContainer.value ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"))

/** Headers only earn their space once there is more than one place to tell apart. */
const showGroupHeaders = computed(() => !!container.value && visibleGroups.value.length > 0)

const emptyMessage = computed(() => {
    if (activeZoneId.value) return `In „${zoneName(activeZoneId.value)}" liegt nichts.`
    if (container.value) return "Noch nichts einsortiert. Tippe oben ein Fach an, um gezielt dort abzulegen."
    if (isZone.value) return "In diesem Fach liegt nichts."
    return "Hier liegt noch nichts."
})

/** New items land in the focused zone, else in the location itself. */
const defaultAddLocationId = computed(() => activeZoneId.value ?? location.value?.id ?? null)

function zoneName(id: string): string {
    return groups.value.find((g) => g.locationId === id)?.label ?? "Fach"
}

function toggleZone(zoneLocationId: string) {
    activeZoneId.value = activeZoneId.value === zoneLocationId ? null : zoneLocationId
}

/** On a shelf a tap filters; on a compartment it is a sideways move to a sibling. */
function onZoneSelect(zoneLocationId: string) {
    if (!isZone.value) {
        toggleZone(zoneLocationId)
        return
    }
    if (zoneLocationId !== location.value?.id) router.push(`/orte/${zoneLocationId}`)
}

// ── Selection ─────────────────────────────────────────────────────────────────

const selectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const detailItem = ref<ItemView | null>(null)
const movePickerOpen = ref(false)

function toggleSelectMode() {
    selectMode.value = !selectMode.value
    selectedIds.value = new Set()
}

function onItemActivate(item: ItemView) {
    if (!selectMode.value) {
        detailItem.value = item
        return
    }
    const next = new Set(selectedIds.value)
    if (next.has(item.id)) next.delete(item.id)
    else next.add(item.id)
    selectedIds.value = next
}

async function onMoveTarget(targetId: string) {
    if (!targetId || !selectedIds.value.size) return
    await moveItems([...selectedIds.value], targetId)
    selectedIds.value = new Set()
    selectMode.value = false
}

async function deleteSelected() {
    const ids = [...selectedIds.value]
    if (!ids.length) return
    const ok = confirm(`${ids.length} Gegenstand${ids.length !== 1 ? "e" : ""} wirklich löschen?`)
    if (!ok) return
    for (const id of ids) await deleteItem(id)
    selectedIds.value = new Set()
    selectMode.value = false
}

// ── Rename / move / dissolve ──────────────────────────────────────────────────

const renaming = ref(false)
const renameDraft = ref("")
const renameRef = ref<HTMLInputElement>()
const actionsOpen = ref(false)
const createPickerOpen = ref(false)
const createSubOpen = ref(false)
const createContainerOpen = ref(false)
const editorOpen = ref(false)
const moveSelfOpen = ref(false)
const dissolveOpen = ref(false)
const actionError = ref("")
/** Captured before dissolving — afterwards this location no longer exists. */
let dissolveReturnTo = "/orte"

function openDissolve() {
    const parent = location.value?.parentId
    dissolveReturnTo = parent ? `/orte/${parent}` : "/orte"
    dissolveOpen.value = true
}

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
    const name = renameDraft.value.trim()
    if (!location.value || !name || name === location.value.name) {
        renaming.value = false
        return
    }
    await updateLocation(location.value.id, { name })
    renaming.value = false
}

/** The sheet only offers the two location kinds here — no item branch. */
function onCreatePick(type: CreateKind) {
    if (type === "location") createSubOpen.value = true
    else if (type === "container") createContainerOpen.value = true
}

function onSubLocationCreated(created: Location) {
    createSubOpen.value = false
    router.push(`/orte/${created.id}`)
}

async function onSubContainerCreated(name: string, width: number, height: number, useGrid: boolean) {
    if (!location.value) return
    createContainerOpen.value = false
    const created = await createLocation(name, location.value.id)
    await createContainer(
        name,
        created.id,
        { unit: "ratio", width, height },
        useGrid ? buildGridTree(width, height) : undefined
    )
    router.push(`/orte/${created.id}`)
}

async function onMoveSelfTarget(targetId: string) {
    if (!location.value) return
    actionError.value = ""
    try {
        await moveLocation(location.value.id, targetId || null)
    } catch (err) {
        actionError.value = errorMessage(err, "Verschieben fehlgeschlagen.")
    }
}

function onDissolved() {
    dissolveOpen.value = false
    router.replace(dissolveReturnTo)
}

const actions = computed(() => {
    const list: { label: string; hint: string; icon: unknown; danger?: boolean; run: () => void }[] = [
        { label: "Umbenennen", hint: "Namen dieses Ortes ändern", icon: Pen, run: startRename },
        { label: "Ort verschieben", hint: "Diesen Ort samt Inhalt woanders einhängen", icon: CornerUpRight, run: () => { moveSelfOpen.value = true } },
    ]
    if (location.value?.parentId) {
        list.push({
            label: "Zum Hauptort machen",
            hint: "Aus der Verschachtelung auf die oberste Ebene holen",
            icon: CornerUpLeft,
            run: () => { onMoveSelfTarget("") },
        })
    }
    list.push({
        label: "Ort auflösen",
        hint: "Pro Unterort und pro Gegenstand entscheiden",
        icon: Trash2,
        danger: true,
        run: openDissolve,
    })
    return list
})

function runAction(run: () => void) {
    actionsOpen.value = false
    nextTick(run)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

watch(locationId, () => {
    actionError.value = ""
    activeZoneId.value = null
    selectMode.value = false
    selectedIds.value = new Set()
    renaming.value = false
})

onMounted(() => {
    loadLocations()
    loadItems()
    loadContainers()
})
</script>

<style scoped>
/* Breadcrumb and action row scroll sideways on narrow screens without a bar. */
.trail {
    scrollbar-width: none;
}

.trail::-webkit-scrollbar {
    display: none;
}
</style>
