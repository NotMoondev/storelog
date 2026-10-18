<template>
    <UiSheet v-if="open" nested max-height="85dvh" :title="title" @close="$emit('close')">
        <template #header>
            <UiIconButton v-if="breadcrumb.length || activeContainer" :icon="ChevronLeft" label="Zurück"
                @click="goBack" />
            <div class="flex-1 min-w-0">
                <h2 class="font-name text-title-md text-text-primary truncate">
                    {{ activeContainer ? activeContainer.name : breadcrumb.length ? breadcrumb.at(-1)!.name : title }}
                </h2>
                <p v-if="breadcrumb.length || activeContainer" class="text-meta text-text-muted truncate">
                    {{ activeContainer ? 'Fach wählen' : title }}
                </p>
            </div>
        </template>

        <div class="flex flex-col gap-4 px-4 pb-5 pt-1">

            <!-- Search, only at the top level -->
            <label v-if="!breadcrumb.length && !activeContainer"
                class="flex items-center gap-2 h-12 pl-4 pr-1 rounded-lg bg-bg-elevated border border-border text-text-muted transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                <Search :size="18" class="shrink-0" />
                <input ref="searchRef" v-model="query" type="search" enterkeyhint="search" placeholder="Ort suchen"
                    aria-label="Ort suchen" autocomplete="off" spellcheck="false"
                    class="flex-1 min-w-0 bg-transparent border-none outline-none text-body text-text-primary placeholder:text-text-muted" />
                <UiIconButton v-if="query" :icon="X" label="Suche leeren" variant="plain" :icon-size="18"
                    @click="query = ''" />
            </label>

            <!-- Search results -->
            <section v-if="query" class="flex flex-col">
                <button v-for="loc in searchResults" :key="loc.id" type="button" class="picker-row"
                    :class="rowState(loc.id)" @click="pick(loc.id)">
                    <LocationGlyph :container="containerOf(loc.id)" :own="countsOf(loc.id).own"
                        :child-count="childrenOf(loc.id).length" :size="40" />
                    <span class="flex-1 min-w-0">
                        <span class="block text-label font-medium truncate">
                            <span v-for="(part, i) in highlightParts(loc.name, query)" :key="i"
                                :class="part.match ? 'text-accent-text bg-accent-dim rounded-[3px]' : ''">{{ part.text }}</span>
                        </span>
                        <span v-if="parentPath(loc.id)" class="block text-meta text-text-muted truncate">
                            {{ parentPath(loc.id) }}
                        </span>
                    </span>
                    <Check v-if="modelValue === loc.id" :size="18" class="text-accent-text shrink-0" />
                </button>
                <p v-if="!searchResults.length" class="py-10 text-center text-meta text-text-muted">
                    Kein Ort heißt „{{ query }}“.
                </p>
            </section>

            <!-- Container: pick a compartment, or the container itself -->
            <section v-else-if="activeContainer" class="flex flex-col gap-3">
                <div class="w-full rounded-lg overflow-hidden border border-border bg-bg-elevated"
                    :style="{ aspectRatio: `${activeContainer.dimensions.width} / ${activeContainer.dimensions.height}`, maxHeight: '46dvh' }">
                    <ContainerZonePickerNode :node="activeContainer.rootNode" :selected-id="modelValue"
                        @select="pick" />
                </div>
                <UiButton variant="secondary" block @click="pick(activeContainer.locationId)">
                    Direkt in „{{ activeContainer.name }}“
                </UiButton>
            </section>

            <template v-else>
                <!-- Where things went last: the usual answer, one tap away -->
                <section v-if="!breadcrumb.length && recent.length" class="flex flex-col">
                    <h3 class="eyebrow px-1 pb-1">Zuletzt</h3>
                    <button v-for="loc in recent" :key="loc.id" type="button" class="picker-row"
                        :class="rowState(loc.id)" @click="pick(loc.id)">
                        <LocationGlyph :container="containerOf(loc.id)" :own="countsOf(loc.id).own"
                            :child-count="childrenOf(loc.id).length" :size="40" />
                        <span class="flex-1 min-w-0">
                            <span class="block text-label font-medium truncate">{{ loc.name }}</span>
                            <span v-if="parentPath(loc.id)" class="block text-meta text-text-muted truncate">
                                {{ parentPath(loc.id) }}
                            </span>
                        </span>
                        <Check v-if="modelValue === loc.id" :size="18" class="text-accent-text shrink-0" />
                    </button>
                </section>

                <section class="flex flex-col">
                    <h3 v-if="!breadcrumb.length" class="eyebrow px-1 pb-1">Alle Orte</h3>

                    <button v-if="allowRoot && !breadcrumb.length" type="button" class="picker-row"
                        :class="rowState('')" @click="pick('')">
                        <span class="size-10 shrink-0 rounded-sm bg-bg-elevated border border-border flex items-center justify-center text-text-muted">
                            <House :size="18" />
                        </span>
                        <span class="flex-1 text-label font-medium">Oberste Ebene</span>
                        <Check v-if="modelValue === ''" :size="18" class="text-accent-text shrink-0" />
                    </button>

                    <!-- Inside a place: choose the place itself before going deeper -->
                    <button v-if="breadcrumb.length" type="button" class="picker-row" :class="rowState(breadcrumb.at(-1)!.id)"
                        @click="pick(breadcrumb.at(-1)!.id)">
                        <span class="size-10 shrink-0 rounded-sm bg-accent-dim flex items-center justify-center text-accent-text">
                            <CornerDownRight :size="18" />
                        </span>
                        <span class="flex-1 text-label font-medium">Direkt in „{{ breadcrumb.at(-1)!.name }}“</span>
                        <Check v-if="modelValue === breadcrumb.at(-1)!.id" :size="18" class="text-accent-text shrink-0" />
                    </button>

                    <button v-for="loc in level" :key="loc.id" type="button" class="picker-row"
                        :class="rowState(loc.id, loc.goesDeeper)" @click="open_(loc)">
                        <LocationGlyph :container="loc.container" :own="countsOf(loc.id).own"
                            :child-count="childrenOf(loc.id).length" :size="40" />
                        <span class="flex-1 min-w-0 text-label font-medium truncate">{{ loc.name }}</span>
                        <ChevronRight v-if="loc.goesDeeper" :size="18" class="text-text-muted shrink-0" />
                        <Check v-else-if="modelValue === loc.id" :size="18" class="text-accent-text shrink-0" />
                    </button>

                    <p v-if="!level.length && !breadcrumb.length" class="py-10 text-center text-meta text-text-muted">
                        Noch keine Orte.
                    </p>
                </section>
            </template>
        </div>
    </UiSheet>
</template>

<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, CornerDownRight, House, Search, X } from "lucide-vue-next"
import type { Container } from "~/types/container"
import { highlightParts } from "~/utils/highlight"

/**
 * Choose a place. Recent places come first, so the usual answer is one tap.
 * Tapping a place without anything below it picks it and closes the sheet.
 */
const props = withDefaults(defineProps<{
    open: boolean
    modelValue: string
    title?: string
    /** Offer "Oberste Ebene" (emits an empty id), for parents of places. */
    allowRoot?: boolean
}>(), {
    title: "Ort wählen",
    allowRoot: false,
})

const emit = defineEmits<{
    close: []
    "update:modelValue": [id: string]
}>()

const { locations } = useLocations()
const { containerOf, countsOf, childrenOf, zoneLocationIds, ancestorsOf } = useTopology()
const { resolve } = useRecentLocations()

const searchRef = ref<HTMLInputElement>()
const query = ref("")
const breadcrumb = ref<{ id: string; name: string }[]>([])
const activeContainer = ref<Container | null>(null)

const recent = computed(() => resolve(locations.value).slice(0, 4))

const level = computed(() => {
    const parentId = breadcrumb.value.at(-1)?.id ?? null
    return childrenOf(parentId)
        .filter((l) => !zoneLocationIds.value.has(l.id))
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
        .map((l) => {
            const container = containerOf(l.id)
            return { ...l, container, goesDeeper: !!container || childrenOf(l.id).length > 0 }
        })
})

const searchResults = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []
    return locations.value
        .filter((l) => l.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
        .slice(0, 30)
})

function parentPath(id: string): string {
    return ancestorsOf(id).slice(0, -1).map((l) => l.name).join(" › ")
}

function rowState(id: string, goesDeeper = false): string {
    return props.modelValue === id && !goesDeeper ? "bg-accent-dim text-accent-text" : "text-text-primary"
}

function open_(loc: { id: string; name: string; container?: Container; goesDeeper: boolean }) {
    if (loc.container) activeContainer.value = loc.container
    else if (loc.goesDeeper) breadcrumb.value = [...breadcrumb.value, { id: loc.id, name: loc.name }]
    else pick(loc.id)
}

function goBack() {
    if (activeContainer.value) activeContainer.value = null
    else breadcrumb.value = breadcrumb.value.slice(0, -1)
}

function pick(id: string) {
    emit("update:modelValue", id)
    emit("close")
}

watch(() => props.open, (v) => {
    if (!v) return
    query.value = ""
    breadcrumb.value = []
    activeContainer.value = null
})
</script>

<style scoped>
@reference "../assets/css/main.css";

.picker-row {
    @apply flex items-center gap-3 w-full min-h-14 px-2 py-2 rounded-md text-left cursor-pointer transition-colors hover:bg-bg-elevated active:bg-bg-hover;
}
</style>
