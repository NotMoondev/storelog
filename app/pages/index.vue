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
            <div class="lg:max-w-3xl lg:mx-auto flex items-center gap-2">
                <div class="flex-1 flex items-center gap-2.5 bg-bg-surface border rounded-2xl px-3.5 h-12 transition-all duration-150"
                    :class="query
                        ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]'
                        : 'border-border focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]'">
                    <IconSearch :size="17" class="text-text-muted shrink-0" />
                    <input ref="inputRef" v-model="query" type="text" enterkeyhint="search"
                        placeholder="Wonach suchst du?" autocomplete="off" autocorrect="off" spellcheck="false"
                        aria-label="Gegenstände suchen"
                        class="flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] tracking-[0.01em] text-text-primary placeholder:text-text-muted" />
                    <button v-if="query" type="button" aria-label="Suche leeren" @click="clearQuery"
                        class="bg-transparent border-none text-text-muted cursor-pointer p-1 rounded transition-colors hover:text-text-secondary">
                        <IconX :size="15" />
                    </button>
                </div>
                <button type="button" @click="openQuickAdd()" aria-label="Gegenstand hinzufügen"
                    class="hidden lg:flex items-center gap-1.5 h-12 px-4 bg-accent text-black rounded-2xl border-none cursor-pointer text-[13px] font-medium shrink-0 transition-all hover:brightness-110 active:scale-95">
                    <IconPlus :size="15" />
                    Neu
                </button>
            </div>
        </div>

        <!-- Results -->
        <div ref="listRef" class="flex-1 min-h-0 overflow-y-auto px-4 lg:px-8 pb-4 lg:pb-10 pt-1 lg:pt-5">
            <div class="lg:max-w-3xl lg:mx-auto flex flex-col gap-5">

                <!-- Matching places -->
                <section v-if="locationResults.length" class="flex flex-col gap-2">
                    <h2 class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase px-0.5">Orte</h2>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        <LocationCard v-for="loc in locationResults" :key="loc.id" :location="loc"
                            :to="`/orte/${loc.id}`" :query="query" show-path />
                    </div>
                </section>

                <!-- Matching items -->
                <section class="flex flex-col gap-2">
                    <h2 v-if="results.length"
                        class="text-[11px] text-text-secondary/70 tracking-[0.12em] uppercase px-0.5 flex items-center gap-2">
                        <span>{{ query ? 'Gegenstände' : 'Zuletzt hinzugefügt' }}</span>
                        <span v-if="query" class="text-text-muted tabular-nums normal-case tracking-normal">
                            {{ results.length }}
                        </span>
                    </h2>
                    <TransitionGroup name="hit" tag="div" class="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        <ItemCard v-for="item in results" :key="item.id" :item="item" :query="query" show-path
                            @activate="selectedItem = item" />
                    </TransitionGroup>
                </section>

                <!-- Nothing matched -->
                <div v-if="query && !results.length && !locationResults.length"
                    class="flex flex-col items-center justify-center py-14 px-6 text-center gap-2.5">
                    <IconSearchX :size="52" class="text-text-muted" />
                    <p class="font-['Syne'] text-[17px] font-semibold text-text-secondary">Nichts gefunden</p>
                    <p class="text-[13px] text-text-muted max-w-65 leading-relaxed">
                        Kein Gegenstand und kein Ort für „{{ query }}".
                    </p>
                    <button type="button" @click="openQuickAdd()"
                        class="mt-2 px-5 py-2.5 bg-accent text-black border-none rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:brightness-110 active:scale-95">
                        „{{ query }}" anlegen
                    </button>
                </div>

                <!-- Nothing stored yet -->
                <div v-else-if="!query && !results.length"
                    class="flex flex-col items-center justify-center py-16 px-6 text-center gap-2.5">
                    <IconPackageOpen :size="52" class="text-text-muted" />
                    <p class="font-['Syne'] text-[17px] font-semibold text-text-secondary">Noch nichts hier</p>
                    <p class="text-[13px] text-text-muted max-w-65 leading-relaxed">
                        Lege einen Ort an und trage den ersten Gegenstand ein — danach findest du ihn hier sofort wieder.
                    </p>
                    <NuxtLink to="/orte"
                        class="mt-2 px-5 py-2.5 bg-accent text-black border-none rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:brightness-110">
                        Zu den Orten
                    </NuxtLink>
                </div>
            </div>
        </div>

        <ItemDetailSheet v-if="selectedItem" :item="selectedItem" @close="selectedItem = null"
            @deleted="selectedItem = null" />
    </div>
</template>

<script setup lang="ts">
import type { ItemView } from "~/types"

const { ensureLoaded: loadItems } = useItems()
const { ensureLoaded: loadLocations } = useLocations()
const { ensureLoaded: loadContainers } = useContainers()
const { query, results, locationResults, clearQuery } = useSearch()
const { openQuickAdd } = useQuickAdd()

const inputRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const selectedItem = ref<ItemView | null>(null)

/** Scroll back to the newest results whenever the query changes. */
watch(query, () => {
    nextTick(() => listRef.value?.scrollTo({ top: 0 }))
})

onMounted(() => {
    loadItems()
    loadLocations()
    loadContainers()
    // Autofocus only where a keyboard is already present; on a phone it would
    // shove the whole list behind the on-screen keyboard on arrival.
    if (window.matchMedia("(min-width: 1024px)").matches) {
        nextTick(() => inputRef.value?.focus())
    }
})
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
