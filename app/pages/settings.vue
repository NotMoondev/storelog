<template>
    <div class="flex flex-col h-full">

        <!-- Toolbar -->
        <div class="flex items-center px-4 py-3.5 border-b border-border-subtle shrink-0">
            <h2 class="font-['Syne'] text-[20px] font-bold text-text-primary">Einstellungen</h2>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-4 pt-5 pb-15 flex flex-col gap-7">

            <!-- Section: Benutzer -->
            <div class="flex flex-col gap-2">
                <div class="text-[11px] text-text-muted tracking-widest uppercase px-1">Benutzer</div>

                <div class="bg-bg-surface border border-border rounded-2xl p-4 space-y-4">
                    <div>
                        <div class="flex items-center gap-2.5 min-w-0">
                            <UserBadge v-if="currentUser" :user-id="currentUser.id" :show-name="false" size="sm" />
                            <h2 class="font-medium text-text-primary truncate">
                                {{ currentUser?.name ?? 'Kein Name gesetzt' }}
                            </h2>
                        </div>
                        <p class="text-sm text-text-muted mt-2">
                            Dein Name wird bei allem gespeichert, was du hinzufügst oder bearbeitest.
                            Gib denselben Namen auf einem anderen Gerät ein, um dort als dieselbe
                            Person weiterzuarbeiten.
                        </p>
                    </div>

                    <button @click="switchUserOpen = true" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm
                        bg-bg-elevated border border-border text-text-secondary
                        cursor-pointer transition-all duration-150
                        hover:bg-accent-dim hover:border-accent/40 hover:text-accent">
                        <IconRepeat2 class="size-5" />
                        Name ändern
                    </button>

                    <!-- Everyone who has used this log -->
                    <div v-if="userStats.length" class="space-y-2 pt-1">
                        <div class="text-[11px] text-text-muted tracking-widest uppercase">Alle Namen</div>
                        <div v-for="user in userStats" :key="user.id"
                            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                            :class="user.id === currentUser?.id ? 'bg-accent-dim border-accent/40' : 'bg-bg-elevated border-border-subtle'">
                            <UserBadge :user-id="user.id" :show-name="false" size="sm" />
                            <span class="flex-1 min-w-0 truncate text-sm text-text-primary">{{ user.name }}</span>
                            <span class="text-xs text-text-muted shrink-0 tabular-nums">
                                {{ user.itemCount }} Gegenstand{{ user.itemCount !== 1 ? 'e' : '' }}
                                · {{ user.locationCount }} Ort{{ user.locationCount !== 1 ? 'e' : '' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section: Theme -->
            <div class="bg-bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div>
                    <h2 class="font-medium text-text-primary">Design</h2>
                    <p class="text-sm text-text-muted mt-1">Wähle zwischen hellem, dunklem oder systemseitigem Design.
                    </p>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <button v-for="opt in themeOptions" :key="opt.value" @click="setTheme(opt.value)" :class="[
                        'flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs transition-all duration-150 border cursor-pointer',
                        theme === opt.value
                            ? 'bg-accent-dim border-accent/60 text-accent'
                            : 'bg-bg-elevated border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    ]">
                        <IconMoon v-if="opt.icon === 'IconMoon'" class="size-4" />
                        <IconSun v-else-if="opt.icon === 'IconSun'" class="size-4" />
                        <IconMonitor v-else class="size-4" />
                        {{ opt.label }}
                    </button>
                </div>
            </div>

            <!-- Section: Daten -->
            <div class="flex flex-col gap-2">
                <div class="text-[11px] text-text-muted tracking-widest uppercase px-1">Daten</div>

                <div class="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden p-4 space-y-4">
                    <div>
                        <h2 class="font-medium text-text-primary">Datensicherung</h2>
                        <p class="text-sm text-text-muted mt-1">
                            Exportiere alle deine Daten als JSON-Datei und importiere sie bei Bedarf wieder.
                        </p>
                    </div>

                    <div class="space-y-3">
                        <!-- Export -->
                        <button @click="handleExport" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm
                    bg-bg-elevated border border-border text-text-secondary
                    cursor-pointer transition-all duration-150
                    hover:bg-accent-dim hover:border-accent/40 hover:text-accent
                    disabled:opacity-40 disabled:cursor-not-allowed">
                            <IconUpload class="size-5" />
                            Daten exportieren
                        </button>

                        <!-- Import -->
                        <button @click="handleImport" :disabled="importing" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm
                    bg-bg-elevated border border-border text-text-secondary
                    cursor-pointer transition-all duration-150
                    hover:bg-accent-dim hover:border-accent/40 hover:text-accent
                    disabled:opacity-40 disabled:cursor-not-allowed">
                            <IconLoaderCircle v-if="importing" class="size-5 animate-spin" />
                            <IconDownload v-else class="size-5" />
                            Daten importieren
                        </button>

                        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
                    </div>

                    <!-- Warning -->
                    <div class="flex items-start gap-2 pt-1 text-amber-500">
                        <IconAlertTriangle class="size-3.5 shrink-0 mt-0.5" />
                        <p class="text-xs">
                            Beim Importieren werden alle vorhandenen Daten unwiderruflich überschrieben.
                            Mache vorher einen Export als Backup.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Section: App -->
            <div class="flex flex-col gap-2">
                <div class="text-[11px] text-text-muted tracking-widest uppercase px-1">App</div>

                <div class="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
                    <div class="flex items-center justify-between px-4 py-3.25">
                        <span class="text-sm text-text-secondary">Version</span>
                        <span class="text-sm text-text-muted">{{ appVersion }}</span>
                    </div>
                    <div class="h-px bg-border-subtle mx-4" />
                    <div class="flex items-center justify-between px-4 py-3.25">
                        <span class="text-sm text-text-secondary">Speicher</span>
                        <span class="text-sm text-text-muted">
                            {{ itemCount }} Gegenstände · {{ locationCount }} Orte
                        </span>
                    </div>
                </div>
            </div>

        </div>

        <UserSetupSheet v-if="switchUserOpen" mode="switch" @close="switchUserOpen = false" />

        <!-- Toast -->
        <Transition enter-active-class="transition-[opacity,transform] duration-200 ease-out"
            leave-active-class="transition-[opacity,transform] duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 translate-y-2">
            <div v-if="toast.visible" class="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4.5 py-2.75
               rounded-[10px] text-[13px whitespace-nowrap z-200 pointer-events-none border" :class="toast.type === 'success'
                ? 'bg-accent/12 border-accent/30 text-accent'
                : 'bg-danger-dim border-danger/30 text-danger'">
                <span class="text-base leading-none">
                    <IconCheck v-if="toast.type === 'success'" />
                    <IconX v-else />
                </span>
                {{ toast.message }}
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
const { exportData, importData, pickFile, exporting, importing } = useDataTransfer()
const { items, load: loadItems } = useItems()
const { locations, load: loadLocations } = useLocations()
const { theme, setTheme } = useTheme()
const { currentUser, users, loadUsers } = useUser()

const switchUserOpen = ref(false)

const itemCount = computed(() => items.value.length)
const locationCount = computed(() => locations.value.length)

/** How much each name has contributed – counted client-side from loaded data. */
const userStats = computed(() =>
    users.value.map(user => ({
        ...user,
        itemCount: items.value.filter(i => i.createdBy === user.id).length,
        locationCount: locations.value.filter(l => l.createdBy === user.id).length,
    }))
)

const { public: { appVersion } } = useRuntimeConfig()

const toast = reactive({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

const themeOptions = [
    { value: 'dark', label: 'Dunkel', icon: 'IconMoon' },
    { value: 'light', label: 'Hell', icon: 'IconSun' },
    { value: 'system', label: 'System', icon: 'IconMonitor' },
] as const

function showToast(message: string, type: 'success' | 'error') {
    if (toastTimer) clearTimeout(toastTimer)
    toast.message = message
    toast.type = type
    toast.visible = true
    toastTimer = setTimeout(() => (toast.visible = false), 3000)
}


async function handleExport() {
    try {
        await exportData()
        showToast('Daten erfolgreich exportiert.', 'success')
    } catch {
        showToast('Export fehlgeschlagen.', 'error')
    }
}

async function handleImport() {
    try {
        const file = await pickFile()
        const confirmed = confirm('Alle vorhandenen Daten werden überschrieben. Fortfahren?')
        if (!confirmed) return
        await importData(file)
        await Promise.all([loadItems(), loadLocations(), loadUsers()])
        showToast('Daten erfolgreich importiert.', 'success')
    } catch (e) {
        if (e instanceof Error && e.message !== 'Keine Datei ausgewählt.') {
            showToast(e.message, 'error')
        }
    }
}

onMounted(() => {
    loadItems()
    loadLocations()
    loadUsers().catch(() => { /* offline – the list stays empty */ })
})
</script>
