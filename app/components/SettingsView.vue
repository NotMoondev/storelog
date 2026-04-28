<!-- components/SettingsView.vue -->
<template>
    <div class="settings-view">
        <div class="toolbar">
            <h2 class="view-title">Einstellungen</h2>
        </div>

        <div class="settings-body">

            <!-- Section: Daten -->
            <div class="section">
                <div class="section-label">Daten</div>

                <div class="section-card">

                    <!-- Export -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <div class="setting-name">Exportieren</div>
                            <div class="setting-desc">Alle Gegenstände und Orte als JSON-Datei speichern.</div>
                        </div>
                        <button class="btn-action" :disabled="exporting" @click="handleExport">
                            <span class="btn-icon">
                                <IconUpload :size="14" />
                            </span>
                            {{ exporting ? 'Exportiere...' : 'Exportieren' }}
                        </button>
                    </div>

                    <div class="divider" />

                    <!-- Import -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <div class="setting-name">Importieren</div>
                            <div class="setting-desc">
                                Daten aus einer Export-Datei wiederherstellen.
                                <span class="warn-hint">Überschreibt alle vorhandenen Daten.</span>
                            </div>
                        </div>
                        <button class="btn-action" :disabled="importing" @click="handleImport">
                            <span class="btn-icon">
                                <IconDownload :size="14" />
                            </span>
                            {{ importing ? 'Importiere...' : 'Importieren' }}
                        </button>
                    </div>

                </div>
            </div>

            <!-- Section: App -->
            <div class="section">
                <div class="section-label">App</div>
                <div class="section-card info-card">
                    <div class="info-row">
                        <span class="info-key">Version</span>
                        <span class="info-val">{{ appVersion }}</span>
                    </div>
                    <div class="divider" />
                    <div class="info-row">
                        <span class="info-key">Speicher</span>
                        <span class="info-val">{{ itemCount }} Gegenstände · {{ locationCount }} Orte</span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Toast -->
        <Transition name="toast">
            <div v-if="toast.visible" class="toast" :class="toast.type">
                <span class="toast-icon">
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

const itemCount = computed(() => items.value.length)
const locationCount = computed(() => locations.value.length)

const { public: { appVersion } } = useRuntimeConfig()

const toast = reactive({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

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
        const confirmed = confirm(
            'Alle vorhandenen Daten werden überschrieben. Fortfahren?'
        )
        if (!confirmed) return
        await importData(file)
        await Promise.all([loadItems(), loadLocations()])
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
})
</script>

<style scoped>
.settings-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.toolbar {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
}

.view-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/* Section */
.section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.section-label {
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0 4px;
}

.section-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    overflow: hidden;
}

/* Setting row */
.setting-row {
    display: flex;
    flex-direction: column;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
}

.setting-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
}

.setting-name {
    font-size: 16px;
    color: var(--text-primary);
    font-family: 'Syne', sans-serif;
    font-weight: 600;
}

.setting-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
}

.warn-hint {
    display: block;
    color: #c07a2b;
    margin-top: 2px;
}

/* Button */
.btn-action {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.15s ease;
}

.btn-action:hover:not(:disabled) {
    background: var(--accent-dim);
    border-color: rgba(69, 163, 102, 0.4);
    color: var(--accent);
}

.btn-action:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.btn-icon {
    font-size: 16px;
    line-height: 1;
}

.divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 0 16px;
}

/* Info card */
.info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
}

.info-key {
    font-size: 14px;
    color: var(--text-secondary);
}

.info-val {
    font-size: 14px;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
}

/* Toast */
.toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px;
    border-radius: 10px;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    white-space: nowrap;
    z-index: 200;
    pointer-events: none;
    border: 1px solid;
}

.toast.success {
    background: rgba(69, 163, 102, 0.12);
    border-color: rgba(69, 163, 102, 0.3);
    color: var(--accent);
}

.toast.error {
    background: var(--danger-dim);
    border-color: rgba(192, 57, 43, 0.3);
    color: var(--danger);
}

.toast-icon {
    font-size: 16px;
}

.toast-enter-active,
.toast-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
}
</style>