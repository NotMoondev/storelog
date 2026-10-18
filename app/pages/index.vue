<template>
    <!--
        Column order flips by breakpoint: on a phone the field sits at the
        bottom, right above the nav and within thumb reach; on a desktop it
        takes its conventional place at the top.
    -->
    <div class="flex flex-col-reverse lg:flex-col h-full min-h-0">

        <!-- Search field -->
        <div class="shrink-0 relative z-10 px-4 pt-2 pb-2 lg:px-8 lg:pt-6 lg:pb-3 lg:border-b lg:border-border-subtle bg-bg">
            <!-- Softens the scroll edge where the list runs under the field. -->
            <div class="lg:hidden pointer-events-none absolute inset-x-0 -top-6 h-6"
                style="background: linear-gradient(to top, var(--bg), transparent)" />
            <form class="lg:max-w-3xl lg:mx-auto" role="search" @submit.prevent="onSubmit">
                <label
                    class="flex items-center gap-2 h-13 pl-4 pr-1 bg-bg-surface border rounded-lg text-text-muted transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]"
                    :class="query ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]' : 'border-border'">
                    <Search :size="18" class="shrink-0" />
                    <input ref="inputRef" v-model="query" type="search" enterkeyhint="search"
                        placeholder="Wonach suchst du?" autocomplete="off" autocorrect="off" spellcheck="false"
                        aria-label="Gegenstände suchen"
                        class="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-body text-text-primary placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
                        @keydown.escape="clearQuery" />
                    <UiIconButton v-if="query" :icon="X" label="Suche leeren" variant="plain" :icon-size="18"
                        @click="clearQuery" />
                    <kbd v-else
                        class="hidden lg:inline-flex mr-3 px-1.5 rounded-[6px] border border-border text-caption text-text-muted">/</kbd>
                </label>
            </form>
        </div>

        <!-- Results -->
        <div ref="listRef" class="flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 pb-4 lg:pb-10 pt-4 lg:pt-5">
            <div class="lg:max-w-3xl lg:mx-auto flex flex-col gap-6">

                <!-- Matching places -->
                <section v-if="locationResults.length" class="flex flex-col gap-2">
                    <h2 class="eyebrow px-1">Orte <span class="text-text-muted tracking-normal tabular-nums">{{ locationResults.length }}</span></h2>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        <LocationCard v-for="loc in locationResults" :key="loc.id" :location="loc"
                            :to="`/orte/${loc.id}`" :query="query" show-path @longpress="actionsFor = loc" />
                    </div>
                </section>

                <!-- Matching items -->
                <section v-if="results.length || showSuggestion" class="flex flex-col gap-2">
                    <h2 v-if="results.length" class="eyebrow px-1">
                        {{ query ? 'Gegenstände' : 'Zuletzt hinzugefügt' }}
                        <span v-if="query" class="text-text-muted tracking-normal tabular-nums">{{ results.length }}</span>
                    </h2>
                    <TransitionGroup name="hit" tag="div" class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        <ItemCard v-for="item in results" :key="item.id" :item="item" :query="query" show-path
                            @activate="selectedItem = item" />
                    </TransitionGroup>

                    <!-- Nothing with exactly this name: create it, the term becomes the name -->
                    <button v-if="showSuggestion && (results.length || locationResults.length)" type="button"
                        class="flex items-center gap-3 w-full min-h-16 p-3 text-left rounded-md border border-dashed border-accent/45 cursor-pointer transition-colors hover:bg-accent-dim"
                        @click="createFromQuery('item')">
                        <span class="size-10 shrink-0 rounded-sm bg-accent-dim text-accent-text flex items-center justify-center">
                            <Plus :size="20" />
                        </span>
                        <span class="min-w-0">
                            <span class="block font-name text-title-sm text-text-primary truncate">„{{ query.trim() }}“ anlegen</span>
                            <span class="block text-meta text-text-muted truncate">
                                Als Gegenstand<template v-if="lastPlace"> · zuletzt benutzt: {{ lastPlace.name }}</template>
                            </span>
                        </span>
                    </button>
                </section>

                <!-- Nothing matched at all -->
                <UiEmptyState v-if="query && !results.length && !locationResults.length" :icon="SearchX"
                    title="Nichts gefunden" :text="`Kein Gegenstand und kein Ort heißt „${query.trim()}“.`">
                    <UiButton variant="primary" :icon="Plus" block @click="createFromQuery('item')">
                        „{{ query.trim() }}“ anlegen
                    </UiButton>
                    <UiButton variant="ghost" block @click="createFromQuery('location')">Als Ort anlegen</UiButton>
                </UiEmptyState>

                <!-- Nothing stored yet -->
                <UiEmptyState v-else-if="!query && !results.length" :icon="PackageOpen" title="Noch nichts hier"
                    text="Leg einen Ort an und trag den ersten Gegenstand ein. Danach findest du ihn hier sofort wieder.">
                    <UiButton variant="primary" :icon="Plus" block @click="openCreate({ kind: 'location' })">
                        Ersten Ort anlegen
                    </UiButton>
                </UiEmptyState>
            </div>
        </div>

        <ItemDetailSheet v-if="selectedItem" :item="selectedItem" @close="selectedItem = null"
            @deleted="selectedItem = null" />

        <LocationActionsSheet v-if="actionsFor" :location="actionsFor" @close="actionsFor = null"
            @rename="goTo(actionsFor!, 'umbenennen')" @edit-layout="goTo(actionsFor!, 'aufteilung')" />
    </div>
</template>

<script setup lang="ts">
import { PackageOpen, Plus, Search, SearchX, X } from "lucide-vue-next"
import type { ItemView, Location } from "~/types"
import type { CreateKind } from "~/composables/useCreate"

const { items, ensureLoaded: loadItems } = useItems()
const { locations, ensureLoaded: loadLocations } = useLocations()
const { ensureLoaded: loadContainers } = useContainers()
const { query, results, locationResults, clearQuery } = useSearch()
const { openCreate } = useCreate()
const { resolve } = useRecentLocations()
const router = useRouter()

const inputRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const selectedItem = ref<ItemView | null>(null)
const actionsFor = ref<Location | null>(null)

/** Offer to create whenever no item carries exactly this name. */
const showSuggestion = computed(() => {
    const q = query.value.trim().toLowerCase()
    return !!q && !items.value.some((i) => i.name.trim().toLowerCase() === q)
})

const lastPlace = computed(() => resolve(locations.value)[0] ?? null)

function createFromQuery(kind: CreateKind) {
    openCreate({ kind, name: query.value })
}

/** Enter with nothing found creates it; with hits, it just closes the keyboard. */
function onSubmit() {
    if (query.value.trim() && !results.value.length && !locationResults.value.length) {
        createFromQuery("item")
        return
    }
    inputRef.value?.blur()
}

function goTo(location: Location, intent: "umbenennen" | "aufteilung") {
    router.push({ path: `/orte/${location.id}`, query: { [intent]: "1" } })
}

/** Scroll back to the newest results whenever the query changes. */
watch(query, () => {
    nextTick(() => listRef.value?.scrollTo({ top: 0 }))
})

/** Desktop: "/" jumps to the search field. */
function onKey(e: KeyboardEvent) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey) return
    const t = e.target as HTMLElement | null
    if (t && ["INPUT", "TEXTAREA"].includes(t.tagName)) return
    e.preventDefault()
    inputRef.value?.focus()
}

onMounted(() => {
    loadItems()
    loadLocations()
    loadContainers()
    window.addEventListener("keydown", onKey)
    // Autofocus only where a keyboard is already present; on a phone it would
    // shove the whole list behind the on-screen keyboard on arrival.
    if (window.matchMedia("(min-width: 1024px)").matches) {
        nextTick(() => inputRef.value?.focus())
    }
})
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>

<style scoped>
.hit-move {
    transition: transform 0.2s ease;
}

.hit-enter-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.hit-enter-from {
    opacity: 0;
    transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {

    .hit-move,
    .hit-enter-active {
        transition: none;
    }
}
</style>
