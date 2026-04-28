<template>
    <Teleport to="body">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal animate-slide-up">
                <div class="modal-header">
                    <h2 class="modal-title">Gegenstand hinzufügen</h2>
                    <button class="modal-close" @click="$emit('close')">✕</button>
                </div>

                <div class="modal-body">
                    <!-- Name -->
                    <div class="field">
                        <label class="field-label">Name *</label>
                        <input ref="nameRef" v-model="form.name" type="text" placeholder="z. B. Ladekabel, Schlüssel..."
                            class="field-input" @keydown.enter="focusLocation" />
                    </div>

                    <!-- Location -->
                    <div class="field">
                        <label class="field-label">Ort *</label>
                        <div class="location-selector" :class="{ open: locationPickerOpen }"
                            @click="locationPickerOpen = !locationPickerOpen">
                            <span v-if="selectedLocation" class="selected-location">
                                {{ getLocationPath(selectedLocation.id).join(" / ") }}
                            </span>
                            <span v-else class="placeholder-text">Ort auswählen...</span>
                            <span class="selector-arrow">{{ locationPickerOpen ? '▲' : '▼' }}</span>
                        </div>

                        <!-- Location picker dropdown -->
                        <div v-if="locationPickerOpen" class="location-picker">
                            <input v-model="locationSearch" type="text" placeholder="Ort suchen..."
                                class="location-search" @click.stop />
                            <div class="location-list">
                                <div v-for="loc in filteredLocations" :key="loc.id" class="location-option"
                                    :class="{ selected: form.locationId === loc.id }"
                                    :style="{ paddingLeft: `${12 + loc.indent * 16}px` }"
                                    @click.stop="selectLocation(loc)">
                                    <span class="loc-indent-icon" v-if="loc.indent > 0">└</span>
                                    {{ loc.name }}
                                </div>
                                <div v-if="filteredLocations.length === 0" class="loc-empty">
                                    Keine Orte gefunden
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Note -->
                    <div class="field">
                        <label class="field-label">Notiz <span class="optional">(optional)</span></label>
                        <input v-model="form.note" type="text" placeholder="Kurze Beschreibung..." class="field-input"
                            @keydown.enter="submit" />
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" @click="$emit('close')">Abbrechen</button>
                    <button class="btn-primary" :disabled="!canSubmit || saving" @click="submit">
                        {{ saving ? 'Speichern...' : 'Speichern' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import type { Location, LocationNode } from "~/types";
import { useLocations } from "~/composables/useLocations";
import { useItems } from "~/composables/useItems";

const emit = defineEmits<{
    close: [];
    saved: [];
}>();

const { flatList, getLocationPath, load: loadLocations } = useLocations();
const { createItem } = useItems();

const nameRef = ref<HTMLInputElement>();
const locationPickerOpen = ref(false);
const locationSearch = ref("");
const saving = ref(false);

const form = reactive({
    name: "",
    locationId: "",
    note: "",
});

const selectedLocation = computed(() =>
    flatList.value.find((l) => l.id === form.locationId)
);

const filteredLocations = computed(() => {
    if (!locationSearch.value) return flatList.value;
    const q = locationSearch.value.toLowerCase();
    return flatList.value.filter((l) => l.name.toLowerCase().includes(q));
});

const canSubmit = computed(() => form.name.trim() && form.locationId);

function focusLocation() {
    locationPickerOpen.value = true;
}

function selectLocation(loc: (typeof flatList.value)[0]) {
    form.locationId = loc.id;
    locationPickerOpen.value = false;
    locationSearch.value = "";
}

async function submit() {
    if (!canSubmit.value || saving.value) return;
    saving.value = true;
    try {
        await createItem({
            name: form.name.trim(),
            locationId: form.locationId,
            note: form.note.trim() || undefined,
        });
        emit("saved");
        emit("close");
    } finally {
        saving.value = false;
    }
}

onMounted(() => {
    nextTick(() => nameRef.value?.focus());
    loadLocations();
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
}

.modal {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 560px;
    max-height: 92dvh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
    font-family: "Syne", sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
}

.modal-close {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
}

.modal-close:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
}

.modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
}

.field-label {
    font-size: 11px;
    color: var(--text-secondary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.optional {
    color: var(--text-muted);
    text-transform: none;
    letter-spacing: 0;
}

.field-input {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    font-family: "DM Mono", monospace;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
}

.field-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
}

.field-input::placeholder {
    color: var(--text-muted);
}

.location-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    cursor: pointer;
    transition: border-color 0.15s;
    min-height: 46px;
}

.location-selector.open {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.selected-location {
    font-size: 13px;
    color: var(--accent);
    flex: 1;
    line-height: 1.4;
}

.placeholder-text {
    font-size: 13px;
    color: var(--text-muted);
    font-family: "DM Mono", monospace;
}

.selector-arrow {
    font-size: 10px;
    color: var(--text-muted);
    margin-left: 8px;
}

.location-picker {
    position: absolute;
    left: 0;
    right: 0;
    top: 5rem;
    z-index: 200;
    background: var(--bg-elevated);
    border: 1px solid var(--accent);
    border-top: none;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 0 3px var(--accent-glow);
}

.location-search {
    display: block;
    width: 100%;
    background: var(--bg-surface);
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 10px 14px;
    font-family: "DM Mono", monospace;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
}

.location-search::placeholder {
    color: var(--text-muted);
}

.location-list {
    max-height: 200px;
    overflow-y: auto;
}

.location-option {
    padding: 10px 12px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.1s;
    font-family: "DM Mono", monospace;
}

.location-option:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

.location-option.selected {
    color: var(--accent);
    background: var(--accent-dim);
}

.loc-indent-icon {
    color: var(--text-muted);
    font-size: 11px;
}

.loc-empty {
    padding: 16px;
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
}

.modal-footer {
    padding: 16px 20px 20px;
    display: flex;
    gap: 10px;
    border-top: 1px solid var(--border-subtle);
}

.btn-primary,
.btn-secondary {
    flex: 1;
    padding: 13px;
    border-radius: 8px;
    font-family: "DM Mono", monospace;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    letter-spacing: 0.03em;
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

.btn-secondary:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
}
</style>
