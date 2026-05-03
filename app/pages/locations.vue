<template>
    <div class="flex flex-col h-full">

        <!-- Toolbar -->
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle shrink-0">
            <h2 class="font-['Syne'] text-[20px] font-bold text-text-primary">Orte</h2>
            <button @click="createPickerOpen = true"
                class="flex items-center gap-1.5 bg-accent-dim text-accent border border-accent/60 rounded-[10px] px-3.5 py-2 font-['DM_Mono'] text-sm cursor-pointer transition-all duration-150 active:scale-95 hover:bg-accent hover:text-white">
                <IconPlus :size="16" /> Neu
            </button>
        </div>

        <!-- Search bar -->
        <div class="px-4 pt-2.5 pb-2 shrink-0">
            <div class="flex items-center gap-2.5 bg-bg-surface border border-border rounded-xl px-3.5 h-12 transition-all duration-150"
                :class="searchQuery ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]' : 'focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]'">
                <span class="text-text-muted shrink-0">
                    <IconMapPinSearch :size="16" />
                </span>
                <input v-model="searchQuery" type="text" placeholder="Orte durchsuchen..." autocomplete="off"
                    spellcheck="false"
                    class="flex-1 bg-transparent border-none outline-none font-['DM_Mono'] text-[14px] text-text-primary placeholder:text-text-muted" />
                <button v-if="searchQuery" @click="searchQuery = ''"
                    class="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded hover:text-text-secondary transition-colors">
                    <IconX :size="14" />
                </button>
            </div>
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
                <button @click="openCreate(null)"
                    class="mt-3 px-5 py-2.5 bg-accent text-white border-none rounded-lg font-['DM_Mono'] text-[13px] cursor-pointer transition-all hover:brightness-110">
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
                            :location-path="getLocationPath(loc.id)" @click="handleLocationClick(loc)"
                            @add-child="openCreate(loc.id)" @rename="startEdit(loc)" @delete="handleDelete(loc)" />
                    </div>
                </div>

                <!-- Normal tree view -->
                <div v-else class="flex flex-col gap-1">
                    <div v-for="loc in flatList" :key="loc.id" class="py-0.5 animate-fade-in"
                        :style="{ paddingLeft: `${loc.indent * 20}px` }">

                        <!-- Editing inline -->
                        <div v-if="editingId === loc.id"
                            class="bg-bg-surface border border-accent rounded-xl px-3.5 py-3 flex items-center gap-2.5 shadow-[0_0_0_3px_var(--accent-glow)]">
                            <span class="text-accent shrink-0">
                                <IconMapPin :size="16" />
                            </span>
                            <input :ref="el => { if (el) editInputRefs[loc.id] = el as HTMLInputElement }"
                                v-model="editName"
                                class="font-['DM_Mono'] text-[15px] text-text-primary bg-transparent border-none outline-none flex-1"
                                @keydown.enter="saveEdit(loc.id)" @keydown.escape="cancelEdit" @blur="cancelEdit" />
                        </div>

                        <LocationListItem v-else :loc="loc" :is-container="!!getContainerByLocationId(loc.id)"
                            :item-count="itemCountByLocation[loc.id]" :location-path="getLocationPath(loc.id)"
                            :indent="loc.indent" @click="handleLocationClick(loc)" @add-child="openCreate(loc.id)"
                            @rename="startEdit(loc)" @delete="handleDelete(loc)" />
                    </div>
                </div>

            </template>
        </div>

        <!-- Location Detail Sheet -->
        <Teleport to="body">
            <div v-if="locationDetail.open"
                class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end justify-center"
                @click.self="closeLocationDetail">
                <div
                    class="bg-bg-surface border-t border-border rounded-t-[20px] w-full max-w-lg flex flex-col animate-slide-up"
                    style="max-height: 75dvh; padding-bottom: env(safe-area-inset-bottom, 0px)">

                    <!-- Drag handle -->
                    <div class="flex justify-center pt-3 pb-1 shrink-0">
                        <div class="w-10 h-1 rounded-full bg-border" />
                    </div>

                    <!-- Header -->
                    <div class="flex items-start justify-between px-5 pt-2 pb-4 border-b border-border-subtle shrink-0">
                        <div>
                            <div class="font-['Syne'] text-[20px] font-bold text-text-primary">{{
                                locationDetail.location?.name }}</div>
                            <div v-if="locationDetail.location?.parentId" class="text-[13px] text-accent mt-0.5">
                                {{ getLocationPath(locationDetail.location.id).join(' › ') }}
                            </div>
                        </div>
                        <button @click="closeLocationDetail"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all active:scale-95 hover:text-text-primary shrink-0 ml-3">
                            <IconX :size="18" />
                        </button>
                    </div>

                    <!-- Item list -->
                    <div v-if="locationItems.length === 0" class="px-5 py-8 text-[14px] text-text-muted text-center">
                        Keine Gegenstände in diesem Ort.
                    </div>
                    <ul v-else class="m-0 p-0 list-none overflow-y-auto flex-1">
                        <li v-for="item in locationItems" :key="item.id"
                            class="px-5 py-3.5 border-b border-border-subtle text-[15px] text-text-primary last:border-none">
                            {{ item.name }}
                        </li>
                    </ul>

                    <!-- Footer -->
                    <div class="px-5 pt-3 pb-5 border-t border-border-subtle shrink-0">
                        <button @click="closeLocationDetail"
                            class="w-full py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:bg-bg-hover">
                            Schließen
                        </button>
                    </div>

                </div>
            </div>
        </Teleport>

        <!-- Create Location Sheet -->
        <CreateLocationSheet
            :open="createSheet.open"
            :parent-id="createSheet.parentId"
            @close="createSheet.open = false"
            @created="load" />

        <!-- Create Container Sheet -->
        <CreateContainerSheet
            :open="createContainerSheet.open"
            :parent-id="createContainerSheet.parentId"
            @close="createContainerSheet.open = false"
            @created="onContainerSheetCreated" />

        <!-- Create picker action sheet -->
        <CreatePickerSheet :open="createPickerOpen" @close="createPickerOpen = false"
            @pick="onPick" />

        <!-- Container Editor -->
        <ContainerEditor :open="containerEditor.open" :container="containerEditor.container"
            :item-counts="itemCountByLocation" @close="containerEditor.open = false" @saved="onContainerSaved" />

    </div>
</template>

<script setup lang="ts">
import type { Container } from '~/types/container'

const { flatList, getLocationPath, createLocation, updateLocation, deleteLocation, load } = useLocations()
const { items } = useItems()
const { containers, createContainer, getContainerByLocationId, load: loadContainers } = useContainers()

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

// ── Inline edit ───────────────────────────────────────────────────────────────

const editingId = ref<string | null>(null)
const editName = ref('')
const editInputRefs = reactive<Record<string, HTMLInputElement>>({})

function startEdit(loc: (typeof flatList.value)[0]) {
    editingId.value = loc.id
    editName.value = loc.name
    nextTick(() => { editInputRefs[loc.id]?.focus(); editInputRefs[loc.id]?.select() })
}

function cancelEdit() { editingId.value = null; editName.value = '' }

async function saveEdit(id: string) {
    if (!editName.value.trim()) return
    await updateLocation(id, editName.value.trim())
    cancelEdit()
}

async function handleDelete(loc: (typeof flatList.value)[0]) {
    if (confirm(`„${loc.name}" löschen? Unterorte werden zum übergeordneten Ort verschoben.`))
        await deleteLocation(loc.id)
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
    const container = getContainerByLocationId(loc.id)
    if (container) {
        openContainerEditor(container)
    } else {
        openLocationDetail(loc)
    }
}

// ── Location Detail Sheet ─────────────────────────────────────────────────────

const locationDetail = reactive({ open: false, location: null as (typeof flatList.value)[0] | null })
const locationItems = computed(() => !locationDetail.location ? [] : items.value.filter(i => i.locationId === locationDetail.location?.id))

function openLocationDetail(loc: (typeof flatList.value)[0]) { locationDetail.location = loc; locationDetail.open = true }
function closeLocationDetail() { locationDetail.open = false; locationDetail.location = null }

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

async function onContainerSheetCreated(name: string, width: number, height: number) {
    const location = await createLocation(name, createContainerSheet.parentId)
    const container = await createContainer(
        name,
        location.id,
        { unit: 'ratio', width, height }
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

function onContainerSaved(updated: Container) {
    containerEditor.container = updated
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
    load()
    loadContainers()
})
</script>
