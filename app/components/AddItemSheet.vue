<template>
    <Teleport to="body">
        <!-- Main form sheet -->
        <div class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end lg:items-center justify-center"
            @click.self="$emit('close')">
            <div class="bg-bg-surface border-t lg:border border-border rounded-t-[20px] lg:rounded-[20px] w-full max-w-140 max-h-[92dvh] lg:max-h-[85vh] flex flex-col animate-slide-up lg:animate-fade-in"
                style="padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle -->
                <div class="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Header -->
                <div class="flex items-center justify-between px-5 pt-2 pb-4 border-b border-border-subtle shrink-0">
                    <h2 class="font-['Syne'] text-[18px] font-bold text-text-primary">Gegenstand hinzufügen</h2>
                    <button @click="$emit('close')"
                        class="bg-bg-elevated border border-border text-text-secondary w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center transition-all active:scale-95 hover:text-text-primary hover:border-text-muted">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Body -->
                <div class="px-5 py-5 flex flex-col gap-4 overflow-y-auto flex-1">

                    <!-- Name -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Name *
                        </label>
                        <input ref="nameRef" v-model="form.name" type="text"
                            placeholder="z. B. Ladekabel, Schlüssel..." autocomplete="off" spellcheck="false"
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="focusLocation" />
                    </div>

                    <!-- Location trigger -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Ort *
                        </label>
                        <button type="button"
                            class="flex items-center justify-between bg-bg-elevated border rounded-lg px-3.5 py-3 w-full min-h-12 text-left transition-all"
                            :class="selectedLocation
                                ? 'border-accent/60 text-accent'
                                : 'border-border text-text-muted hover:border-text-muted'"
                            @click="locationPickerOpen = true">
                            <span class="text-[13px] leading-snug flex-1 truncate">
                                {{ selectedLocation
                                    ? getLocationPath(selectedLocation.id).join(' / ')
                                    : 'Ort auswählen…' }}
                            </span>
                            <IconChevronRight :size="16" class="shrink-0 ml-2 text-text-muted" />
                        </button>
                    </div>

                    <!-- Note -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Notiz
                            <span class="text-text-muted normal-case tracking-normal">(optional)</span>
                        </label>
                        <input v-model="form.note" type="text" autocomplete="off" spellcheck="false"
                            placeholder="Kurze Beschreibung..."
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="submit" />
                    </div>

                </div>

                <!-- Footer -->
                <div class="px-5 pt-3 pb-5 flex gap-3 border-t border-border-subtle shrink-0">
                    <button @click="$emit('close')"
                        class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                        Abbrechen
                    </button>
                    <button :disabled="!canSubmit || saving" @click="submit"
                        class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                        {{ saving ? 'Speichern…' : 'Speichern' }}
                    </button>
                </div>

            </div>
        </div>

        <LocationPickerSheet
            :open="locationPickerOpen"
            :model-value="form.locationId"
            @update:model-value="(id) => { form.locationId = id }"
            @close="locationPickerOpen = false"
        />
    </Teleport>
</template>

<script setup lang="ts">
import { useLocations } from "~/composables/useLocations"
import { useItems } from "~/composables/useItems"

const emit = defineEmits<{
    close: []
    saved: []
}>()

const { flatList, getLocationPath, load: loadLocations } = useLocations()
const { createItem } = useItems()

const nameRef = ref<HTMLInputElement>()
const locationPickerOpen = ref(false)
const saving = ref(false)

const form = reactive({
    name: "",
    locationId: "",
    note: "",
})

const selectedLocation = computed(() => flatList.value.find((l) => l.id === form.locationId))

const canSubmit = computed(() => form.name.trim() && form.locationId)

function focusLocation() {
    locationPickerOpen.value = true
}

function selectLocation(loc: (typeof flatList.value)[0]) {
    form.locationId = loc.id
    locationPickerOpen.value = false
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
        emit("saved")
        emit("close")
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    nextTick(() => nameRef.value?.focus())
    loadLocations()
})
</script>
