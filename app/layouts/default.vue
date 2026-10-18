<template>
    <div class="flex h-dvh bg-bg overflow-hidden">

        <!-- Desktop sidebar -->
        <aside class="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-bg-surface border-r border-border"
            style="z-index: var(--z-chrome)">
            <div class="flex items-center gap-2 px-6 h-16 border-b border-border-subtle">
                <NuxtLink to="/" class="flex items-center gap-2 text-text-primary">
                    <img src="/icons/icon-192.png" width="20" height="20" alt="" />
                    <span class="font-wordmark text-label">Storelog</span>
                </NuxtLink>
            </div>

            <nav class="flex-1 flex flex-col gap-1 px-3 py-4" aria-label="Hauptnavigation">
                <UiButton variant="primary" size="sm" :icon="Plus" class="justify-start! mb-2" @click="onNew">
                    Neu
                    <kbd class="ml-auto text-caption font-medium opacity-70">N</kbd>
                </UiButton>
                <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                    class="flex items-center gap-3 h-9 px-3 rounded-md text-meta font-medium transition-colors"
                    :class="isActive(link) ? 'text-accent-text bg-accent-dim' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'"
                    :aria-current="isActive(link) ? 'page' : undefined">
                    <component :is="link.icon" :size="16" />
                    {{ link.label }}
                </NuxtLink>
            </nav>

            <div class="px-3 py-4 border-t border-border-subtle flex flex-col gap-1">
                <button v-if="currentUser" type="button"
                    class="flex items-center gap-3 h-11 px-3 rounded-md text-left cursor-pointer transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                    title="Name ändern" @click="switchUserOpen = true">
                    <UserBadge :user-id="currentUser.id" :show-name="false" />
                    <span class="flex-1 min-w-0 text-meta font-medium truncate">{{ currentUser.name }}</span>
                    <Repeat2 :size="16" class="shrink-0" />
                </button>
                <NuxtLink to="/settings"
                    class="flex items-center gap-3 h-9 px-3 rounded-md text-meta font-medium transition-colors"
                    :class="route.path.startsWith('/settings') ? 'text-accent-text bg-accent-dim' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'">
                    <Settings :size="16" />
                    Einstellungen
                </NuxtLink>
            </div>
        </aside>

        <!-- Content column -->
        <div class="flex flex-col flex-1 min-w-0 lg:ml-60 overflow-hidden" style="padding-top: env(safe-area-inset-top, 0px)">

            <!-- Phone header on the top-level pages; a place's page brings its own -->
            <header v-if="!onLocationPage"
                class="lg:hidden shrink-0 flex items-center justify-between gap-3 pl-4 pr-2 h-14 border-b border-border-subtle bg-bg">
                <NuxtLink to="/" class="flex items-center gap-2 text-text-primary">
                    <img src="/icons/icon-192.png" width="20" height="20" alt="" />
                    <span class="font-wordmark text-label">Storelog</span>
                </NuxtLink>
                <div class="flex items-center gap-1">
                    <button v-if="currentUser" type="button" class="tap-area size-10 flex items-center justify-center"
                        aria-label="Name ändern" @click="switchUserOpen = true">
                        <UserBadge :user-id="currentUser.id" :show-name="false" size="sm" />
                    </button>
                    <UiIconButton :icon="Settings" label="Einstellungen" to="/settings"
                        :variant="route.path.startsWith('/settings') ? 'default' : 'plain'" />
                </div>
            </header>

            <main class="flex-1 min-h-0 overflow-hidden flex flex-col">
                <slot />
            </main>

            <!--
                Bottom chrome is a real flex item, not a floating overlay: pages
                never pad around it, and whatever a page puts directly above it
                stays within thumb reach. While items are selected, the
                selection bar takes the navigation's place.
            -->
            <div class="lg:hidden shrink-0 bg-bg" style="padding-bottom: max(12px, env(safe-area-inset-bottom))">
                <div v-if="selection.active.value" class="px-4 pt-2">
                    <SelectionBar @move="selectionPickerOpen = true" @delete="deleteSelection" />
                </div>
                <nav v-else class="px-4 pt-2" aria-label="Hauptnavigation">
                    <div class="flex items-center h-16 px-2 bg-bg-surface border border-border rounded-lg shadow-float">
                        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                            class="flex-1 h-full flex flex-col items-center justify-center gap-0.5 text-caption font-medium transition-colors"
                            :class="isActive(link) ? 'text-accent-text' : 'text-text-muted'"
                            :aria-current="isActive(link) ? 'page' : undefined">
                            <component :is="link.icon" :size="22" />
                            {{ link.label }}
                        </NuxtLink>
                        <div class="flex-1 flex justify-center">
                            <UiButton variant="primary" :icon="Plus" class="h-12! px-4!" @click="onNew">Neu</UiButton>
                        </div>
                    </div>
                </nav>
            </div>

            <!-- Desktop selection bar sits at the bottom of the content column -->
            <div v-if="selection.active.value" class="hidden lg:block shrink-0 px-8 pb-6">
                <div class="max-w-3xl mx-auto">
                    <SelectionBar @move="selectionPickerOpen = true" @delete="deleteSelection" />
                </div>
            </div>
        </div>

        <CreateSheet />
        <UiToast :offset="toastOffset" />

        <LocationPickerSheet :open="selectionPickerOpen" model-value="" title="Verschieben nach"
            @update:model-value="moveSelection" @close="selectionPickerOpen = false" />

        <UserSetupSheet v-if="ready && !isIdentified" mode="setup" />
        <UserSetupSheet v-if="switchUserOpen" mode="switch" @close="switchUserOpen = false" />
    </div>
</template>

<script setup lang="ts">
import { MapPin, Plus, Repeat2, Search, Settings } from "lucide-vue-next"
import { itemCount } from "~/utils/plural"

const { currentUser, ready, isIdentified, init } = useUser()
const route = useRoute()
const { initTheme } = useTheme()
const { openCreate } = useCreate()
const selection = useSelection()
const { items, moveItems, deleteItems, restoreItems } = useItems()
const { getLocationPath } = useTopology()
const { remember } = useRecentLocations()
const toast = useToast()

const switchUserOpen = ref(false)
const selectionPickerOpen = ref(false)

const navLinks = [
    { to: "/", label: "Finden", icon: Search, exact: true },
    { to: "/orte", label: "Orte", icon: MapPin, exact: false },
]

function isActive(link: { to: string; exact: boolean }) {
    return link.exact ? route.path === link.to : route.path.startsWith(link.to)
}

const onLocationPage = computed(() => /^\/orte\/[^/]+/.test(route.path))

/** Pages with the search or filter field docked above the navigation. */
const hasDockedField = computed(() => route.path === "/" || route.path === "/orte")

/** How far the toast sits above the bottom edge on a phone. */
const toastOffset = computed(() => (hasDockedField.value && !selection.active.value ? 148 : 84))

/** "Neu" on a place's page starts there; everywhere else it starts empty. */
function onNew() {
    const id = onLocationPage.value ? String(route.params.id) : null
    openCreate({ locationId: id })
}

// ── Selection: bulk move and delete, with a way back ─────────────────────────

async function moveSelection(targetId: string) {
    if (!targetId) return
    const ids = [...selection.ids.value]
    const before = new Map(items.value.filter((i) => ids.includes(i.id)).map((i) => [i.id, i.locationId]))
    try {
        await moveItems(ids, targetId)
        remember(targetId)
        selection.stop()
        toast.show({
            message: `${itemCount(ids.length)} verschoben nach ${getLocationPath(targetId).slice(-2).join(" › ")}`,
            undo: async () => {
                const byPlace = new Map<string, string[]>()
                for (const [id, loc] of before) byPlace.set(loc, [...(byPlace.get(loc) ?? []), id])
                for (const [loc, group] of byPlace) await moveItems(group, loc)
            },
        })
    } catch (err) {
        toast.error(err, "Verschieben hat nicht geklappt.")
    }
}

async function deleteSelection() {
    const ids = [...selection.ids.value]
    if (!ids.length) return
    try {
        const removed = await deleteItems(ids)
        selection.stop()
        toast.show({ message: `${itemCount(removed.length)} gelöscht`, undo: () => restoreItems(removed) })
    } catch (err) {
        toast.error(err, "Löschen hat nicht geklappt.")
    }
}

// Leaving the page ends the selection.
watch(() => route.fullPath, () => selection.stop())

// ── Desktop shortcut: N opens "Neu" ──────────────────────────────────────────

function onKey(e: KeyboardEvent) {
    if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return
    if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
    e.preventDefault()
    onNew()
}

onMounted(() => {
    init()
    initTheme()
    window.addEventListener("keydown", onKey)
})
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>
