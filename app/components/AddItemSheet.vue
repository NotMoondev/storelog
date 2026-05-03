<template>
    <Teleport to="body">
        <!-- Main form sheet -->
        <div class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end justify-center"
            @click.self="$emit('close')">
            <div
                class="bg-bg-surface border-t border-border rounded-t-[20px] w-full max-w-140 max-h-[92dvh] flex flex-col animate-slide-up"
                style="padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle -->
                <div class="flex justify-center pt-3 pb-1 shrink-0">
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
                        <label class="font-['DM_Mono'] text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Name *
                        </label>
                        <input ref="nameRef" v-model="form.name" type="search" placeholder="z. B. Ladekabel, Schlüssel..." autocomplete="off" spellcheck="false"
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 font-['DM_Mono'] text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="focusLocation" />
                    </div>

                    <!-- Location trigger -->
                    <div class="flex flex-col gap-1.5">
                        <label class="font-['DM_Mono'] text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Ort *
                        </label>
                        <button type="button"
                            class="flex items-center justify-between bg-bg-elevated border rounded-lg px-3.5 py-3 w-full min-h-12 text-left transition-all"
                            :class="selectedLocation
                                ? 'border-accent/60 text-accent'
                                : 'border-border text-text-muted hover:border-text-muted'"
                            @click="locationPickerOpen = true">
                            <span class="font-['DM_Mono'] text-[13px] leading-snug flex-1 truncate">
                                {{ selectedLocation
                                    ? getLocationPath(selectedLocation.id).join(' / ')
                                    : 'Ort auswählen…' }}
                            </span>
                            <IconChevronRight :size="16" class="shrink-0 ml-2 text-text-muted" />
                        </button>
                    </div>

                    <!-- Note -->
                    <div class="flex flex-col gap-1.5">
                        <label class="font-['DM_Mono'] text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Notiz
                            <span class="text-text-muted normal-case tracking-normal">(optional)</span>
                        </label>
                        <input v-model="form.note" type="search" autocomplete="off" spellcheck="false" placeholder="Kurze Beschreibung..."
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 font-['DM_Mono'] text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="submit" />
                    </div>

                </div>

                <!-- Footer -->
                <div class="px-5 pt-3 pb-5 flex gap-3 border-t border-border-subtle shrink-0">
                    <button @click="$emit('close')"
                        class="flex-1 py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                        Abbrechen
                    </button>
                    <button :disabled="!canSubmit || saving" @click="submit"
                        class="flex-1 py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border-none transition-all bg-accent text-white active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                        {{ saving ? 'Speichern…' : 'Speichern' }}
                    </button>
                </div>

            </div>
        </div>

        <!-- Location picker sheet (renders on top) -->
        <div v-if="locationPickerOpen"
            class="fixed inset-0 bg-black/60 backdrop-blur-xs z-110 flex items-end justify-center"
            @click.self="locationPickerOpen = false">
            <div class="bg-bg-surface border-t border-border rounded-t-[20px] w-full max-w-140 flex flex-col animate-slide-up"
                style="max-height: 75dvh; padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle -->
                <div class="flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Sheet header -->
                <div class="flex items-center justify-between px-5 pt-2 pb-4 border-b border-border-subtle shrink-0">
                    <h3 class="font-['Syne'] text-[17px] font-bold text-text-primary">Ort wählen</h3>
                    <button @click="locationPickerOpen = false"
                        class="bg-bg-elevated border border-border text-text-secondary w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center transition-all active:scale-95 hover:text-text-primary">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Search -->
                <div class="px-4 py-3 border-b border-border-subtle shrink-0">
                    <div
                        class="flex items-center gap-2 bg-bg-elevated border border-border rounded-lg px-3 h-10 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                        <IconSearch :size="14" class="text-text-muted shrink-0" />
                        <input ref="locationSearchRef" v-model="locationSearch" type="search" placeholder="Ort suchen..." autocomplete="off" spellcheck="false"
                            class="flex-1 bg-transparent border-none outline-none font-['DM_Mono'] text-[13px] text-text-primary placeholder:text-text-muted" />
                        <button v-if="locationSearch" @click="locationSearch = ''"
                            class="text-text-muted hover:text-text-secondary cursor-pointer">
                            <IconX :size="12" />
                        </button>
                    </div>
                </div>

                <!-- Location list -->
                <div class="flex-1 overflow-y-auto overscroll-contain">
                    <div v-for="loc in filteredLocations" :key="loc.id"
                        class="flex items-center gap-2 px-4 py-3.5 cursor-pointer transition-all border-b border-border-subtle/50 last:border-none"
                        :class="form.locationId === loc.id
                            ? 'bg-accent-dim text-accent'
                            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary active:bg-bg-hover'"
                        :style="{ paddingLeft: `${16 + loc.indent * 18}px` }" @click="selectLocation(loc)">
                        <IconCornerDownRight v-if="loc.indent > 0" :size="12" class="text-text-muted shrink-0" />
                        <span class="font-['DM_Mono'] text-[13px] flex-1">{{ loc.name }}</span>
                        <IconCheck v-if="form.locationId === loc.id" :size="15" class="text-accent shrink-0" />
                    </div>

                    <div v-if="filteredLocations.length === 0"
                        class="flex flex-col items-center justify-center py-12 gap-2 text-text-muted">
                        <IconMapPinOff :size="32" />
                        <span class="font-['DM_Mono'] text-[13px]">Keine Orte gefunden</span>
                    </div>
                </div>

            </div>
        </div>
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
const locationSearchRef = ref<HTMLInputElement>()
const locationPickerOpen = ref(false)
const locationSearch = ref("")
const saving = ref(false)

const form = reactive({
    name: "",
    locationId: "",
    note: "",
})

const selectedLocation = computed(() => flatList.value.find((l) => l.id === form.locationId))

const filteredLocations = computed(() => {
    if (!locationSearch.value) return flatList.value
    const q = locationSearch.value.toLowerCase()
    return flatList.value.filter((l) => l.name.toLowerCase().includes(q))
})

const canSubmit = computed(() => form.name.trim() && form.locationId)

function focusLocation() {
    locationPickerOpen.value = true
}

function selectLocation(loc: (typeof flatList.value)[0]) {
    form.locationId = loc.id
    locationPickerOpen.value = false
    locationSearch.value = ""
}

// Focus search input when picker opens
watch(locationPickerOpen, (v) => {
    if (v) nextTick(() => locationSearchRef.value?.focus())
})

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
