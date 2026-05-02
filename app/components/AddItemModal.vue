<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end justify-center"
            @click.self="$emit('close')">
            <div
                class="bg-bg-surface border border-border rounded-[20px_20px_0_0] w-full max-w-140 max-h-[92dvh] overflow-y-auto pb-[env(safe-area-inset-bottom,0)] animate-slide-up">

                <!-- Header -->
                <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-subtle">
                    <h2 class="font-['Syne'] text-[18px] font-bold text-text-primary">Gegenstand hinzufügen</h2>
                    <button @click="$emit('close')"
                        class="bg-bg-elevated border border-border text-text-secondary w-7 h-7 rounded-md cursor-pointer text-sm flex items-center justify-center transition-all hover:text-text-primary hover:border-text-muted">✕</button>
                </div>

                <!-- Body -->
                <div class="px-5 py-5 flex flex-col gap-4">

                    <!-- Name -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Name *</label>
                        <input ref="nameRef" v-model="form.name" type="text" placeholder="z. B. Ladekabel, Schlüssel..."
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 font-['DM_Mono'] text-base text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="focusLocation" />
                    </div>

                    <!-- Location -->
                    <div class="flex flex-col gap-1.5 relative">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Ort *</label>
                        <div @click="locationPickerOpen = !locationPickerOpen"
                            class="flex items-center justify-between bg-bg-elevated border border-border rounded-lg px-3.5 py-3 cursor-pointer min-h-11.5 transition-all"
                            :class="locationPickerOpen ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)] rounded-b-none' : ''">
                            <span v-if="selectedLocation" class="text-[13px] text-accent flex-1 leading-snug">
                                {{ getLocationPath(selectedLocation.id).join(" / ") }}
                            </span>
                            <span v-else class="text-[13px] text-text-muted font-['DM_Mono']">Ort auswählen...</span>
                            <span class="text-[10px] text-text-muted ml-2">{{ locationPickerOpen ? '▲' : '▼' }}</span>
                        </div>

                        <!-- Dropdown -->
                        <div v-if="locationPickerOpen"
                            class="absolute left-0 right-0 top-full z-200 bg-bg-elevated border border-accent border-t-0 rounded-b-lg overflow-hidden shadow-[0_0_0_3px_var(--accent-glow)] max-h-[20dvh] overflow-y-auto">
                            <input v-model="locationSearch" type="text" placeholder="Ort suchen..."
                                class="block w-full bg-bg-surface border-none border-b border-border-subtle px-3.5 py-2.5 font-['DM_Mono'] text-[13px] text-text-primary outline-none placeholder:text-text-muted"
                                @click.stop />
                            <div class="max-h-50 overflow-y-auto">
                                <div v-for="loc in filteredLocations" :key="loc.id"
                                    class="py-2.5 pr-3 text-[13px] font-['DM_Mono'] cursor-pointer flex items-center gap-1.5 transition-all"
                                    :class="form.locationId === loc.id
                                        ? 'text-accent bg-accent-dim'
                                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'"
                                    :style="{ paddingLeft: `${12 + loc.indent * 16}px` }"
                                    @click.stop="selectLocation(loc)">
                                    <span v-if="loc.indent > 0" class="text-text-muted">
                                        <IconCornerDownRight :size="10" />
                                    </span>
                                    {{ loc.name }}
                                </div>
                                <div v-if="filteredLocations.length === 0"
                                    class="px-4 py-4 text-center text-sm text-text-muted">
                                    Keine Orte gefunden
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Note -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">
                            Notiz <span class="text-text-muted normal-case tracking-normal">(optional)</span>
                        </label>
                        <input v-model="form.note" type="text" placeholder="Kurze Beschreibung..."
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 font-['DM_Mono'] text-base text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="submit" />
                    </div>

                </div>

                <!-- Footer -->
                <div class="px-5 pt-4 pb-5 flex gap-2.5 border-t border-border-subtle">
                    <button @click="$emit('close')"
                        class="flex-1 py-3.25 rounded-lg font-['DM_Mono'] text-[13px] tracking-[0.03em] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border hover:text-text-primary hover:border-text-muted">Abbrechen</button>
                    <button :disabled="!canSubmit || saving" @click="submit"
                        class="flex-1 py-3.25 rounded-lg font-['DM_Mono'] text-[13px] tracking-[0.03em] cursor-pointer border-none transition-all bg-accent text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">{{
                            saving ? 'Speichern...' : 'Speichern' }}</button>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
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

const selectedLocation = computed(() => flatList.value.find((l) => l.id === form.locationId))
const filteredLocations = computed(() => {
    if (!locationSearch.value) return flatList.value
    const q = locationSearch.value.toLowerCase()
    return flatList.value.filter((l) => l.name.toLowerCase().includes(q))
})
const canSubmit = computed(() => form.name.trim() && form.locationId)

function focusLocation() { locationPickerOpen.value = true }

function selectLocation(loc: (typeof flatList.value)[0]) {
    form.locationId = loc.id
    locationPickerOpen.value = false
    locationSearch.value = ""
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