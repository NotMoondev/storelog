<template>
    <UiSheet :title="mode === 'switch' ? 'Name ändern' : 'Wer bist du?'" :dismissible="mode === 'switch'"
        @close="$emit('close')">
        <div class="px-5 pt-1 pb-5 flex flex-col gap-5">
            <p class="text-meta text-text-muted">
                Kein Konto, kein Passwort. Dein Name steht bei allem, was du anlegst oder änderst. Auf einem
                anderen Gerät gibst du denselben Namen ein und arbeitest dort als dieselbe Person weiter.
            </p>

            <UiTextField ref="nameRef" v-model="name" label="Name" placeholder="z. B. Lea" :maxlength="MAX_USER_NAME_LENGTH"
                :error="error ?? undefined" @enter="submit" />

            <!-- Known names: tapping one is the fastest way back on a new device -->
            <div v-if="knownUsers.length" class="flex flex-col gap-2">
                <span class="eyebrow">Bereits bekannt</span>
                <div class="flex flex-wrap gap-2">
                    <button v-for="user in knownUsers" :key="user.id" type="button" :aria-pressed="normalized === user.name"
                        class="flex items-center gap-2 h-11 pl-1.5 pr-4 rounded-full border text-label cursor-pointer transition-colors"
                        :class="normalized === user.name
                            ? 'bg-accent-dim border-accent text-accent-text'
                            : 'bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-strong'"
                        @click="name = user.name">
                        <UserBadge :user-id="user.id" :show-name="false" size="sm" />
                        {{ user.name }}
                    </button>
                </div>
            </div>
        </div>

        <template #footer>
            <UiActionBar>
                <UiButton variant="primary" :disabled="!normalized" :loading="saving" @click="submit">
                    {{ mode === 'switch' ? 'Speichern' : 'Los geht’s' }}
                </UiButton>
            </UiActionBar>
        </template>
    </UiSheet>
</template>

<script setup lang="ts">
import type { AppUser } from '~/types'
import { normalizeUserName, MAX_USER_NAME_LENGTH } from '~/utils/userIdentity'
import { userRepository } from '~/repositories/userRepository'

const props = withDefaults(defineProps<{ mode?: 'setup' | 'switch' }>(), { mode: 'setup' })

const emit = defineEmits<{ close: []; saved: [] }>()

const { currentUser, signIn } = useUser()

const nameRef = ref<{ focus: () => void }>()
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
