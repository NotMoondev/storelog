<template>
    <div class="flex h-dvh bg-bg overflow-hidden">

        <!-- Desktop Sidebar -->
        <aside class="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-bg-surface border-r border-border z-40">
            <div class="flex items-center gap-2 px-6 h-16 border-b border-border-subtle">
                <NuxtLink to="/"
                    class="flex items-center gap-2 font-['Syne'] font-bold text-[15px] tracking-widest text-text-primary">
                    <img src="/icons/icon-192.png" width="18" height="18" alt="" />
                    STORELOG
                </NuxtLink>
            </div>

            <nav class="flex-1 flex flex-col gap-1 px-3 py-4">
                <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    :class="isActive(link) ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'">
                    <component :is="link.icon" :size="18" />
                    {{ link.label }}
                </NuxtLink>
                <button type="button" @click="openCreateMenu()"
                    class="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl border-none cursor-pointer text-sm font-medium bg-accent text-black transition-all hover:brightness-110 active:scale-[0.98]">
                    <Plus :size="18" />
                    Neu
                </button>
            </nav>

            <div class="px-3 py-4 border-t border-border-subtle flex flex-col gap-1">
                <button v-if="currentUser" @click="switchUserOpen = true"
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-transparent border-none cursor-pointer text-left transition-colors text-text-muted hover:text-text-primary hover:bg-bg-hover"
                    title="Name ändern">
                    <UserBadge :user-id="currentUser.id" :show-name="false" size="sm" />
                    <span class="flex-1 min-w-0">
                        <span class="block text-[13px] font-medium text-text-primary truncate">{{ currentUser.name }}</span>
                        <span class="block text-[11px] text-text-muted">Angemeldet</span>
                    </span>
                    <Repeat2 :size="15" class="shrink-0" />
                </button>
                <NuxtLink to="/settings"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    :class="$route.path.startsWith('/settings') ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'">
                    <Settings :size="18" />
                    Einstellungen
                </NuxtLink>
            </div>
        </aside>

        <!-- Content column -->
        <div class="flex flex-col flex-1 min-w-0 lg:ml-60 overflow-hidden">

            <!-- Mobile header -->
            <header
                class="lg:hidden shrink-0 flex items-center justify-between gap-3 px-5 h-13 border-b border-border-subtle bg-bg">
                <NuxtLink to="/"
                    class="flex items-center gap-2 font-['Syne'] font-bold text-[15px] tracking-widest text-text-primary">
                    <img src="/icons/icon-192.png" width="18" height="18" alt="" />
                    STORELOG
                </NuxtLink>
                <div class="flex items-center gap-3">
                    <button v-if="currentUser" @click="switchUserOpen = true"
                        class="bg-transparent border-none p-0 cursor-pointer flex items-center" title="Name ändern">
                        <UserBadge :user-id="currentUser.id" :show-name="false" size="sm" />
                    </button>
                    <NuxtLink to="/settings" aria-label="Einstellungen"
                        :class="$route.path.startsWith('/settings') ? 'text-accent' : 'text-text-muted'">
                        <Settings :size="20" />
                    </NuxtLink>
                </div>
            </header>

            <main class="flex-1 min-h-0 overflow-hidden flex flex-col">
                <slot />
            </main>

            <!--
                Bottom chrome is a real flex item, not a floating overlay: pages
                never have to pad around it, and whatever a page puts directly
                above the nav stays within thumb reach.
            -->
            <div class="lg:hidden shrink-0 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-bg">
                <nav aria-label="Hauptnavigation">
                    <div
                        class="flex bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
                            class="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
                            :class="isActive(link) ? 'text-accent' : 'text-text-muted'">
                            <component :is="link.icon" :size="20" />
                            <span class="text-[10px] font-medium">{{ link.label }}</span>
                        </NuxtLink>
                        <button type="button" @click="openCreateMenu()" aria-label="Neu anlegen"
                            class="flex-1 flex flex-col items-center py-2.5 gap-0.5 bg-transparent border-none border-l border-border cursor-pointer text-accent transition-colors">
                            <Plus :size="20" />
                            <span class="text-[10px] font-medium">Neu</span>
                        </button>
                    </div>
                </nav>
            </div>
        </div>

        <CreatePickerSheet :open="createMenuOpen" with-item @close="closeCreateMenu" @pick="onCreatePick" />
        <CreateLocationSheet :open="newLocationOpen" :parent-id="null" @close="newLocationOpen = false"
            @created="onLocationCreated" />
        <CreateContainerSheet :open="newContainerOpen" :parent-id="null" @close="newContainerOpen = false"
            @created="onContainerCreated" />

        <AddItemSheet v-if="quickAddOpen" :preset-location-id="presetLocationId" @close="closeQuickAdd" />

        <UserSetupSheet v-if="ready && !isIdentified" mode="setup" />
        <UserSetupSheet v-if="switchUserOpen" mode="switch" @close="switchUserOpen = false" />
    </div>
</template>

<script setup lang="ts">
import { Search, MapPin, Settings, Repeat2, Plus } from 'lucide-vue-next'
import type { Location } from '~/types'
import type { CreateKind } from '~/components/CreatePickerSheet.vue'

const { currentUser, ready, isIdentified, init } = useUser()
const route = useRoute()

const switchUserOpen = ref(false)

const navLinks = [
    { to: '/', label: 'Finden', icon: Search, exact: true },
    { to: '/orte', label: 'Orte', icon: MapPin, exact: false },
]

function isActive(link: { to: string; exact: boolean }) {
    return link.exact ? route.path === link.to : route.path.startsWith(link.to)
}

const { initTheme } = useTheme()
const { open: quickAddOpen, presetLocationId, openQuickAdd, closeQuickAdd } = useQuickAdd()

// The nav's "Neu" leads to all three creatable things; the sheets live here so
// every page inherits the same flow.
const { open: createMenuOpen, openCreateMenu, closeCreateMenu } = useCreateMenu()
const newLocationOpen = ref(false)
const newContainerOpen = ref(false)

const router = useRouter()
const { createLocation } = useLocations()
const { createContainer, buildGridTree } = useContainers()

function onCreatePick(type: CreateKind) {
    if (type === 'item') openQuickAdd()
    else if (type === 'location') newLocationOpen.value = true
    else newContainerOpen.value = true
}

function onLocationCreated(created: Location) {
    newLocationOpen.value = false
    router.push(`/orte/${created.id}`)
}

/** A container is a location plus its layout, so both rows are written here. */
async function onContainerCreated(name: string, width: number, height: number, useGrid: boolean) {
    newContainerOpen.value = false
    const created = await createLocation(name, null)
    await createContainer(
        name,
        created.id,
        { unit: 'ratio', width, height },
        useGrid ? buildGridTree(width, height) : undefined
    )
    router.push(`/orte/${created.id}`)
}

onMounted(() => {
    init()
    initTheme()
})
</script>
