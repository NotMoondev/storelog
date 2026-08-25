<template>
    <UiSheet @close="$emit('close')">
        <template #header>
            <div class="text-accent shrink-0">
                <IconBox :size="20" />
            </div>
            <div class="flex-1 min-w-0">
                <h2 v-if="!editing" class="font-['Syne'] text-[19px] font-bold text-text-primary truncate">
                    {{ localItem.name }}
                </h2>
                <input v-else ref="nameRef" v-model="editForm.name" type="text" autocomplete="off" spellcheck="false"
                    aria-label="Name"
                    class="font-['Syne'] text-[19px] font-bold text-text-primary bg-bg-elevated border border-accent rounded-md px-2 py-1 w-full outline-none"
                    @keydown.enter="saveEdit" />
            </div>
        </template>

        <div class="flex flex-col">

            <!-- Where it is — the answer people opened this for -->
            <div class="px-5 py-4 border-b border-border-subtle flex items-start gap-3.5">
                <div v-if="localItem.container" class="w-[132px] shrink-0">
                    <ZoneMap :container="localItem.container" :highlight-id="localItem.zoneLocationId"
                        max-height="176px" :labels="false" />
                </div>
                <div class="min-w-0 flex-1 flex flex-col gap-1 pt-0.5">
                    <p class="text-[11px] text-text-secondary/70 tracking-[0.08em] uppercase">Liegt in</p>
                    <div class="flex items-center flex-wrap gap-x-1 gap-y-0.5">
                        <template v-for="(seg, i) in localItem.locationNames" :key="i">
                            <IconChevronRight v-if="i > 0" :size="10" class="text-text-muted" />
                            <span class="text-[13.5px]"
                                :class="i === localItem.locationNames.length - 1 ? 'text-accent font-medium' : 'text-text-secondary'">
                                {{ seg }}
                            </span>
                        </template>
                    </div>
                    <NuxtLink :to="`/orte/${localItem.locationId}`" @click="$emit('close')"
                        class="text-[11.5px] text-text-muted hover:text-accent transition-colors mt-1 inline-flex items-center gap-1">
                        Ort öffnen
                        <IconArrowRight :size="11" />
                    </NuxtLink>
                </div>
            </div>

            <!-- Note -->
            <div v-if="localItem.note && !editing"
                class="px-5 py-3.5 text-[14px] text-text-secondary italic border-b border-border-subtle">
                {{ localItem.note }}
            </div>

            <!-- Edit form -->
            <div v-if="editing" class="px-5 py-4 flex flex-col gap-4 border-b border-border-subtle">
                <div class="flex flex-col gap-1.5">
                    <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Ort</label>
                    <button type="button"
                        class="flex items-center justify-between bg-bg-elevated border rounded-lg px-3.5 py-3 w-full min-h-12 text-left transition-all"
                        :class="editForm.locationId ? 'border-accent/60 text-accent' : 'border-border text-text-muted'"
                        @click="locationPickerOpen = true">
                        <span class="text-[13px] leading-snug flex-1 truncate">
                            {{ editForm.locationId ? getLocationPath(editForm.locationId).join(' / ') : 'Ort auswählen…' }}
                        </span>
                        <IconChevronRight :size="16" class="shrink-0 ml-2 text-text-muted" />
                    </button>
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="item-note" class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Notiz</label>
                    <input id="item-note" v-model="editForm.note" type="text" autocomplete="off" spellcheck="false"
                        placeholder="Notiz…"
                        class="bg-bg-elevated border border-border rounded-xl px-3.5 py-3.5 text-[14px] text-text-primary outline-none transition-colors focus:border-accent"
                        @keydown.enter="saveEdit" />
                </div>
            </div>

            <!-- Who touched it -->
            <div class="px-5 py-3.5 flex flex-col gap-2">
                <div class="flex items-center flex-wrap gap-x-2 gap-y-1 text-[12px] text-text-muted">
                    <IconPlus :size="12" class="shrink-0" />
                    <span>Hinzugefügt von</span>
                    <UserBadge :user-id="localItem.createdBy" />
                    <span class="tabular-nums">· {{ formatDate(localItem.createdAt) }}</span>
                </div>
                <div v-if="lastEdit" class="flex items-center flex-wrap gap-x-2 gap-y-1 text-[12px] text-text-muted">
                    <IconPen :size="12" class="shrink-0" />
                    <span>Bearbeitet von</span>
                    <UserBadge :user-id="lastEdit.by" />
                    <span class="tabular-nums">· {{ formatDate(lastEdit.at) }}</span>
                </div>
            </div>
        </div>

        <template #footer>
            <!-- Moving is the action people repeat, so it leads. -->
            <div v-if="!editing" class="flex flex-col gap-2.5">
                <button type="button" @click="startMove"
                    class="w-full py-3.5 rounded-xl text-[14px] font-medium cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.98] hover:brightness-110 flex items-center justify-center gap-2">
                    <IconCornerUpRight :size="16" />
                    Verschieben
                </button>
                <div class="flex gap-3">
                    <button type="button" @click="confirmDelete"
                        class="flex-1 py-3 rounded-xl text-[13.5px] cursor-pointer border transition-all bg-danger-dim text-danger border-danger/30 active:scale-[0.97] hover:bg-danger hover:text-black hover:border-danger">
                        Löschen
                    </button>
                    <button type="button" @click="startEdit"
                        class="flex-1 py-3 rounded-xl text-[13.5px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                        Bearbeiten
                    </button>
                </div>
            </div>
            <div v-else class="flex gap-3">
                <button type="button" @click="cancelEdit"
                    class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer transition-all bg-bg-elevated text-text-secondary border border-border active:scale-[0.97] hover:bg-bg-hover">
                    Abbrechen
                </button>
                <button type="button" :disabled="saving" @click="saveEdit"
                    class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ saving ? '…' : 'Speichern' }}
                </button>
            </div>
        </template>

        <LocationPickerSheet :open="locationPickerOpen" :model-value="editForm.locationId"
            @update:model-value="onLocationPicked" @close="closePicker" />
    </UiSheet>
</template>

<script setup lang="ts">
import type { ItemView } from "~/types"

const props = defineProps<{ item: ItemView }>()

const emit = defineEmits<{
    close: []
    deleted: []
}>()

const { updateItem, moveItem, deleteItem } = useItems()
const { getLocationPath } = useLocations()
const { decorateItem } = useTopology()
const { remember } = useRecentLocations()
const { currentUser } = useUser()

const localItem = ref<ItemView>({ ...props.item })
const editing = ref(false)
const saving = ref(false)
const nameRef = ref<HTMLInputElement>()
const locationPickerOpen = ref(false)
/** Picking a location from the footer moves straight away; from the form it only fills the field. */
const pickerMovesDirectly = ref(false)

const editForm = reactive({
    name: props.item.name,
    locationId: props.item.locationId,
    note: props.item.note || "",
})

/** `updatedAt` is only set by a real edit, never on create. */
const lastEdit = computed(() => {
    const { updatedAt, updatedBy } = localItem.value
    if (!updatedAt) return null
    return { at: updatedAt, by: updatedBy ?? null }
})

function startMove() {
    pickerMovesDirectly.value = true
    locationPickerOpen.value = true
}

function closePicker() {
    locationPickerOpen.value = false
    pickerMovesDirectly.value = false
}

async function onLocationPicked(locationId: string) {
    if (!locationId) return
    if (!pickerMovesDirectly.value) {
        editForm.locationId = locationId
        return
    }
    pickerMovesDirectly.value = false
    await moveItem(localItem.value.id, locationId)
    remember(locationId)
    localItem.value = decorateItem({ ...localItem.value, locationId })
    editForm.locationId = locationId
}

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
        const patch = {
            name: editForm.name.trim(),
            locationId: editForm.locationId,
            note: editForm.note.trim() || undefined,
        }
        await updateItem(localItem.value.id, patch)
        remember(patch.locationId)
        localItem.value = decorateItem({
            ...localItem.value,
            ...patch,
            updatedBy: currentUser.value?.id ?? null,
            updatedAt: Date.now(),
        })
        editing.value = false
    } finally {
        saving.value = false
    }
}

async function confirmDelete() {
    if (!confirm(`„${localItem.value.name}" wirklich löschen?`)) return
    await deleteItem(localItem.value.id)
    emit("deleted")
    emit("close")
}

function formatDate(ts: number): string {
    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts))
}

// Keep in sync when the surrounding list refetches after a move.
watch(() => props.item, (next) => {
    localItem.value = { ...next }
    editForm.locationId = next.locationId
})
</script>
