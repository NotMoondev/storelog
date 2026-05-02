<template>
    <div class="flex flex-col h-full">

        <!-- Toolbar -->
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle shrink-0">
            <h2 class="font-['Syne'] text-[20px] font-bold text-text-primary">Orte</h2>
            <button @click="openCreate(null)"
                class="flex items-center gap-1.5 bg-accent-dim text-accent border border-accent/60 rounded-[7px] px-3.5 py-2 font-['DM_Mono'] text-sm cursor-pointer transition-all duration-150 hover:bg-accent hover:text-white">
                <IconPlus :size="16" /> Neuer Ort
            </button>
        </div>

        <!-- Search bar -->
        <div class="px-4 pt-2.5 pb-2 shrink-0">
            <div class="flex items-center gap-2.5 bg-bg-surface border border-border rounded-[10px] px-3.5 h-10.5 transition-all duration-150"
                :class="searchQuery ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]' : 'focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]'">
                <span class="text-text-muted text-[15px] shrink-0">◎</span>
                <input v-model="searchQuery" type="text" placeholder="Orte durchsuchen..." autocomplete="off"
                    spellcheck="false"
                    class="flex-1 bg-transparent border-none outline-none font-['DM_Mono'] text-[13px] text-text-primary placeholder:text-text-muted" />
                <button v-if="searchQuery" @click="searchQuery = ''"
                    class="bg-transparent border-none text-text-muted cursor-pointer text-[11px] p-1 rounded hover:text-text-secondary transition-colors">✕</button>
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
                    <div class="text-[11px] text-text-muted tracking-wider uppercase px-1 pb-2">
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
                        <div class="bg-bg-surface border border-border-subtle flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:border-border cursor-pointer group"
                            @click="openLocationDetail(loc)">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span class="text-accent shrink-0">
                                    <IconMapPin :size="16" />
                                </span>
                                <div class="flex flex-col min-w-0">
                                    <span
                                        class="text-[15px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                                        <span v-for="(part, i) in highlightMatch(loc.name, searchQuery)" :key="i"
                                            :class="part.match ? 'text-accent bg-accent-dim rounded-sm px-px' : ''">{{
                                                part.text }}</span>
                                    </span>
                                    <span
                                        class="text-[10px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                                        {{ getLocationPath(loc.id).slice(0, -1).join(' / ') }}
                                    </span>
                                    <span v-if="itemCountByLocation[loc.id]"
                                        class="text-[10px] text-text-muted tracking-[0.03em]">
                                        {{ itemCountByLocation[loc.id] }} Gegenstand{{ itemCountByLocation[loc.id] !== 1
                                            ? 'e' : '' }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    class="w-8 h-8 rounded-[5px] bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"
                                    title="Unterort hinzufügen" @click.stop="openCreate(loc.id)">
                                    <IconPlus :size="16" />
                                </button>
                                <button
                                    class="w-8 h-8 rounded-[5px] bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"
                                    title="Umbenennen" @click.stop="startEdit(loc)">
                                    <IconPen :size="16" />
                                </button>
                                <button
                                    class="w-8 h-8 rounded-[5px] bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:border-danger"
                                    title="Löschen" @click.stop="handleDelete(loc)">
                                    <IconTrash :size="16" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Normal tree view -->
                <div v-else class="flex flex-col gap-1">
                    <div v-for="loc in flatList" :key="loc.id" class="py-0.5 animate-fade-in"
                        :style="{ paddingLeft: `${loc.indent * 20}px` }">
                        <div class="bg-bg-surface border border-border-subtle flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:border-border cursor-pointer group"
                            @click="openLocationDetail(loc)">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span v-if="loc.indent > 0" class="text-text-muted shrink-0">
                                    <IconCornerDownRight :size="12" />
                                </span>
                                <span class="text-accent shrink-0">
                                    <IconMapPin :size="16" v-if="loc.indent === 0" />
                                    <IconMapPinPlus :size="14" v-else />
                                </span>
                                <div class="flex flex-col min-w-0">
                                    <span v-if="editingId !== loc.id"
                                        class="text-[15px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                                        {{ loc.name }}
                                    </span>
                                    <input v-else
                                        :ref="el => { if (el) editInputRefs[loc.id] = el as HTMLInputElement }"
                                        v-model="editName"
                                        class="font-['DM_Mono'] text-[13px] text-text-primary bg-bg-elevated border border-accent rounded-[5px] px-2 py-0.5 outline-none w-full max-w-50"
                                        @keydown.enter="saveEdit(loc.id)" @keydown.escape="cancelEdit"
                                        @blur="cancelEdit" />
                                    <span v-if="itemCountByLocation[loc.id]"
                                        class="text-[10px] text-text-muted tracking-[0.03em]">
                                        {{ itemCountByLocation[loc.id] }} Gegenstand{{ itemCountByLocation[loc.id] !== 1
                                            ? 'e' : '' }}
                                    </span>
                                </div>
                            </div>
                            <div v-if="editingId !== loc.id"
                                class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    class="w-8 h-8 rounded-[5px] bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"
                                    title="Unterort hinzufügen" @click.stop="openCreate(loc.id)">
                                    <IconPlus :size="16" />
                                </button>
                                <button
                                    class="w-8 h-8 rounded-[5px] bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-bg-hover hover:text-text-primary hover:border-text-muted"
                                    title="Umbenennen" @click.stop="startEdit(loc)">
                                    <IconPen :size="16" />
                                </button>
                                <button
                                    class="w-8 h-8 rounded-[5px] bg-bg-elevated border border-border text-text-secondary cursor-pointer flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:border-danger"
                                    title="Löschen" @click.stop="handleDelete(loc)">
                                    <IconTrash :size="16" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </template>
        </div>

        <!-- Location Detail Modal -->
        <Teleport to="body">
            <div v-if="locationDetail.open"
                class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-center justify-center p-5"
                @click.self="closeLocationDetail">
                <div
                    class="bg-bg-surface border border-border rounded-[14px] p-6 w-full max-w-90 flex flex-col gap-3.5 animate-slide-up">
                    <div class="font-['Syne'] text-[20px] font-bold text-text-primary">{{ locationDetail.location?.name
                    }}</div>
                    <div v-if="locationDetail.location?.parentId" class="text-[13px] text-accent -mt-2">
                        {{ getLocationPath(locationDetail.location.id).join(' › ') }}
                    </div>
                    <div v-if="locationItems.length === 0" class="text-[13px] text-text-muted whitespace-nowrap my-4">
                        Keine Gegenstände in diesem Ort.
                    </div>
                    <ul v-else class="m-0 p-0 list-none max-h-60 overflow-y-auto">
                        <li v-for="item in locationItems" :key="item.id"
                            class="py-2 border-b border-border-subtle text-sm text-text-primary last:border-none">
                            {{ item.name }}
                        </li>
                    </ul>
                    <div class="flex gap-2.5">
                        <button @click="closeLocationDetail"
                            class="flex-1 py-2.75 rounded-[7px] font-['DM_Mono'] text-[13px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border hover:bg-bg-hover">Schließen</button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Create Modal -->
        <Teleport to="body">
            <div v-if="createModal.open"
                class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-center justify-center p-5"
                @click.self="createModal.open = false">
                <div
                    class="bg-bg-surface border border-border rounded-[14px] p-6 w-full max-w-90 flex flex-col gap-3.5 animate-slide-up">
                    <div class="font-['Syne'] text-[20px] font-bold text-text-primary">
                        {{ createModal.parentId ? 'Unterort erstellen' : 'Neuen Ort erstellen' }}
                    </div>
                    <div v-if="createModal.parentId" class="text-[13px] text-accent -mt-2">
                        in: {{ getLocationPath(createModal.parentId).join(' / ') }}
                    </div>
                    <input ref="createInputRef" v-model="createModal.name" type="text" placeholder="Name des Ortes..."
                        class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 font-['DM_Mono'] text-base text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                        @keydown.enter="submitCreate" @keydown.escape="createModal.open = false" />
                    <div class="flex gap-2.5">
                        <button @click="createModal.open = false"
                            class="flex-1 py-2.75 rounded-[7px] font-['DM_Mono'] text-[13px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border hover:bg-bg-hover">Abbrechen</button>
                        <button :disabled="!createModal.name.trim() || createModal.saving" @click="submitCreate"
                            class="flex-1 py-2.75 rounded-[7px] font-['DM_Mono'] text-[13px] cursor-pointer border-none transition-all bg-accent text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">{{
                                createModal.saving ? '...' : 'Erstellen' }}</button>
                    </div>
                </div>
            </div>
        </Teleport>

    </div>
</template>

<script setup lang="ts">
import { useLocations } from '~/composables/useLocations'
import { useItems } from '~/composables/useItems'

const { flatList, getLocationPath, createLocation, updateLocation, deleteLocation, load } = useLocations()
const { items } = useItems()

const searchQuery = ref('')

const filteredLocations = computed(() => {
    if (!searchQuery.value.trim()) return flatList.value
    const q = searchQuery.value.toLowerCase()
    return flatList.value.filter(loc =>
        loc.name.toLowerCase().includes(q) ||
        getLocationPath(loc.id).join(' ').toLowerCase().includes(q)
    )
})

interface TextPart { text: string; match: boolean }

function highlightMatch(text: string, query: string): TextPart[] {
    if (!query) return [{ text, match: false }]
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return [{ text, match: false }]
    return [
        { text: text.slice(0, idx), match: false },
        { text: text.slice(idx, idx + query.length), match: true },
        { text: text.slice(idx + query.length), match: false },
    ].filter(p => p.text.length > 0)
}

const editingId = ref<string | null>(null)
const editName = ref('')
const editInputRefs = reactive<Record<string, HTMLInputElement>>({})
const createInputRef = ref<HTMLInputElement>()

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

const createModal = reactive({ open: false, parentId: null as string | null, name: '', saving: false })

function openCreate(parentId: string | null) {
    createModal.parentId = parentId
    createModal.name = ''
    createModal.open = true
    nextTick(() => createInputRef.value?.focus())
}

async function submitCreate() {
    if (!createModal.name.trim() || createModal.saving) return
    createModal.saving = true
    try {
        await createLocation(createModal.name.trim(), createModal.parentId)
        createModal.open = false
    } finally {
        createModal.saving = false
    }
}

const locationDetail = reactive({ open: false, location: null as (typeof flatList.value)[0] | null })
const locationItems = computed(() => !locationDetail.location ? [] : items.value.filter(i => i.locationId === locationDetail.location?.id))

function openLocationDetail(loc: (typeof flatList.value)[0]) { locationDetail.location = loc; locationDetail.open = true }
function closeLocationDetail() { locationDetail.open = false; locationDetail.location = null }

const itemCountByLocation = computed(() => {
    const counts: Record<string, number> = {}
    for (const item of items.value) counts[item.locationId] = (counts[item.locationId] || 0) + 1
    return counts
})

onMounted(() => load())
</script>