<template>
    <UiSheet :title="localItem.name" @close="$emit('close')">
        <template #header>
            <div class="flex-1 min-w-0">
                <UiTextField v-if="editing === 'name'" ref="nameRef" v-model="draft" variant="title"
                    @enter="commit" @escape="cancel" @blur="commit" />
                <button v-else type="button" class="flex items-center gap-2 max-w-full text-left cursor-text"
                    :aria-label="`${localItem.name} umbenennen`" @click="startEdit('name')">
                    <h2 class="font-name text-title-md text-text-primary truncate">{{ localItem.name }}</h2>
                    <Pen :size="16" class="text-text-muted shrink-0" />
                </button>
            </div>
        </template>

        <div class="flex flex-col">

            <!-- Where it is: the answer people opened this for -->
            <div class="px-5 pt-1 pb-4 flex items-start gap-4 border-b border-border-subtle">
                <div v-if="localItem.container" class="w-32 shrink-0">
                    <ZoneMap :container="localItem.container" :highlight-id="localItem.zoneLocationId"
                        max-height="176px" :labels="false" />
                </div>
                <div class="min-w-0 flex-1 flex flex-col gap-1">
                    <p class="eyebrow">Liegt in</p>
                    <p class="flex items-center flex-wrap gap-x-1 text-body text-text-secondary">
                        <template v-for="(seg, i) in localItem.locationNames" :key="i">
                            <ChevronRight v-if="i > 0" :size="14" class="text-text-muted" />
                            <span :class="i === localItem.locationNames.length - 1 ? 'text-accent-text font-medium' : ''">
                                {{ seg }}
                            </span>
                        </template>
                    </p>
                    <NuxtLink :to="`/orte/${localItem.locationId}`"
                        class="tap-area self-start inline-flex items-center gap-1 mt-1 text-meta font-medium text-accent-text"
                        @click="$emit('close')">
                        Ort öffnen
                        <ArrowRight :size="14" />
                    </NuxtLink>
                </div>
            </div>

            <!-- Note: tap to write or change it -->
            <div class="px-5 py-4 border-b border-border-subtle">
                <UiTextField v-if="editing === 'note'" ref="noteRef" v-model="draft" label="Notiz" optional
                    placeholder="z. B. das lange, weiße" @enter="commit" @escape="cancel" @blur="commit" />
                <button v-else-if="localItem.note" type="button"
                    class="w-full flex items-start gap-2 text-left text-body text-text-secondary cursor-text"
                    @click="startEdit('note')">
                    <span class="flex-1">{{ localItem.note }}</span>
                    <Pen :size="16" class="text-text-muted shrink-0 mt-1" />
                </button>
                <button v-else type="button"
                    class="tap-area inline-flex items-center gap-1 text-meta font-medium text-accent-text cursor-pointer"
                    @click="startEdit('note')">
                    <Plus :size="16" /> Notiz hinzufügen
                </button>
            </div>

            <!-- Who touched it -->
            <div class="px-5 py-4 flex flex-col gap-2 text-meta text-text-muted">
                <p class="flex items-center flex-wrap gap-x-2 gap-y-1">
                    <Plus :size="14" class="shrink-0" />
                    <span>Hinzugefügt von</span>
                    <UserBadge :user-id="localItem.createdBy" />
                    <span class="tabular-nums">· {{ formatDate(localItem.createdAt) }}</span>
                </p>
                <p v-if="lastEdit" class="flex items-center flex-wrap gap-x-2 gap-y-1">
                    <Pen :size="14" class="shrink-0" />
                    <span>Bearbeitet von</span>
                    <UserBadge :user-id="lastEdit.by" />
                    <span class="tabular-nums">· {{ formatDate(lastEdit.at) }}</span>
                </p>
            </div>
        </div>

        <template #footer>
            <!-- Moving is the action people repeat, so it leads. -->
            <UiActionBar>
                <UiButton variant="danger" :icon="Trash2" aria-label="Löschen" @click="remove" />
                <UiButton variant="primary" :icon="CornerUpRight" @click="pickerOpen = true">Verschieben</UiButton>
            </UiActionBar>
        </template>

        <template #after>
            <LocationPickerSheet :open="pickerOpen" :model-value="localItem.locationId" title="Verschieben nach"
                @update:model-value="move" @close="pickerOpen = false" />
        </template>
    </UiSheet>
</template>

<script setup lang="ts">
import { ArrowRight, ChevronRight, CornerUpRight, Pen, Plus, Trash2 } from "lucide-vue-next"
import type { ItemView } from "~/types"

const props = defineProps<{ item: ItemView }>()

const emit = defineEmits<{
    close: []
    deleted: []
}>()

const { updateItem, moveItem, deleteItems, restoreItems } = useItems()
const { decorateItem, getLocationPath } = useTopology()
const { remember } = useRecentLocations()
const { currentUser } = useUser()
const toast = useToast()

const localItem = ref<ItemView>({ ...props.item })
const pickerOpen = ref(false)

/** `updatedAt` is only set by a real edit, never on create. */
const lastEdit = computed(() => {
    const { updatedAt, updatedBy } = localItem.value
    if (!updatedAt) return null
    return { at: updatedAt, by: updatedBy ?? null }
})

// ── Edit in place: tap the name or note, Enter or leaving the field saves ────

const editing = ref<"name" | "note" | null>(null)
const draft = ref("")
const nameRef = ref<{ focus: () => void; select: () => void }>()
const noteRef = ref<{ focus: () => void }>()

function startEdit(field: "name" | "note") {
    editing.value = field
    draft.value = field === "name" ? localItem.value.name : (localItem.value.note ?? "")
    nextTick(() => {
        if (field === "name") {
            nameRef.value?.focus()
            nameRef.value?.select()
        } else {
            noteRef.value?.focus()
        }
    })
}

function cancel() {
    editing.value = null
}

async function commit() {
    const field = editing.value
    if (!field) return
    editing.value = null
    const value = draft.value.trim()
    const before = { name: localItem.value.name, note: localItem.value.note }
    if (field === "name" && (!value || value === before.name)) return
    if (field === "note" && value === (before.note ?? "")) return

    const patch = field === "name" ? { name: value } : { note: value || undefined }
    try {
        await updateItem(localItem.value.id, patch)
        localItem.value = decorateItem({
            ...localItem.value,
            ...patch,
            updatedBy: currentUser.value?.id ?? null,
            updatedAt: Date.now(),
        })
        toast.show({
            message: field === "name" ? `Umbenannt in „${value}“` : value ? "Notiz gespeichert" : "Notiz entfernt",
            undo: async () => {
                await updateItem(localItem.value.id, field === "name" ? { name: before.name } : { note: before.note })
                localItem.value = decorateItem({ ...localItem.value, ...(field === "name" ? { name: before.name } : { note: before.note }) })
            },
        })
    } catch (err) {
        toast.error(err, "Speichern hat nicht geklappt.")
    }
}

// ── Move and delete: immediate, with a way back ──────────────────────────────

async function move(locationId: string) {
    if (!locationId || locationId === localItem.value.locationId) return
    const from = localItem.value.locationId
    const id = localItem.value.id
    try {
        await moveItem(id, locationId)
        remember(locationId)
        emit("close")
        toast.show({
            message: `Verschoben nach ${getLocationPath(locationId).slice(-2).join(" › ")}`,
            undo: () => moveItem(id, from),
        })
    } catch (err) {
        toast.error(err, "Verschieben hat nicht geklappt.")
    }
}

async function remove() {
    try {
        const removed = await deleteItems([localItem.value.id])
        emit("deleted")
        emit("close")
        toast.show({ message: `„${localItem.value.name}“ gelöscht`, undo: () => restoreItems(removed) })
    } catch (err) {
        toast.error(err, "Löschen hat nicht geklappt.")
    }
}

function formatDate(ts: number): string {
    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts))
}

// Keep in sync when the surrounding list refetches.
watch(() => props.item, (next) => {
    localItem.value = { ...next }
})
</script>
