<template>
    <Teleport to="body">
        <div v-if="open"
            class="fixed inset-0 bg-black/75 backdrop-blur-xs z-100 flex items-end lg:items-center justify-center"
            @click.self="$emit('close')">
            <div
                class="w-full max-w-lg bg-bg-surface border-t lg:border border-border rounded-t-[20px] lg:rounded-[20px] flex flex-col animate-slide-up lg:animate-fade-in"
                style="padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle -->
                <div class="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Title -->
                <div class="px-5 pt-2 pb-4 border-b border-border-subtle">
                    <div class="font-['Syne'] text-[17px] font-bold text-text-primary">Erstellen</div>
                </div>

                <!-- Options -->
                <div class="flex flex-col px-4 py-3 gap-2.5">
                    <button @click="pick('location')"
                        class="flex items-center gap-4 px-4 py-4 rounded-xl bg-bg-elevated border border-border text-left transition-all active:scale-[0.98] cursor-pointer hover:border-text-muted">
                        <div
                            class="w-10 h-10 rounded-xl bg-bg-surface border border-border flex items-center justify-center text-accent shrink-0">
                            <IconMapPin :size="20" />
                        </div>
                        <div>
                            <div class="text-[14px] text-text-primary font-medium">Neuer Ort</div>
                            <div class="text-[11px] text-text-muted mt-0.5">Einfacher Ort ohne visuelle
                                Struktur</div>
                        </div>
                        <IconChevronRight :size="16" class="text-text-muted ml-auto shrink-0" />
                    </button>

                    <button @click="pick('container')"
                        class="flex items-center gap-4 px-4 py-4 rounded-xl bg-accent-dim border border-accent/30 text-left transition-all active:scale-[0.98] cursor-pointer hover:border-accent/60">
                        <div
                            class="w-10 h-10 rounded-xl bg-bg-surface border border-accent/30 flex items-center justify-center text-accent shrink-0">
                            <IconLayoutGrid :size="20" />
                        </div>
                        <div>
                            <div class="text-[14px] text-accent font-medium">Container</div>
                            <div class="text-[11px] text-text-muted mt-0.5">Visueller Möbel- oder
                                Behälter-Editor</div>
                        </div>
                        <IconChevronRight :size="16" class="text-accent/60 ml-auto shrink-0" />
                    </button>
                </div>

                <!-- Cancel -->
                <div class="px-4 pb-5 pt-1">
                    <button @click="$emit('close')"
                        class="w-full py-3.5 rounded-xl text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97]">
                        Abbrechen
                    </button>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()

const emit = defineEmits<{
    close: []
    pick: [type: 'location' | 'container']
}>()

function pick(type: 'location' | 'container') {
    emit('close')
    emit('pick', type)
}
</script>
