<template>
    <div class="flex flex-col h-full">
        <div class="flex-1 overflow-y-auto px-4 lg:px-8 pt-4 lg:pt-6 pb-10">
            <div class="lg:max-w-2xl lg:mx-auto flex flex-col gap-8">

                <h1 class="font-name text-title-lg lg:text-title-xl text-text-primary">Einstellungen</h1>

                <!-- Name -->
                <section class="flex flex-col gap-2">
                    <h2 class="eyebrow px-1">Name</h2>
                    <div class="bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-4">
                        <div class="flex items-center gap-3 min-w-0">
                            <UserBadge v-if="currentUser" :user-id="currentUser.id" :show-name="false" size="sm" />
                            <p class="font-name text-title-sm text-text-primary truncate">
                                {{ currentUser?.name ?? 'Kein Name gesetzt' }}
                            </p>
                        </div>
                        <p class="text-meta text-text-muted">
                            Dein Name steht bei allem, was du anlegst oder änderst. Gib denselben Namen auf einem
                            anderen Gerät ein, um dort als dieselbe Person weiterzuarbeiten.
                        </p>
                        <UiButton variant="secondary" :icon="Repeat2" block @click="switchUserOpen = true">
                            Name ändern
                        </UiButton>

                        <!-- Everyone who has used this log -->
                        <div v-if="userStats.length" class="flex flex-col gap-2 pt-1">
                            <h3 class="eyebrow">Alle Namen</h3>
                            <div v-for="user in userStats" :key="user.id"
                                class="flex items-center gap-3 min-h-14 px-3 rounded-md border"
                                :class="user.id === currentUser?.id ? 'bg-accent-dim border-accent/40' : 'bg-bg-elevated border-border-subtle'">
                                <UserBadge :user-id="user.id" :show-name="false" size="sm" />
                                <span class="flex-1 min-w-0 truncate text-label text-text-primary">{{ user.name }}</span>
                                <span class="text-caption text-text-muted shrink-0 tabular-nums">
                                    {{ itemCountLabel(user.itemCount) }} · {{ locationCountLabel(user.locationCount) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Theme -->
                <section class="flex flex-col gap-2">
                    <h2 class="eyebrow px-1">Darstellung</h2>
                    <div class="bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
                        <p class="text-meta text-text-muted">Hell, dunkel oder so wie dein Gerät.</p>
                        <UiSegmented :model-value="theme" :options="themeOptions" label="Darstellung"
                            @update:model-value="setTheme" />
                    </div>
                </section>

                <!-- Data -->
                <section class="flex flex-col gap-2">
                    <h2 class="eyebrow px-1">Datensicherung</h2>
                    <div class="bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
                        <p class="text-meta text-text-muted">
                            Exportiere alle Daten als JSON-Datei und importiere sie bei Bedarf wieder.
                        </p>
                        <UiButton variant="secondary" :icon="Upload" block :loading="exporting" @click="handleExport">
                            Daten exportieren
                        </UiButton>

                        <!-- Import replaces everything and cannot be undone: it asks here, on the page. -->
                        <div v-if="pendingImport" role="alert"
                            class="flex flex-col gap-3 p-3 rounded-md bg-danger-dim border border-danger/30">
                            <p class="flex items-start gap-2 text-meta text-danger">
                                <TriangleAlert :size="18" class="shrink-0" />
                                <span>
                                    „{{ pendingImport.name }}“ ersetzt alle {{ itemCountLabel(itemCount) }} und
                                    {{ locationCountLabel(locationCount) }}. Das lässt sich nicht rückgängig machen.
                                    Exportiere vorher, wenn du den jetzigen Stand behalten willst.
                                </span>
                            </p>
                            <UiActionBar>
                                <UiButton variant="ghost" @click="pendingImport = null">Abbrechen</UiButton>
                                <UiButton variant="danger-solid" class="is-primary" :loading="importing"
                                    @click="confirmImport">
                                    Alles ersetzen
                                </UiButton>
                            </UiActionBar>
                        </div>
                        <UiButton v-else variant="secondary" :icon="Download" block :loading="importing"
                            @click="startImport">
                            Daten importieren
                        </UiButton>
                    </div>
                </section>

                <!-- App -->
                <section class="flex flex-col gap-2">
                    <h2 class="eyebrow px-1">App</h2>
                    <dl class="bg-bg-surface border border-border rounded-lg divide-y divide-border-subtle">
                        <div class="flex items-center justify-between min-h-12 px-4">
                            <dt class="text-meta text-text-secondary">Version</dt>
                            <dd class="text-meta text-text-muted">{{ appVersion }}</dd>
                        </div>
                        <div class="flex items-center justify-between min-h-12 px-4">
                            <dt class="text-meta text-text-secondary">Bestand</dt>
                            <dd class="text-meta text-text-muted tabular-nums">
                                {{ itemCountLabel(itemCount) }} · {{ locationCountLabel(locationCount) }}
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>
        </div>

        <UserSetupSheet v-if="switchUserOpen" mode="switch" @close="switchUserOpen = false" />
    </div>
</template>

<script setup lang="ts">
import { Download, Repeat2, TriangleAlert, Upload } from "lucide-vue-next"
import { itemCount as itemCountLabel, locationCount as locationCountLabel } from "~/utils/plural"

const { exportData, importData, pickFile, exporting, importing } = useDataTransfer()
const { items, load: loadItems } = useItems()
const { locations, load: loadLocations } = useLocations()
const { load: loadContainers } = useContainers()
const { theme, setTheme } = useTheme()
const { currentUser, users, loadUsers } = useUser()
const toast = useToast()

const switchUserOpen = ref(false)
const pendingImport = ref<File | null>(null)

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

const themeOptions: { value: "dark" | "light" | "system"; label: string }[] = [
    { value: "dark", label: "Dunkel" },
    { value: "light", label: "Hell" },
    { value: "system", label: "System" },
]

async function handleExport() {
    try {
        await exportData()
        toast.show({ message: "Daten exportiert" })
    } catch (err) {
        toast.error(err, "Export hat nicht geklappt.")
    }
}

async function startImport() {
    try {
        pendingImport.value = await pickFile()
    } catch (e) {
        if (e instanceof Error && e.message !== "Keine Datei ausgewählt.") toast.error(e, "Datei konnte nicht gelesen werden.")
    }
}

async function confirmImport() {
    const file = pendingImport.value
    if (!file) return
    try {
        await importData(file)
        pendingImport.value = null
        await Promise.all([loadItems(), loadLocations(), loadContainers(), loadUsers()])
        toast.show({ message: "Daten importiert" })
    } catch (err) {
        toast.error(err, "Import hat nicht geklappt.")
    }
}

onMounted(() => {
    loadItems()
    loadLocations()
    loadUsers().catch(() => { /* offline – the list stays empty */ })
})
</script>
