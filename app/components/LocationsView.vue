<!-- components/LocationsView.vue -->
<template>
    <div class="locations-view">

        <!-- Toolbar -->
        <div class="toolbar">
            <h2 class="view-title">Orte</h2>
            <button class="btn-add-root" @click="openCreate(null)">
                <IconPlus :size="16" /> Neuer Ort
            </button>
        </div>

        <!-- Search bar -->
        <div class="search-bar-container">
            <div class="search-bar" :class="{ active: searchQuery }">
                <span class="search-icon">◎</span>
                <input v-model="searchQuery" type="text" placeholder="Orte durchsuchen..." class="search-input"
                    autocomplete="off" spellcheck="false" />
                <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
            </div>
        </div>

        <!-- Tree -->
        <div class="tree-container">
            <div v-if="flatList.length === 0" class="empty-state">
                <div class="empty-icon">
                    <IconMapPinOff :size="48" />
                </div>
                <div class="empty-title">Noch keine Orte</div>
                <div class="empty-sub">Erstelle deinen ersten Ort um loszulegen.</div>
                <button class="btn-create-first" @click="openCreate(null)">
                    Ersten Ort erstellen
                </button>
            </div>

            <template v-else>
                <!-- Search results -->
                <div v-if="searchQuery" class="tree-list">
                    <div class="results-meta">
                        {{ filteredLocations.length }} Ergebnis{{ filteredLocations.length !== 1 ? 'se' : '' }}
                    </div>

                    <div v-if="filteredLocations.length === 0" class="empty-state" style="padding: 40px 24px">
                        <div class="empty-icon">
                            <IconMapPinOff :size="36" />
                        </div>
                        <div class="empty-title">Nichts gefunden</div>
                        <div class="empty-sub">Kein Ort für „{{ searchQuery }}" gefunden.</div>
                    </div>

                    <div v-for="loc in filteredLocations" :key="loc.id" class="tree-item animate-fade-in">
                        <div class="tree-item-inner" @click="openLocationDetail(loc)">
                            <div class="tree-item-left cursor-pointer">
                                <span class="tree-icon">
                                    <IconMapPin :size="16" />
                                </span>
                                <div class="tree-names">
                                    <span class="tree-name">
                                        <!-- Highlight matching chars -->
                                        <span v-for="(part, i) in highlightMatch(loc.name, searchQuery)" :key="i"
                                            :class="{ highlight: part.match }">{{ part.text }}</span>
                                    </span>
                                    <!-- Full path as breadcrumb -->
                                    <span class="tree-path">
                                        {{ getLocationPath(loc.id).slice(0, -1).join(' / ') }}
                                    </span>
                                    <span class="tree-count" v-if="itemCountByLocation[loc.id]">
                                        {{ itemCountByLocation[loc.id] }} Gegenstand{{ itemCountByLocation[loc.id] !== 1
                                        ? 'e' : '' }}
                                    </span>
                                </div>
                            </div>
                            <div class="tree-actions show">
                                <button class="action-btn" title="Unterort hinzufügen" @click="openCreate(loc.id)">
                                    <IconPlus :size="16" />
                                </button>
                                <button class="action-btn" title="Umbenennen" @click="startEdit(loc)">
                                    <IconPen :size="16" />
                                </button>
                                <button class="action-btn danger" title="Löschen" @click="handleDelete(loc)">
                                    <IconTrash :size="16" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Normal tree view -->
                <div v-else class="tree-list">
                    <div v-for="loc in flatList" :key="loc.id" class="tree-item animate-fade-in"
                        :style="{ paddingLeft: `${ loc.indent * 20}px` }">
                        <div class="tree-item-inner cursor-pointer" @click="openLocationDetail(loc)">
                            <div class="tree-item-left">
                                <span class="tree-connector" v-if="loc.indent > 0">
                                    <IconCornerDownRight :size="12" />
                                </span>
                                <span class="tree-icon">
                                    <IconMapPin :size="16" v-if="loc.indent === 0" />
                                    <IconMapPinPlus :size="14" v-else />
                                </span>
                                <div class="tree-names">
                                    <span v-if="editingId !== loc.id" class="tree-name">{{ loc.name }}</span>
                                    <input v-else
                                        :ref="el => { if (el) editInputRefs[loc.id] = el as HTMLInputElement }"
                                        v-model="editName" class="tree-edit-input" @keydown.enter="saveEdit(loc.id)"
                                        @keydown.escape="cancelEdit" @blur="cancelEdit" />
                                    <span class="tree-count" v-if="itemCountByLocation[loc.id]">
                                        {{ itemCountByLocation[loc.id] }} Gegenstand{{ itemCountByLocation[loc.id] !== 1
                                        ? 'e' : '' }}
                                    </span>
                                </div>
                            </div>
                            <div class="tree-actions" v-if="editingId !== loc.id">
                                <button class="action-btn" title="Unterort hinzufügen" @click="openCreate(loc.id)">
                                    <IconPlus :size="16" />
                                </button>
                                <button class="action-btn" title="Umbenennen" @click="startEdit(loc)">
                                    <IconPen :size="16" />
                                </button>
                                <button class="action-btn danger" title="Löschen" @click="handleDelete(loc)">
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
            <div v-if="locationDetail.open" class="modal-overlay" @click.self="closeLocationDetail">
                <div class="mini-modal animate-slide-up">
                    <div class="mini-modal-title">{{ locationDetail.location?.name }}</div>
                    <div class="mini-parent-hint" v-if="locationDetail.location?.parentId">
                        {{ getLocationPath(locationDetail.location.id).join(' › ') }}
                    </div>
                    <div v-if="locationItems.length === 0" class="empty-sub whitespace-nowrap" style="margin: 16px 0">
                        Keine Gegenstände in diesem Ort.
                    </div>
                    <ul v-else class="detail-item-list">
                        <li v-for="item in locationItems" :key="item.id" class="detail-item">
                            {{ item.name }}
                        </li>
                    </ul>
                    <div class="mini-actions">
                        <button class="btn-secondary" @click="closeLocationDetail">Schließen</button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Create Modal -->
        <Teleport to="body">
            <div v-if="createModal.open" class="modal-overlay" @click.self="createModal.open = false">
                <div class="mini-modal animate-slide-up">
                    <div class="mini-modal-title">
                        {{ createModal.parentId ? 'Unterort erstellen' : 'Neuen Ort erstellen' }}
                    </div>
                    <div v-if="createModal.parentId" class="mini-parent-hint">
                        in: {{ getLocationPath(createModal.parentId).join(' / ') }}
                    </div>
                    <input ref="createInputRef" v-model="createModal.name" type="text" placeholder="Name des Ortes..."
                        class="mini-input" @keydown.enter="submitCreate" @keydown.escape="createModal.open = false" />
                    <div class="mini-actions">
                        <button class="btn-secondary" @click="createModal.open = false">Abbrechen</button>
                        <button class="btn-primary" :disabled="!createModal.name.trim() || createModal.saving"
                            @click="submitCreate">
                            {{ createModal.saving ? '...' : 'Erstellen' }}
                        </button>
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

// ─── Search ───────────────────────────────────────────────────────────────────

const searchQuery = ref('')

const filteredLocations = computed(() => {
    if (!searchQuery.value.trim()) return flatList.value
    const q = searchQuery.value.toLowerCase()
    return flatList.value.filter(loc =>
        loc.name.toLowerCase().includes(q) ||
        getLocationPath(loc.id).join(' ').toLowerCase().includes(q)
    )
})

interface TextPart {
    text: string
    match: boolean
}

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

// ─── Tree edit ────────────────────────────────────────────────────────────────

const editingId = ref<string | null>(null)
const editName = ref('')
const editInputRefs = reactive<Record<string, HTMLInputElement>>({})
const createInputRef = ref<HTMLInputElement>()

function startEdit(loc: (typeof flatList.value)[0]) {
    editingId.value = loc.id
    editName.value = loc.name
    nextTick(() => {
        editInputRefs[loc.id]?.focus()
        editInputRefs[loc.id]?.select()
    })
}

function cancelEdit() {
    editingId.value = null
    editName.value = ''
}

async function saveEdit(id: string) {
    if (!editName.value.trim()) return
    await updateLocation(id, editName.value.trim())
    cancelEdit()
}

async function handleDelete(loc: (typeof flatList.value)[0]) {
    if (confirm(`„${loc.name}" löschen? Unterorte werden zum übergeordneten Ort verschoben.`)) {
        await deleteLocation(loc.id)
    }
}

// ─── Create modal ─────────────────────────────────────────────────────────────

const createModal = reactive({
    open: false,
    parentId: null as string | null,
    name: '',
    saving: false,
})

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

// ─── Location detail modal ────────────────────────────────────────────────────

const locationDetail = reactive({
    open: false,
    location: null as (typeof flatList.value)[0] | null,
})

const locationItems = computed(() => {
    if (!locationDetail.location) return []
    return items.value.filter(i => i.locationId === locationDetail.location?.id)
})

function openLocationDetail(loc: (typeof flatList.value)[0]) {
    locationDetail.location = loc
    locationDetail.open = true
}

function closeLocationDetail() {
    locationDetail.open = false
    locationDetail.location = null
}

// ─── Item counts ──────────────────────────────────────────────────────────────

const itemCountByLocation = computed(() => {
    const counts: Record<string, number> = {}
    for (const item of items.value) {
        counts[item.locationId] = (counts[item.locationId] || 0) + 1
    }
    return counts
})

onMounted(() => load())
</script>

<style scoped>
.locations-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
}

.view-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.btn-add-root {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-dim);
    color: var(--accent);
    border: 1px solid rgba(69, 163, 102, 0.6);
    border-radius: 7px;
    padding: 8px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
}

.btn-add-root:hover {
    background: var(--accent);
    color: #fff;
}

/* Search */
.search-bar-container {
    padding: 10px 16px 8px;
    flex-shrink: 0;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0 14px;
    height: 42px;
    transition: border-color 0.15s ease;
}

.search-bar:focus-within,
.search-bar.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
}

.search-icon {
    color: var(--text-muted);
    font-size: 15px;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-primary);
}

.search-input::placeholder {
    color: var(--text-muted);
}

.search-clear {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.1s;
}

.search-clear:hover {
    color: var(--text-secondary);
}

.results-meta {
    padding: 4px 4px 8px;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

/* Highlight */
.highlight {
    color: var(--accent);
    background: var(--accent-dim);
    border-radius: 2px;
    padding: 0 1px;
}

/* Path breadcrumb in search results */
.tree-path {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Tree */
.tree-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px 80px;
}

.tree-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tree-item {
    padding-right: 0;
    padding-top: 2px;
    padding-bottom: 2px;
}

.tree-item-inner {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 8px;
    transition: background 0.1s;
}

.tree-item-inner:hover {
    border-color: var(--border);
}

.tree-item-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.tree-connector {
    color: var(--text-muted);
    flex-shrink: 0;
}

.tree-icon {
    color: var(--accent);
    flex-shrink: 0;
}

.tree-names {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.tree-name {
    font-size: 15px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tree-count {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 0.03em;
}

.tree-edit-input {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-primary);
    background: var(--bg-elevated);
    border: 1px solid var(--accent);
    border-radius: 5px;
    padding: 3px 8px;
    outline: none;
    width: 100%;
    max-width: 200px;
}

.tree-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
}

.tree-actions.show {
    opacity: 1;
}

.tree-item-inner:hover .tree-actions {
    opacity: 1;
}

.action-btn {
    width: 32px;
    height: 32px;
    border-radius: 5px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
}

.action-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--text-muted);
}

.action-btn.danger:hover {
    background: var(--danger);
    color: #fff;
    border-color: var(--danger);
}

/* Empty */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    gap: 10px;
}

.empty-icon {
    color: var(--text-muted);
    margin-bottom: 8px;
}

.empty-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-secondary);
}

.empty-sub {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 240px;
}

.btn-create-first {
    margin-top: 12px;
    padding: 10px 20px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: filter 0.15s;
}

.btn-create-first:hover {
    filter: brightness(1.1);
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.mini-modal {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.mini-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.mini-parent-hint {
    font-size: 13px;
    color: var(--accent);
    margin-top: -8px;
}

.mini-input {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 16px;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
}

.mini-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
}

.mini-input::placeholder {
    color: var(--text-muted);
}

.mini-actions {
    display: flex;
    gap: 10px;
}

.btn-primary,
.btn-secondary {
    flex: 1;
    padding: 11px;
    border-radius: 7px;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
}

.btn-primary {
    background: var(--accent);
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
}

.btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.btn-secondary {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border);
}

/* Detail item list */
.detail-item-list {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 240px;
    overflow-y: auto;
}

.detail-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 14px;
    color: var(--text-primary);
}

.detail-item:last-child {
    border-bottom: none;
}
</style>