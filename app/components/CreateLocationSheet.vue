<template>
    <Teleport to="body">
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
                <div class="flex items-center justify-between px-5 pt-2 pb-4 border-b border-border-subtle shrink-0">
                    <div>
                        <div class="font-['Syne'] text-[18px] font-bold text-text-primary">
                            {{ parentId ? 'Unterort erstellen' : 'Neuen Ort erstellen' }}
                        </div>
                        <div v-if="parentId" class="font-['DM_Mono'] text-[11px] text-accent mt-0.5">
                            in: {{ getLocationPath(parentId).join(' / ') }}
                        </div>
                    </div>
                    <button @click="$emit('close')"
                        class="ml-3 w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary cursor-pointer transition-all active:scale-95 hover:text-text-primary hover:border-text-muted shrink-0">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Body -->
                <div class="px-5 py-5">
                    <input ref="inputRef" v-model="name" type="search" autocomplete="off" spellcheck="false" placeholder="Name des Ortes…"
                        class="bg-bg-elevated border border-border rounded-xl px-4 py-3.5 font-['DM_Mono'] text-[14px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                        @keydown.enter="submit" @keydown.escape="$emit('close')" />
                </div>

                <!-- Footer -->
                <div class="px-5 pt-1 pb-5 flex gap-3 shrink-0">
                    <button @click="$emit('close')"
                        class="flex-1 py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                        Abbrechen
                    </button>
                    <button :disabled="!name.trim() || saving" @click="submit"
                        class="flex-1 py-3.5 rounded-xl font-['DM_Mono'] text-[14px] cursor-pointer border-none transition-all bg-accent text-white active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                        {{ saving ? '…' : 'Erstellen' }}
                    </button>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { useLocations } from '~/composables/useLocations'

const props = defineProps<{
    open: boolean
    parentId?: string | null
}>()

const emit = defineEmits<{
    close: []
    created: []
}>()

const { getLocationPath, createLocation } = useLocations()

const inputRef = ref<HTMLInputElement>()
const name = ref('')
const saving = ref(false)

watch(() => props.open, (val) => {
    if (val) {
        name.value = ''
        saving.value = false
        nextTick(() => inputRef.value?.focus())
    }
})

async function submit() {
    if (!name.value.trim() || saving.value) return
    saving.value = true
    try {
        await createLocation(name.value.trim(), props.parentId ?? null)
        emit('created')
        emit('close')
    } finally {
        saving.value = false
    }
}
</script>
