<template>
    <Teleport to="body">
        <div class="fixed inset-0 bg-black/80 backdrop-blur-xs z-200 flex items-end lg:items-center justify-center"
            @click.self="mode === 'switch' && $emit('close')">
            <div class="bg-bg-surface border-t lg:border border-border rounded-t-[20px] lg:rounded-[20px] w-full max-w-115 max-h-[92dvh] flex flex-col animate-slide-up lg:animate-fade-in"
                style="padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle -->
                <div v-if="mode === 'switch'" class="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Header -->
                <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-4 shrink-0">
                    <div class="min-w-0">
                        <div class="text-accent mb-2">
                            <IconUserRound :size="24" />
                        </div>
                        <h2 class="font-['Syne'] text-[20px] font-bold text-text-primary leading-tight">
                            {{ mode === 'switch' ? 'Name ändern' : 'Wer bist du?' }}
                        </h2>
                        <p class="text-[13px] text-text-muted mt-1.5 leading-relaxed">
                            Kein Account, kein Passwort. Dein Name kennzeichnet, was du hinzufügst oder
                            bearbeitest. Gib auf einem anderen Gerät denselben Namen ein, um dort als
                            dieselbe Person weiterzuarbeiten.
                        </p>
                    </div>
                    <button v-if="mode === 'switch'" @click="$emit('close')"
                        class="bg-bg-elevated border border-border text-text-secondary w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95 hover:text-text-primary">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Body -->
                <div class="px-5 flex flex-col gap-4 overflow-y-auto flex-1">

                    <!-- Name input -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Name *</label>
                        <input ref="nameRef" v-model="name" type="text" autocomplete="off" spellcheck="false"
                            :maxlength="MAX_USER_NAME_LENGTH" placeholder="Name eingeben"
                            class="bg-bg-elevated border border-border rounded-lg px-3.5 py-3 text-[15px] text-text-primary outline-none w-full transition-all placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                            @keydown.enter="submit" />
                        <p v-if="error" class="text-[12px] text-danger mt-0.5">{{ error }}</p>
                    </div>

                    <!-- Known names -->
                    <div v-if="knownUsers.length" class="flex flex-col gap-2">
                        <div class="text-[11px] text-text-muted tracking-[0.08em] uppercase">Bereits bekannt</div>
                        <div class="flex flex-wrap gap-1.5">
                            <button v-for="user in knownUsers" :key="user.id" type="button" @click="name = user.name"
                                class="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border cursor-pointer transition-all active:scale-[0.97]"
                                :class="normalized === user.name
                                    ? 'bg-accent-dim border-accent/60 text-accent'
                                    : 'bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-text-muted'">
                                <UserBadge :user-id="user.id" :show-name="false" size="sm" />
                                <span class="text-[13px]">{{ user.name }}</span>
                            </button>
                        </div>
                    </div>

                </div>

                <!-- Footer -->
                <div class="px-5 pt-4 pb-5 flex gap-3 shrink-0">
                    <button v-if="mode === 'switch'" @click="$emit('close')"
                        class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary hover:border-text-muted">
                        Abbrechen
                    </button>
                    <button :disabled="!normalized || saving" @click="submit"
                        class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border-none transition-all bg-accent text-black active:scale-[0.97] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed">
                        {{ saving ? 'Moment…' : mode === 'switch' ? 'Speichern' : 'Los geht’s' }}
                    </button>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import type { AppUser } from '~/types'
import { normalizeUserName, MAX_USER_NAME_LENGTH } from '~/utils/userIdentity'
import { userRepository } from '~/repositories/userRepository'

const props = withDefaults(defineProps<{ mode?: 'setup' | 'switch' }>(), { mode: 'setup' })

const emit = defineEmits<{ close: []; saved: [] }>()

const { currentUser, signIn } = useUser()

const nameRef = ref<HTMLInputElement>()
const name = ref(props.mode === 'switch' ? currentUser.value?.name ?? '' : '')
const knownUsers = ref<AppUser[]>([])
const saving = ref(false)
const error = ref<string | null>(null)

const normalized = computed(() => normalizeUserName(name.value))

async function submit() {
    if (!normalized.value || saving.value) return
    saving.value = true
    error.value = null
    try {
        await signIn(normalized.value)
        emit('saved')
        emit('close')
    } catch {
        error.value = 'Name konnte nicht gespeichert werden. Verbindung prüfen.'
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    nextTick(() => nameRef.value?.focus())
    try {
        knownUsers.value = await userRepository.getAll()
    } catch {
        knownUsers.value = []
    }
})
</script>
