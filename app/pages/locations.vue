<template>
    <div class="flex flex-col h-full lg:flex-row lg:overflow-hidden" ref="containerRef">

        <!-- Left column -->
        <div class="flex flex-col overflow-hidden lg:border-r lg:border-border shrink-0"
            :style="{ width: isDesktop ? leftWidth + 'px' : undefined }">

        <!-- Search bar -->
        <div class="px-4 pt-3 pb-2 shrink-0 flex items-center gap-2">
            <div class="flex-1 flex items-center gap-2.5 bg-bg-surface border border-border rounded-xl px-3.5 h-12 transition-all duration-150"
                :class="searchQuery ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]' : 'focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]'">
                <span class="text-text-muted shrink-0">
                    <IconMapPinSearch :size="16" />
                </span>
                <input v-model="searchQuery" type="search" placeholder="Orte durchsuchen..." autocomplete="off"
                    spellcheck="false"
                    class="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-muted" />
                <button v-if="searchQuery" @click="searchQuery = ''"
                    class="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded hover:text-text-secondary transition-colors">
                    <IconX :size="14" />
                </button>
            </div>
            <button @click="createPickerOpen = true"
                class="hidden lg:flex items-center gap-1.5 h-12 px-4 bg-accent text-black rounded-xl border-none cursor-pointer text-[13px] shrink-0 transition-all hover:brightness-110 active:scale-95">
                <IconPlus :size="15" />
                Neu
            </button>
        </div>

        <!-- Tree -->
        <div class="flex-1 overflow-y-auto px-4 pt-2 pb-20">

            <!-- Empty state -->
            <div v-if="flatList.length === 0"
                class="flex flex-col items-center justify-center py-20 px-6 text-center gap-2.5">
                <div class="text-text-muted mb-2">
                    <IconMapPinOff :size="48" />
                </div>
                <div class="font-['Syne'] text-[18px] font-semibold text-text-secondary">Noch keine Orte</div>
                <div class="text-[13px] text-text-muted max-w-60">Erstelle deinen ersten Ort um loszulegen.</div>
                <button @click="createPickerOpen = true"
                    class="mt-3 px-5 py-2.5 bg-accent text-black border-none rounded-lg text-[13px] cursor-pointer transition-all hover:brightness-110">
                    Ersten Ort erstellen
                </button>
            </div>

            <template v-else>

                <!-- Search results -->
                <div v-if="searchQuery" class="flex flex-col gap-1">
                    <div class="text-[12px] text-text-muted tracking-wider uppercase px-1 pb-2">
                        {{ filteredLocations.length }} Ergebnis{{ filteredLocations.length !== 1 ? 'se' : '' }}
                    </div>

                    <div v-if="filteredLocations.length === 0"
                        class="flex flex-col items-center justify-center py-10 px-6 text-center gap-2.5">
                        <div class="text-text-muted mb-2">
                            <IconMapPinOff :size="36" />
                        </div>
                        <div class="font-['Syne'] text-[18px] font-semibold text-text-secondary">Nichts gefunden</div>
                        <div class="text-[13px] text-text-muted">Kein Ort für „{{ searchQuery }}" gefunden.</div>
                    </div>

                    <div v-for="loc in filteredLocations" :key="loc.id" class="py-0.5 animate-fade-in">
                        <LocationListItem :loc="loc" :is-container="!!getContainerByLocationId(loc.id)"
                            :item-count="itemCountByLocation[loc.id]" :search-query="searchQuery"
                            :location-path="getLocationPath(loc.id)"
                            :selected="selectedLocation?.id === loc.id"
                            @click="handleLocationClick(loc)" />
                    </div>
                </div>

                <!-- Normal tree view -->
                <div v-else class="flex flex-col gap-1">
                    <div v-for="loc in visibleList" :key="loc.id" class="py-0.5 animate-fade-in"
                        :style="{ paddingLeft: `${loc.indent * 20}px` }">
                        <LocationListItem :loc="loc" :is-container="!!getContainerByLocationId(loc.id)"
                            :item-count="itemCountByLocation[loc.id]" :location-path="getLocationPath(loc.id)"
                            :indent="loc.indent" :has-children="childIds.has(loc.id)"
                            :collapsed="collapsedIds.has(loc.id)"
                            :selected="selectedLocation?.id === loc.id"
                            @click="handleLocationClick(loc)"
                            @toggle-collapse="toggleCollapse(loc.id)" />
                    </div>
                </div>

            </template>
        </div>

        <!-- FAB (mobile only) -->
        <button @click="createPickerOpen = true"
            class="lg:hidden fixed bottom-24 right-5 w-14 h-14 rounded-full bg-accent text-black text-[26px] border-none cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(74,222,128,0.4)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 animate-[pulse-accent_3s_ease_infinite] hover:scale-[1.08] hover:shadow-[0_6px_28px_rgba(74,222,128,0.55)] active:scale-95">
            <span class="leading-none -mt-0.5">+</span>
        </button>

        <!-- end left column -->
        </div>

        <!-- Resize handle (desktop only) -->
        <div class="hidden lg:flex items-center justify-center w-1.5 shrink-0 cursor-col-resize group relative z-10 hover:bg-accent/20 transition-colors"
            @mousedown="startResize">
            <div class="w-px h-8 bg-border rounded-full group-hover:bg-accent/60 transition-colors" />
        </div>

        <!-- Right panel: desktop detail view -->
        <div class="hidden lg:flex flex-col overflow-hidden flex-1">
            <div v-if="!selectedLocation" class="flex-1 flex items-center justify-center">
                <div class="text-center text-text-muted">
                    <IconMapPin :size="40" class="mx-auto mb-3 opacity-20" />
                    <div class="text-[14px]">Ort auswählen</div>
                </div>
            </div>
            <div v-else class="flex flex-col h-full overflow-hidden">
                <!-- Header -->
                <div class="px-6 py-5 border-b border-border-subtle shrink-0">
                    <!-- Normal state -->
                    <div v-if="!detailRenaming" class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <div class="font-['Syne'] text-[22px] font-bold text-text-primary leading-tight">{{ selectedLocation.name }}</div>
                            <div v-if="selectedLocation.parentId" class="text-[13px] text-accent mt-1">
                                {{ getLocationPath(selectedLocation.id).join(' › ') }}
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button v-if="selectedContainer" @click="openContainerEditor(selectedContainer!)"
                                class="flex items-center gap-1.5 px-3 py-2 bg-bg-elevated border border-border text-text-secondary rounded-xl text-[13px] cursor-pointer transition-all hover:text-text-primary hover:border-text-muted active:scale-95">
                                <IconLayoutGrid :size="14" />
                                Layout
                            </button>
                            <button @click="openCreate(selectedLocation.id)"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:text-text-primary hover:border-text-muted active:scale-95"
                                title="Unterort hinzufügen">
                                <IconPlus :size="16" />
                            </button>
                            <button @click="startDetailRename"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:text-text-primary hover:border-text-muted active:scale-95"
                                title="Umbenennen">
                                <IconPen :size="15" />
                            </button>
                            <button @click="deleteSelected"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:bg-danger hover:text-black hover:border-danger active:scale-95"
                                title="Löschen">
                                <IconTrash :size="15" />
                            </button>
                        </div>
                    </div>
                    <!-- Rename state -->
                    <div v-else class="flex items-center gap-2">
                        <input ref="detailRenameInput" v-model="detailRenameName" type="text" autocomplete="off" spellcheck="false"
                            class="flex-1 bg-bg-elevated border border-accent rounded-xl px-4 py-2.5 font-['Syne'] text-[20px] font-bold text-text-primary outline-none shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="saveDetailRename" @keydown.escape="cancelDetailRename" />
                        <button @click="cancelDetailRename"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:text-text-primary active:scale-95">
                            <IconX :size="16" />
                        </button>
                        <button @click="saveDetailRename"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-accent border-none text-black cursor-pointer transition-all hover:brightness-110 active:scale-95">
                            <IconCheck :size="16" />
                        </button>
                    </div>
                </div>
                <!-- Search -->
                <div class="px-6 pt-4 pb-2 shrink-0">
                    <div class="flex items-center gap-2 bg-bg-elevated border border-border rounded-lg px-3 h-9 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                        <IconSearch :size="14" class="text-text-muted shrink-0" />
                        <input v-model="selectedItemSearch" type="search" placeholder="Gegenstände durchsuchen..." autocomplete="off" spellcheck="false"
                            class="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-muted" />
                        <button v-if="selectedItemSearch" @click="selectedItemSearch = ''"
                            class="bg-transparent border-none text-text-muted cursor-pointer p-0.5 rounded hover:text-text-secondary transition-colors">
                            <IconX :size="12" />
                        </button>
                    </div>
                </div>
                <!-- Items -->
                <div class="flex-1 overflow-y-auto px-6 py-2">
                    <div class="text-[11px] text-text-muted tracking-wider uppercase mb-3">Gegenstände ({{ selectedLocationItemsFiltered.length }})</div>
                    <div v-if="selectedLocationItemsFiltered.length === 0" class="text-[14px] text-text-muted py-2">
                        {{ selectedItemSearch ? 'Keine Treffer.' : 'Keine Gegenstände in diesem Ort.' }}
                    </div>
                    <ul v-else class="m-0 p-0 list-none flex flex-col gap-1.5">
                        <li v-for="item in selectedLocationItemsFiltered" :key="item.id"
                            class="px-4 py-3 bg-bg-surface rounded-xl border border-border text-[14px] text-text-primary">
                            {{ item.name }}
                            <div v-if="item.note" class="text-[12px] text-text-muted mt-0.5">{{ item.note }}</div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Location Detail Sheet -->
        <Teleport to="body">
            <div v-if="locationDetail.open"
                class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end justify-center"
                @click.self="closeLocationDetail">
                <div class="bg-bg-surface border-t border-border rounded-t-[20px] w-full max-w-lg flex flex-col animate-slide-up"
                    style="max-height: 75dvh; padding-bottom: env(safe-area-inset-bottom, 0px)">

                    <!-- Drag handle -->
                    <div class="flex justify-center pt-3 pb-1 shrink-0">
                        <div class="w-10 h-1 rounded-full bg-border" />
                    </div>

                    <!-- Header -->
                    <div class="flex items-start justify-between px-5 pt-2 pb-4 border-b border-border-subtle shrink-0">
                        <!-- Normal state -->
                        <div v-if="!detailRenaming" class="flex-1 min-w-0">
                            <div class="font-['Syne'] text-[20px] font-bold text-text-primary leading-tight">{{
                                locationDetail.location?.name }}</div>
                            <div v-if="locationDetail.location?.parentId" class="text-[13px] text-accent mt-0.5">
                                {{ getLocationPath(locationDetail.location.id).join(' › ') }}
                            </div>
                        </div>
                        <!-- Rename state -->
                        <div v-else class="flex-1 flex items-center gap-2 mr-2">
                            <input ref="sheetRenameInput" v-model="detailRenameName" type="text" autocomplete="off" spellcheck="false"
                                class="flex-1 bg-bg-elevated border border-accent rounded-xl px-3.5 py-2 font-['Syne'] text-[18px] font-bold text-text-primary outline-none shadow-[0_0_0_3px_var(--accent-glow)]"
                                @keydown.enter="saveDetailRenameSheet" @keydown.escape="cancelDetailRename" />
                            <button @click="cancelDetailRename"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all hover:text-text-primary active:scale-95">
                                <IconX :size="16" />
                            </button>
                            <button @click="saveDetailRenameSheet"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-accent border-none text-black cursor-pointer transition-all hover:brightness-110 active:scale-95">
                                <IconCheck :size="16" />
                            </button>
                        </div>

                        <div v-if="!detailRenaming" class="flex items-center gap-2 shrink-0 ml-3">
                            <button v-if="locationDetailContainer" @click="openContainerEditor(locationDetailContainer!); closeLocationDetail()"
                                class="flex items-center gap-1.5 px-3 py-2 bg-bg-elevated border border-border text-text-secondary rounded-xl text-[13px] cursor-pointer transition-all hover:text-text-primary hover:border-text-muted active:scale-95">
                                <IconLayoutGrid :size="14" />
                                Layout
                            </button>
                            <button @click="closeLocationDetail"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all active:scale-95 hover:text-text-primary">
                                <IconX :size="18" />
                            </button>
                        </div>
                    </div>

                    <!-- Search -->
                    <div class="px-5 pt-3 pb-2 shrink-0">
                        <div class="flex items-center gap-2 bg-bg-elevated border border-border rounded-lg px-3 h-9 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                            <IconSearch :size="14" class="text-text-muted shrink-0" />
                            <input v-model="locationDetailSearch" type="search" placeholder="Gegenstände durchsuchen..." autocomplete="off" spellcheck="false"
                                class="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-muted" />
                            <button v-if="locationDetailSearch" @click="locationDetailSearch = ''"
                                class="bg-transparent border-none text-text-muted cursor-pointer p-0.5 rounded hover:text-text-secondary">
                                <IconX :size="12" />
                            </button>
                        </div>
                    </div>

                    <!-- Item list -->
                    <div v-if="locationItems.length === 0" class="px-5 py-8 text-[14px] text-text-muted text-center">
                        {{ locationDetailSearch ? 'Keine Treffer.' : 'Keine Gegenstände in diesem Ort.' }}
                    </div>
                    <ul v-else class="m-0 p-0 list-none overflow-y-auto flex-1">
                        <li v-for="item in locationItems" :key="item.id"
                            class="px-5 py-3.5 border-b border-border-subtle text-[15px] text-text-primary last:border-none">
                            {{ item.name }}
                            <div v-if="item.note" class="text-[12px] text-text-muted mt-0.5">{{ item.note }}</div>
                        </li>
                    </ul>

                    <!-- Footer -->
                    <div class="px-5 pt-3 pb-5 border-t border-border-subtle shrink-0">
                        <div v-if="!detailRenaming" class="grid grid-cols-3 gap-2">
                            <button @click="openCreate(locationDetail.location!.id); closeLocationDetail()"
                                class="flex flex-col items-center gap-1 py-3 rounded-xl text-[12px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                                <IconPlus :size="18" />
                                Unterort
                            </button>
                            <button @click="startDetailRenameSheet"
                                class="flex flex-col items-center gap-1 py-3 rounded-xl text-[12px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                                <IconPen :size="18" />
                                Umbenennen
                            </button>
                            <button @click="deleteSheetLocation"
                                class="flex flex-col items-center gap-1 py-3 rounded-xl text-[12px] cursor-pointer border transition-all bg-bg-elevated text-danger border-danger/30 active:scale-[0.97] hover:bg-danger hover:text-black hover:border-danger">
                                <IconTrash :size="18" />
                                Löschen
                            </button>
                        </div>
                        <div v-else class="flex gap-2">
                            <button @click="cancelDetailRename"
                                class="flex-1 py-3 rounded-xl text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97]">
                                Abbrechen
                            </button>
                            <button @click="saveDetailRenameSheet"
                                class="flex-1 py-3 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] hover:brightness-110">
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Create Location Sheet -->
        <CreateLocationSheet :open="createSheet.open" :parent-id="createSheet.parentId"
            @close="createSheet.open = false" @created="load" />

        <!-- Create Container Sheet -->
        <CreateContainerSheet :open="createContainerSheet.open" :parent-id="createContainerSheet.parentId"
            @close="createContainerSheet.open = false" @created="onContainerSheetCreated" />

        <!-- Create picker action sheet -->
        <CreatePickerSheet :open="createPickerOpen" @close="createPickerOpen = false" @pick="onPick" />

        <!-- Container Editor -->
        <ContainerEditor :open="containerEditor.open" :container="containerEditor.container"
            :item-counts="itemCountByLocation" @close="containerEditor.open = false" @saved="onContainerSaved" />

    </div>
</template>

<script setup lang="ts">
import type { Container } from '~/types/container'

const { flatList, getLocationPath, createLocation, updateLocation, deleteLocation, load } = useLocations()
const { items } = useItems()
const { containers, createContainer, buildGridTree, getContainerByLocationId, load: loadContainers } = useContainers()

// ── Search ────────────────────────────────────────────────────────────────────

const searchQuery = ref('')

const filteredLocations = computed(() => {
    if (!searchQuery.value.trim()) return flatList.value
    const q = searchQuery.value.toLowerCase()
    return flatList.value.filter(loc =>
        loc.name.toLowerCase().includes(q) ||
        getLocationPath(loc.id).join(' ').toLowerCase().includes(q)
    )
})

// ── Collapse ──────────────────────────────────────────────────────────────────

const collapsedIdsArray = usePersistedRef<string[]>('storelog:locations:collapsed', [])
const collapsedIds = computed({
    get: () => new Set(collapsedIdsArray.value),
    set: (s: Set<string>) => { collapsedIdsArray.value = [...s] }
})

const childIds = computed(() => {
    const set = new Set<string>()
    for (const loc of flatList.value) {
        if (loc.parentId) set.add(loc.parentId)
    }
    return set
})

const visibleList = computed(() => {
    const hiddenSubtrees = new Set<string>()
    return flatList.value.filter(loc => {
        if (loc.parentId && hiddenSubtrees.has(loc.parentId)) {
            hiddenSubtrees.add(loc.id)
            return false
        }
        if (collapsedIds.value.has(loc.id)) hiddenSubtrees.add(loc.id)
        return true
    })
})

function toggleCollapse(id: string) {
    const s = new Set(collapsedIdsArray.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    collapsedIdsArray.value = [...s]
}

// ── Detail rename / delete ────────────────────────────────────────────────────

const detailRenaming = ref(false)
const detailRenameName = ref('')
const detailRenameInput = ref<HTMLInputElement>()
const sheetRenameInput = ref<HTMLInputElement>()

function startDetailRename() {
    if (!selectedLocation.value) return
    detailRenameName.value = selectedLocation.value.name
    detailRenaming.value = true
    nextTick(() => { detailRenameInput.value?.focus(); detailRenameInput.value?.select() })
}

function startDetailRenameSheet() {
    if (!locationDetail.location) return
    detailRenameName.value = locationDetail.location.name
    detailRenaming.value = true
    nextTick(() => { sheetRenameInput.value?.focus(); sheetRenameInput.value?.select() })
}

function cancelDetailRename() {
    detailRenaming.value = false
    detailRenameName.value = ''
}

async function saveDetailRename() {
    if (!selectedLocation.value || !detailRenameName.value.trim()) { cancelDetailRename(); return }
    await updateLocation(selectedLocation.value.id, detailRenameName.value.trim())
    cancelDetailRename()
}

async function saveDetailRenameSheet() {
    if (!locationDetail.location || !detailRenameName.value.trim()) { cancelDetailRename(); return }
    await updateLocation(locationDetail.location.id, detailRenameName.value.trim())
    cancelDetailRename()
}

async function deleteSelected() {
    if (!selectedLocation.value) return
    if (confirm(`„${selectedLocation.value.name}" löschen? Unterorte werden zum übergeordneten Ort verschoben.`)) {
        await deleteLocation(selectedLocation.value.id)
        selectedLocation.value = null
    }
}

async function deleteSheetLocation() {
    if (!locationDetail.location) return
    if (confirm(`„${locationDetail.location.name}" löschen? Unterorte werden zum übergeordneten Ort verschoben.`)) {
        await deleteLocation(locationDetail.location.id)
        closeLocationDetail()
    }
}

// ── Create picker ─────────────────────────────────────────────────────────────

const createPickerOpen = ref(false)

function onPick(type: 'location' | 'container') {
    if (type === 'location') openCreate(null)
    else openCreateContainer(null)
}

// ── Create Location Sheet ─────────────────────────────────────────────────────

const createSheet = reactive({ open: false, parentId: null as string | null })

function openCreate(parentId: string | null) {
    createSheet.parentId = parentId
    createSheet.open = true
}

// ── Location click routing ────────────────────────────────────────────────────

function handleLocationClick(loc: (typeof flatList.value)[0]) {
    cancelDetailRename()
    if (window.matchMedia('(min-width: 1024px)').matches) {
        selectedLocation.value = loc
    } else {
        openLocationDetail(loc)
    }
}

// ── Location Detail Sheet ─────────────────────────────────────────────────────

const locationDetail = reactive({ open: false, location: null as (typeof flatList.value)[0] | null })
const locationDetailContainer = computed(() => locationDetail.location ? getContainerByLocationId(locationDetail.location.id) : null)
const locationDetailSearch = ref('')
const locationItems = computed(() => {
    const all = !locationDetail.location ? [] : items.value.filter(i => i.locationId === locationDetail.location?.id)
    if (!locationDetailSearch.value.trim()) return all
    const q = locationDetailSearch.value.toLowerCase()
    return all.filter(i => i.name.toLowerCase().includes(q) || i.note?.toLowerCase().includes(q))
})

function openLocationDetail(loc: (typeof flatList.value)[0]) { locationDetail.location = loc; locationDetail.open = true }
function closeLocationDetail() { locationDetail.open = false; locationDetail.location = null; locationDetailSearch.value = ''; cancelDetailRename() }

// ── Desktop detail panel ──────────────────────────────────────────────────────

const selectedLocation = ref<(typeof flatList.value)[0] | null>(null)
const selectedContainer = computed(() => selectedLocation.value ? getContainerByLocationId(selectedLocation.value.id) : null)
const selectedLocationItems = computed(() =>
    !selectedLocation.value ? [] : items.value.filter(i => i.locationId === selectedLocation.value?.id)
)
const selectedItemSearch = ref('')
const selectedLocationItemsFiltered = computed(() => {
    if (!selectedItemSearch.value.trim()) return selectedLocationItems.value
    const q = selectedItemSearch.value.toLowerCase()
    return selectedLocationItems.value.filter(i => i.name.toLowerCase().includes(q) || i.note?.toLowerCase().includes(q))
})

// ── Item counts ───────────────────────────────────────────────────────────────

const itemCountByLocation = computed(() => {
    const counts: Record<string, number> = {}
    for (const item of items.value) counts[item.locationId] = (counts[item.locationId] || 0) + 1
    return counts
})

// ── Create Container Sheet ────────────────────────────────────────────────────

const createContainerSheet = reactive({
    open: false,
    parentId: null as string | null,
})

function openCreateContainer(parentId: string | null) {
    createContainerSheet.parentId = parentId
    createContainerSheet.open = true
}

async function onContainerSheetCreated(name: string, width: number, height: number, useGrid: boolean) {
    const location = await createLocation(name, createContainerSheet.parentId)
    const initialRoot = useGrid ? buildGridTree(width, height) : undefined
    const container = await createContainer(
        name,
        location.id,
        { unit: 'ratio', width, height },
        initialRoot
    )
    createContainerSheet.open = false
    openContainerEditor(container)
}

// ── Container Editor ──────────────────────────────────────────────────────────

const containerEditor = reactive<{ open: boolean; container: Container | null }>({
    open: false,
    container: null,
})

function openContainerEditor(container: Container) {
    containerEditor.container = container
    containerEditor.open = true
}

async function onContainerSaved(updated: Container) {
    containerEditor.container = updated
    await load()
}

// ── Resizable split ──────────────────────────────────────────────────────────

const containerRef = ref<HTMLElement | null>(null)
const leftWidth = usePersistedRef<number>('storelog:locations:splitWidth', 340)
const isDesktop = ref(false)

onMounted(() => {
    isDesktop.value = window.matchMedia('(min-width: 1024px)').matches
    const mql = window.matchMedia('(min-width: 1024px)')
    mql.addEventListener('change', e => { isDesktop.value = e.matches })
    load()
    loadContainers()
})

function startResize(e: MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = leftWidth.value
    function onMove(ev: MouseEvent) {
        const delta = ev.clientX - startX
        const total = containerRef.value?.offsetWidth ?? 0
        leftWidth.value = Math.min(Math.max(220, startWidth + delta), total - 280)
    }
    function onUp() {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
}
</script>
