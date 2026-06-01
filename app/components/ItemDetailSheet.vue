<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end lg:items-center justify-center"
            @click.self="$emit('close')">
            <div class="bg-bg-surface border-t lg:border border-border rounded-t-[20px] lg:rounded-[20px] w-full max-w-140 max-h-[88dvh] lg:max-h-[85vh] flex flex-col animate-slide-up lg:animate-fade-in"
                style="padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle -->
                <div class="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Header -->
                <div class="flex items-center gap-3 px-5 pt-2 pb-3.5 border-b border-border-subtle shrink-0">
                    <div class="text-accent shrink-0">
                        <IconBox :size="20" />
                    </div>
                    <div class="flex-1">
                        <div v-if="!editing" class="font-['Syne'] text-[20px] font-bold text-text-primary">{{
                            localItem.name }}</div>
                        <input v-else ref="nameRef" v-model="editForm.name" type="text" autocomplete="off"
                            spellcheck="false"
                            class="font-['Syne'] text-[20px] font-bold text-text-primary bg-bg-elevated border border-accent rounded-md px-2 py-1 w-full outline-none"
                            @keydown.enter="saveEdit" />
                    </div>
                    <button @click="$emit('close')"
                        class="bg-bg-elevated border border-border text-text-secondary w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95 hover:text-text-primary">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Location path -->
                <div class="flex items-center gap-2 px-5 py-3.5 border-b border-border-subtle shrink-0">
                    <span class="text-accent/60">
                        <IconMapPin :size="14" />
                    </span>
                    <span class="text-[14px] text-accent tracking-[0.02em]">{{ locationPath }}</span>
                </div>

                <!-- Note -->
                <div v-if="localItem.note && !editing"
                    class="px-5 py-3.5 text-[14px] text-text-secondary italic border-b border-border-subtle shrink-0">
                    {{ localItem.note }}
                </div>

                <!-- Edit form -->
                <div v-if="editing"
                    class="px-5 py-4 flex flex-col gap-4 border-b border-border-subtle overflow-y-auto flex-1">

                    <!-- Location field -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Ort</label>
                        <button type="button"
                            class="flex items-center justify-between bg-bg-elevated border rounded-lg px-3.5 py-3 w-full min-h-12 text-left transition-all"
                            :class="selectedEditLocation ? 'border-accent/60 text-accent' : 'border-border text-text-muted hover:border-text-muted'"
                            @click="locationPickerOpen = true">
                            <span class="text-[13px] leading-snug flex-1 truncate">
                                {{ selectedEditLocation ? getLocationPath(selectedEditLocation.id).join(' / ') : 'Ort auswählen…' }}
                            </span>
                            <IconChevronRight :size="16" class="shrink-0 ml-2 text-text-muted" />
                        </button>
                    </div>

                    <!-- Note field -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Notiz</label>
                        <input v-model="editForm.note" type="text" autocomplete="off" spellcheck="false"
                            placeholder="Notiz..."
                            class="bg-bg-elevated border border-border rounded-xl px-3.5 py-3.5 text-[14px] text-text-primary outline-none transition-colors focus:border-accent"
                            @keydown.enter="saveEdit" />
                    </div>
                </div>

                <!-- Meta -->
                <div class="px-5 py-3 text-[12px] text-text-muted tracking-[0.02em] shrink-0">
                    Hinzugefügt: {{ formatDate(localItem.createdAt) }}
                </div>

                <!-- Footer -->
                <div class="px-5 pt-3 pb-5 flex gap-3 border-t border-border-subtle shrink-0">
                    <template v-if="!editing">
                        <button @click="confirmDelete"
                            class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border transition-all bg-danger-dim text-danger border-danger/30 active:scale-[0.97] hover:bg-danger hover:text-black hover:border-danger">Löschen</button>
                        <button @click="startEdit"
                            class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] hover:brightness-110">Bearbeiten</button>
                    </template>
                    <template v-else>
                        <button @click="cancelEdit"
                            class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer transition-all bg-bg-elevated text-text-secondary border border-border active:scale-[0.97] hover:bg-bg-hover">Abbrechen</button>
                        <button @click="saveEdit" :disabled="saving"
                            class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">{{
                                saving ? "…" : "Speichern" }}</button>
                    </template>
                </div>

            </div>
        </div>

        <LocationPickerSheet
            :open="locationPickerOpen"
            :model-value="editForm.locationId"
            @update:model-value="(id) => { editForm.locationId = id }"
            @close="locationPickerOpen = false"
        />
    </Teleport>
</template>

<script setup lang="ts">
import type { ItemWithPath } from "~/types";
import { useLocations } from "~/composables/useLocations";
import { useItems } from "~/composables/useItems";

const props = defineProps<{ item: ItemWithPath }>();

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

const editForm = reactive({
    name: props.item.name,
    locationId: props.item.locationId,
    note: props.item.note || "",
});

const locationPath = computed(() => getLocationPath(localItem.value.locationId).join(" / "))
const selectedEditLocation = computed(() => flatList.value.find((l) => l.id === editForm.locationId))

function startEdit() {
    editing.value = true
    nextTick(() => nameRef.value?.focus())
}

function cancelEdit() {
    editing.value = false
    editForm.name = localItem.value.name
    editForm.locationId = localItem.value.locationId
    editForm.note = localItem.value.note || ""
}

async function saveEdit() {
    if (!editForm.name.trim() || saving.value) return
    saving.value = true
    try {
        await updateItem(localItem.value.id, {
            name: editForm.name.trim(),
            locationId: editForm.locationId,
            note: editForm.note.trim() || undefined,
        })
        localItem.value = {
            ...localItem.value,
            name: editForm.name.trim(),
            locationId: editForm.locationId,
            note: editForm.note.trim() || undefined,
        }
        editing.value = false
    } finally {
        saving.value = false
    }
}

async function confirmDelete() {
    if (confirm(`„${localItem.value.name}" wirklich löschen?`)) {
        await deleteItem(localItem.value.id)
        emit("deleted")
        emit("close")
    }
}

function formatDate(ts: number): string {
    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts))
}
</script>
