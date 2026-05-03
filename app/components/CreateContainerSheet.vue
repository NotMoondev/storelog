<template>
    <Teleport to="body">
        <Transition name="sheet">
            <div v-if="open"
                class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end justify-center"
                @click.self="$emit('close')">

                <div
                    class="w-full max-w-lg bg-bg-surface border-t border-border rounded-t-[20px] flex flex-col animate-slide-up"
                    style="padding-bottom: env(safe-area-inset-bottom, 0px)">

                    <!-- Drag handle -->
                    <div class="flex justify-center pt-3 pb-1 shrink-0">
                        <div class="w-10 h-1 rounded-full bg-border" />
                    </div>

                    <!-- Header -->
                    <div class="flex items-center gap-3 px-5 pt-2 pb-4 shrink-0">
                        <div
                            class="w-10 h-10 bg-accent-dim border border-accent/30 rounded-xl flex items-center justify-center text-accent shrink-0">
                            <IconLayoutGrid :size="20" />
                        </div>
                        <div>
                            <div class="font-['Syne'] text-[18px] font-bold text-text-primary leading-tight">Container
                                erstellen</div>
                            <div class="font-['DM_Mono'] text-[11px] text-text-muted">Visueller Möbel-/Behälter-Editor
                            </div>
                        </div>
                        <button @click="$emit('close')"
                            class="ml-auto w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all active:scale-95 shrink-0">
                            <IconX :size="18" />
                        </button>
                    </div>

                    <!-- Scrollable body -->
                    <div class="flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-5">

                        <!-- Parent path hint -->
                        <div v-if="parentId" class="text-[13px] text-accent -mt-2">
                            in: {{ getLocationPath(parentId).join(' / ') }}
                        </div>

                        <!-- Name input -->
                        <div class="flex flex-col gap-2">
                            <label class="font-['DM_Mono'] text-[11px] text-text-muted uppercase tracking-wider">
                                Name
                            </label>
                            <input ref="inputRef" v-model="name" type="text" autocomplete="off" spellcheck="false"
                                placeholder="z.B. Kleiderschrank, Regal, Kommode…"
                                class="bg-bg-elevated border border-border rounded-xl px-4 py-3.5 font-['DM_Mono'] text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                                @keydown.escape="$emit('close')" />
                        </div>

                        <!-- Proportion -->
                        <div class="flex flex-col gap-3">
                            <label class="font-['DM_Mono'] text-[11px] text-text-muted uppercase tracking-wider">
                                Beispiel Proportion (Breite : Höhe)
                            </label>

                            <!-- Presets – 2-column grid for easy tapping -->
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="preset in proportionPresets" :key="preset.label"
                                    @click="setPreset(preset)"
                                    class="flex items-center justify-between px-4 py-3 rounded-xl border transition-all active:scale-[0.97] cursor-pointer"
                                    :class="isActive(preset)
                                        ? 'bg-accent-dim border-accent/60 text-accent'
                                        : 'bg-bg-elevated border-border text-text-secondary hover:border-text-muted'">
                                    <span class="font-['DM_Mono'] text-[13px]">{{ preset.label }}</span>
                                    <span class="font-['DM_Mono'] text-[11px] opacity-60 ml-2">
                                        {{ preset.width }}×{{ preset.height }}
                                    </span>
                                </button>
                            </div>

                            <!-- Sliders -->
                            <div class="grid grid-cols-2 gap-4 mt-1">
                                <div class="flex flex-col gap-2">
                                    <div class="flex justify-between items-center">
                                        <span class="font-['DM_Mono'] text-[11px] text-text-muted uppercase tracking-wider">Breite</span>
                                        <span
                                            class="font-['DM_Mono'] text-[13px] text-accent font-bold min-w-[1.5ch] text-right">{{
                                                width }}</span>
                                    </div>
                                    <input type="range" min="1" max="10" v-model.number="width"
                                        class="w-full h-2 accent-accent cursor-pointer" />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <div class="flex justify-between items-center">
                                        <span class="font-['DM_Mono'] text-[11px] text-text-muted uppercase tracking-wider">Höhe</span>
                                        <span
                                            class="font-['DM_Mono'] text-[13px] text-accent font-bold min-w-[1.5ch] text-right">{{
                                                height }}</span>
                                    </div>
                                    <input type="range" min="1" max="10" v-model.number="height"
                                        class="w-full h-2 accent-accent cursor-pointer" />
                                </div>
                            </div>

                            <!-- Grid preview -->
                            <div class="flex flex-col items-center gap-2 mt-1">
                                <div class="border border-border rounded-lg overflow-hidden" :style="{
                                    width: previewW + 'px',
                                    height: previewH + 'px',
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${width}, 1fr)`,
                                    gridTemplateRows: `repeat(${height}, 1fr)`,
                                    background: 'var(--bg-elevated)',
                                    transition: 'all 0.2s',
                                }">
                                    <div v-for="i in width * height" :key="i"
                                        class="border-r border-b border-accent/40" />
                                </div>
                                <span class="font-['DM_Mono'] text-[11px] text-text-muted">
                                    {{ width }} × {{ height }}
                                </span>
                            </div>
                        </div>

                        <!-- Use-grid toggle -->
                        <div
                            class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer select-none"
                            :class="useGrid
                                ? 'bg-accent-dim border-accent/60'
                                : 'bg-bg-elevated border-border hover:border-text-muted'"
                            @click="useGrid = !useGrid">
                            <div
                                class="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                                :class="useGrid ? 'bg-accent border-accent' : 'bg-bg-surface border-border'">
                                <IconCheck v-if="useGrid" :size="12" class="text-white" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-['DM_Mono'] text-[13px]" :class="useGrid ? 'text-accent' : 'text-text-primary'">Grid direkt als Zonen übernehmen</div>
                                <div class="font-['DM_Mono'] text-[11px] text-text-muted">
                                    Erstellt sofort {{ width * height }} {{ width * height === 1 ? 'Zone' : 'Zonen' }} entsprechend dem Raster
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Footer actions -->
                    <div class="px-5 pt-3 pb-5 flex gap-3 shrink-0 border-t border-border-subtle">
                        <button @click="$emit('close')"
                            class="flex-1 py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97]">
                            Abbrechen
                        </button>
                        <button :disabled="!name.trim() || saving" @click="submit"
                            class="flex-1 py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border-none transition-all bg-accent text-white active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                            {{ saving ? '…' : 'Erstellen & öffnen' }}
                        </button>
                    </div>

                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { useLocations } from '~/composables/useLocations'

interface ProportionPreset {
    label: string
    width: number
    height: number
}

const props = defineProps<{
    open: boolean
    parentId?: string | null
}>()

const emit = defineEmits<{
    close: []
    created: [name: string, width: number, height: number, useGrid: boolean]
}>()

const { getLocationPath } = useLocations()

const inputRef = ref<HTMLInputElement>()
const name = ref('')
const width = ref(2)
const height = ref(3)
const saving = ref(false)
const useGrid = ref(false)

const proportionPresets: ProportionPreset[] = [
    { label: 'Quadrat', width: 1, height: 1 },
    { label: 'Hochschrank', width: 1, height: 4 },
    { label: 'Kleiderschrank', width: 2, height: 3 },
    { label: 'Regal', width: 3, height: 2 },
    { label: 'Kommode', width: 4, height: 3 },
]

function setPreset(preset: ProportionPreset) {
    width.value = preset.width
    height.value = preset.height
}

function isActive(preset: ProportionPreset) {
    return width.value === preset.width && height.value === preset.height
}

const MAX_PREVIEW = 120
const previewW = computed(() => {
    const ratio = width.value / height.value
    return ratio >= 1 ? MAX_PREVIEW : Math.round(MAX_PREVIEW * ratio)
})
const previewH = computed(() => {
    const ratio = height.value / width.value
    return ratio >= 1 ? MAX_PREVIEW : Math.round(MAX_PREVIEW * ratio)
})

watch(() => props.open, (val) => {
    if (val) {
        name.value = ''
        width.value = 2
        height.value = 3
        saving.value = false
        useGrid.value = false
        nextTick(() => inputRef.value?.focus())
    }
})

async function submit() {
    if (!name.value.trim() || saving.value) return
    saving.value = true
    try {
        emit('created', name.value.trim(), width.value, height.value, useGrid.value)
    } finally {
        saving.value = false
    }
}
</script>
