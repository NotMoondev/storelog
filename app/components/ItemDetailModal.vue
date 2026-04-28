<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal animate-slide-up">
        <!-- Header -->
        <div class="modal-header">
          <div class="item-icon">⊡</div>
          <div class="header-text">
            <div v-if="!editing" class="item-name">{{ localItem.name }}</div>
            <input
              v-else
              ref="nameRef"
              v-model="editForm.name"
              class="edit-name-input"
              @keydown.enter="saveEdit"
            />
          </div>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <!-- Location path -->
        <div class="location-display">
          <span class="loc-label">📍</span>
          <span class="loc-path">{{ locationPath }}</span>
        </div>

        <!-- Note -->
        <div v-if="localItem.note && !editing" class="note-display">
          {{ localItem.note }}
        </div>

        <!-- Edit form -->
        <div v-if="editing" class="edit-form">
          <div class="field">
            <label class="field-label">Ort</label>
            <div
              class="location-selector"
              :class="{ open: locationPickerOpen }"
              @click="locationPickerOpen = !locationPickerOpen"
            >
              <span v-if="selectedEditLocation" class="selected-location">
                {{ getLocationPath(selectedEditLocation.id).join(" / ") }}
              </span>
              <span v-else class="placeholder-text">Ort auswählen...</span>
              <span class="selector-arrow">{{ locationPickerOpen ? '▲' : '▼' }}</span>
            </div>
            <div v-if="locationPickerOpen" class="location-picker">
              <input
                v-model="locationSearch"
                type="text"
                placeholder="Ort suchen..."
                class="location-search"
                @click.stop
              />
              <div class="location-list">
                <div
                  v-for="loc in filteredLocations"
                  :key="loc.id"
                  class="location-option"
                  :class="{ selected: editForm.locationId === loc.id }"
                  :style="{ paddingLeft: `${12 + loc.indent * 16}px` }"
                  @click.stop="selectEditLocation(loc)"
                >
                  {{ loc.name }}
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Notiz</label>
            <input
              v-model="editForm.note"
              type="text"
              placeholder="Notiz..."
              class="field-input"
              @keydown.enter="saveEdit"
            />
          </div>
        </div>

        <!-- Meta -->
        <div class="item-meta">
          Hinzugefügt: {{ formatDate(localItem.createdAt) }}
        </div>

        <!-- Actions -->
        <div class="modal-footer">
          <template v-if="!editing">
            <button class="btn-danger" @click="confirmDelete">Löschen</button>
            <button class="btn-primary" @click="startEdit">Bearbeiten</button>
          </template>
          <template v-else>
            <button class="btn-secondary" @click="cancelEdit">Abbrechen</button>
            <button class="btn-primary" @click="saveEdit" :disabled="saving">
              {{ saving ? "..." : "Speichern" }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ItemWithPath } from "~/types";
import { useLocations } from "~/composables/useLocations";
import { useItems } from "~/composables/useItems";

const props = defineProps<{
  item: ItemWithPath;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [];
}>();

const { updateItem, deleteItem } = useItems();
const { flatList, getLocationPath } = useLocations();

const localItem = ref({ ...props.item });
const editing = ref(false);
const saving = ref(false);
const nameRef = ref<HTMLInputElement>();
const locationPickerOpen = ref(false);
const locationSearch = ref("");

const editForm = reactive({
  name: props.item.name,
  locationId: props.item.locationId,
  note: props.item.note || "",
});

const locationPath = computed(() =>
  getLocationPath(localItem.value.locationId).join(" / ")
);

const selectedEditLocation = computed(() =>
  flatList.value.find((l) => l.id === editForm.locationId)
);

const filteredLocations = computed(() => {
  if (!locationSearch.value) return flatList.value;
  const q = locationSearch.value.toLowerCase();
  return flatList.value.filter((l) => l.name.toLowerCase().includes(q));
});

function selectEditLocation(loc: (typeof flatList.value)[0]) {
  editForm.locationId = loc.id;
  locationPickerOpen.value = false;
}

function startEdit() {
  editing.value = true;
  nextTick(() => nameRef.value?.focus());
}

function cancelEdit() {
  editing.value = false;
  editForm.name = localItem.value.name;
  editForm.locationId = localItem.value.locationId;
  editForm.note = localItem.value.note || "";
}

async function saveEdit() {
  if (!editForm.name.trim() || saving.value) return;
  saving.value = true;
  try {
    await updateItem(localItem.value.id, {
      name: editForm.name.trim(),
      locationId: editForm.locationId,
      note: editForm.note.trim() || undefined,
    });
    localItem.value = {
      ...localItem.value,
      name: editForm.name.trim(),
      locationId: editForm.locationId,
      note: editForm.note.trim() || undefined,
    };
    editing.value = false;
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (confirm(`„${localItem.value.name}" wirklich löschen?`)) {
    await deleteItem(localItem.value.id);
    emit("deleted");
    emit("close");
  }
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}
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
}

.modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 560px;
  max-height: 88dvh;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.item-icon {
  font-size: 22px;
  color: var(--accent);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.item-name {
  font-family: "Syne", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.edit-name-input {
  font-family: "Syne", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--bg-elevated);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 4px 8px;
  width: 100%;
  outline: none;
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
  flex-shrink: 0;
  transition: all 0.1s;
}

.modal-close:hover {
  color: var(--text-primary);
}

.location-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.loc-label {
  font-size: 14px;
}

.loc-path {
  font-size: 13px;
  color: var(--accent);
  letter-spacing: 0.02em;
}

.note-display {
  padding: 12px 20px;
  font-size: 13px;
  color: var(--text-secondary);
  font-style: italic;
  border-bottom: 1px solid var(--border-subtle);
}

.edit-form {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-bottom: 1px solid var(--border-subtle);
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

.field-input {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: "DM Mono", monospace;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
}

.field-input:focus {
  border-color: var(--accent);
}

.location-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  min-height: 42px;
}

.location-selector.open {
  border-color: var(--accent);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.selected-location {
  font-size: 12px;
  color: var(--accent);
}

.placeholder-text {
  font-size: 12px;
  color: var(--text-muted);
}

.selector-arrow {
  font-size: 10px;
  color: var(--text-muted);
}

.location-picker {
  background: var(--bg-elevated);
  border: 1px solid var(--accent);
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.location-search {
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  padding: 8px 12px;
  font-family: "DM Mono", monospace;
  font-size: 12px;
  color: var(--text-primary);
  outline: none;
}

.location-search::placeholder {
  color: var(--text-muted);
}

.location-list {
  max-height: 160px;
  overflow-y: auto;
}

.location-option {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s;
}

.location-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.location-option.selected {
  color: var(--accent);
  background: var(--accent-dim);
}

.item-meta {
  padding: 12px 20px;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.modal-footer {
  padding: 14px 20px 20px;
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--border-subtle);
}

.btn-primary,
.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-family: "DM Mono", monospace;
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
  opacity: 0.5;
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-danger {
  background: var(--danger-dim);
  color: var(--danger);
  border: 1px solid rgba(192, 57, 43, 0.3);
}

.btn-danger:hover {
  background: var(--danger);
  color: #fff;
}
</style>
