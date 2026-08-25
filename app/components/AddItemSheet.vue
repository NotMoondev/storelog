<template>
    <UiSheet title="Gegenstand hinzufügen" @close="$emit('close')">
        <div class="px-5 py-5 flex flex-col gap-4">

            <p v-if="justSaved"
                class="flex items-center gap-2 text-[12.5px] text-accent bg-accent-dim border border-accent/30 rounded-lg px-3 py-2">
                <IconCheck :size="14" class="shrink-0" />
                <span class="truncate">„{{ justSaved }}" gespeichert</span>
            </p>

            <!-- Name -->
            <div class="flex flex-col gap-1.5">
                <label for="add-item-name" class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Name *</label>
                <input id="add-item-name" ref="nameRef" v-model="form.name" type="text"
                    placeholder="z. B. Ladekabel, Schlüssel…" autocomplete="off" spellcheck="false"
                    class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                    @keydown.enter="onNameEnter" />
            </div>

            <!-- Location -->
            <div class="flex flex-col gap-1.5">
                <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Ort *</label>

                <!-- One tap back to a place you just used -->
                <div v-if="recentChips.length" class="flex flex-wrap gap-1.5 mb-0.5">
                    <button v-for="loc in recentChips" :key="loc.id" type="button" @click="form.locationId = loc.id"
                        class="px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-all border"
                        :class="form.locationId === loc.id
                            ? 'bg-accent-dim border-accent text-accent'
                            : 'bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-text-muted'">
                        {{ loc.name }}
                    </button>
                </div>

                <button type="button"
                    class="flex items-center justify-between bg-bg-elevated border rounded-lg px-3.5 py-3 w-full min-h-12 text-left transition-all"
                    :class="selectedLocation
                        ? 'border-accent/60 text-accent'
                        : 'border-border text-text-muted hover:border-text-muted'"
                    @click="locationPickerOpen = true">
                    <span class="text-[13px] leading-snug flex-1 truncate">
                        {{ selectedLocation ? getLocationPath(selectedLocation.id).join(' / ') : 'Ort auswählen…' }}
                    </span>
                    <IconChevronRight :size="16" class="shrink-0 ml-2 text-text-muted" />
                </button>
            </div>

            <!-- Note -->
            <div class="flex flex-col gap-1.5">
                <label for="add-item-note" class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                    Notiz <span class="text-text-muted normal-case tracking-normal">(optional)</span>
                </label>
                <input id="add-item-note" v-model="form.note" type="text" autocomplete="off" spellcheck="false"
                    placeholder="Kurze Beschreibung…"
                    class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                    @keydown.enter="submit" />
            </div>

            <label v-if="!presetLocationId"
                class="flex items-center gap-2.5 text-[12.5px] text-text-secondary cursor-pointer select-none">
                <input v-model="keepOpen" type="checkbox" class="accent-accent w-4 h-4 cursor-pointer" />
                Nach dem Speichern weiteren Gegenstand erfassen
            </label>
        </div>

        <template #footer>
            <div class="flex gap-3">
                <button type="button" @click="$emit('close')"
                    class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                    Abbrechen
                </button>
                <button type="button" :disabled="!canSubmit || saving" @click="submit"
                    class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                    {{ saving ? 'Speichern…' : 'Speichern' }}
                </button>
            </div>
        </template>

        <LocationPickerSheet :open="locationPickerOpen" :model-value="form.locationId"
            @update:model-value="(id) => { form.locationId = id }" @close="locationPickerOpen = false" />
    </UiSheet>
</template>

<script setup lang="ts">
const props = defineProps<{
    /** Preselects a location — the fast path when adding from a location page. */
    presetLocationId?: string | null
}>()

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { locations, flatList, getLocationPath, ensureLoaded } = useLocations()
const { createItem } = useItems()
const { remember, resolve } = useRecentLocations()

const nameRef = ref<HTMLInputElement>()
const locationPickerOpen = ref(false)
const saving = ref(false)
const keepOpen = ref(false)
const justSaved = ref("")

const form = reactive({
    name: "",
    locationId: props.presetLocationId ?? "",
    note: "",
})

const selectedLocation = computed(() => flatList.value.find((l) => l.id === form.locationId))
const canSubmit = computed(() => !!form.name.trim() && !!form.locationId)

const recentChips = computed(() =>
    resolve(locations.value).filter((l) => l.id !== props.presetLocationId).slice(0, 4)
)

function onNameEnter() {
    if (form.locationId) submit()
    else locationPickerOpen.value = true
}

async function submit() {
    if (!canSubmit.value || saving.value) return
    saving.value = true
    try {
        await createItem({
            name: form.name.trim(),
            locationId: form.locationId,
            note: form.note.trim() || undefined,
        })
        remember(form.locationId)
        emit("saved")
        if (keepOpen.value) {
            justSaved.value = form.name.trim()
            form.name = ""
            form.note = ""
            nextTick(() => nameRef.value?.focus())
        } else {
            emit("close")
        }
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    nextTick(() => nameRef.value?.focus())
    ensureLoaded()
})
</script>
