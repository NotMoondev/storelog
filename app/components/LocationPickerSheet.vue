<template>
    <Teleport to="body">
        <div v-if="open"
            class="fixed inset-0 bg-black/60 backdrop-blur-xs z-110 flex items-end lg:items-center justify-center"
            @click.self="$emit('close')">
            <div class="bg-bg-surface border-t lg:border border-border rounded-t-[20px] lg:rounded-[20px] w-full max-w-140 flex flex-col animate-slide-up lg:animate-fade-in"
                style="max-height: 75dvh; padding-bottom: env(safe-area-inset-bottom, 0px)">

                <!-- Drag handle (mobile) -->
                <div class="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div class="w-10 h-1 rounded-full bg-border" />
                </div>

                <!-- Header -->
                <div class="px-4 pt-3 pb-3 border-b border-border-subtle shrink-0 flex items-center gap-2.5">

                    <!-- Back button (drilled-in or container view) -->
                    <button v-if="breadcrumb.length > 0 || viewMode === 'container'"
                        @click="goBack"
                        class="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer">
                        <IconChevronLeft :size="18" />
                    </button>

                    <!-- Container view: box icon + container name -->
                    <template v-if="viewMode === 'container' && activeContainer">
                        <div class="flex-1 flex items-center gap-2 min-w-0">
                            <IconBox :size="15" class="text-text-muted shrink-0" />
                            <span class="text-[14px] font-semibold text-text-primary truncate">{{ activeContainer.name }}</span>
                        </div>
                    </template>

                    <!-- Location drill-down: breadcrumb -->
                    <template v-else-if="breadcrumb.length > 0">
                        <div class="flex-1 flex items-center gap-1 overflow-hidden">
                            <button @click="breadcrumb = []; viewMode = 'locations'"
                                class="text-text-muted hover:text-text-primary text-[12px] shrink-0 cursor-pointer transition-colors">
                                <IconHome :size="13" />
                            </button>
                            <template v-for="(crumb, i) in breadcrumb" :key="crumb.id">
                                <span class="text-text-muted text-[12px] shrink-0">›</span>
                                <button @click="navigateToCrumb(i)"
                                    class="text-[13px] font-medium truncate cursor-pointer transition-colors"
                                    :class="i === breadcrumb.length - 1 ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'">
                                    {{ crumb.name }}
                                </button>
                            </template>
                        </div>
                    </template>

                    <!-- Root: search input -->
                    <template v-else>
                        <div class="flex-1 flex items-center gap-2 bg-bg-elevated border border-border rounded-xl px-3 h-11 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
                            <IconSearch :size="15" class="text-text-muted shrink-0" />
                            <input
                                ref="searchRef"
                                v-model="query"
                                type="search"
                                placeholder="Ort suchen..."
                                autocomplete="off"
                                spellcheck="false"
                                class="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-muted"
                            />
                            <button v-if="query" @click="query = ''" class="text-text-muted hover:text-text-secondary cursor-pointer p-0.5">
                                <IconX :size="13" />
                            </button>
                        </div>
                    </template>

                    <button @click="$emit('close')"
                        class="bg-bg-elevated border border-border text-text-secondary w-11 h-11 rounded-xl cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95 hover:text-text-primary">
                        <IconX :size="18" />
                    </button>
                </div>

                <!-- Search results (root mode only) -->
                <div v-if="query" class="flex-1 overflow-y-auto overscroll-contain py-1.5">
                    <template v-if="searchResults.length > 0">
                        <button v-for="loc in searchResults" :key="loc.id"
                            class="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-all border-b border-border-subtle/50 last:border-none"
                            :class="modelValue === loc.id ? 'bg-accent-dim' : 'hover:bg-bg-elevated active:bg-bg-hover'"
                            @click="selectDirect(loc.id)">
                            <span class="shrink-0" :class="modelValue === loc.id ? 'text-accent' : 'text-text-muted'">
                                <IconMapPin :size="15" />
                            </span>
                            <div class="flex-1 min-w-0">
                                <div class="text-[14px] leading-snug truncate"
                                    :class="modelValue === loc.id ? 'text-accent font-medium' : 'text-text-primary'">
                                    <span v-for="(part, i) in highlight(loc.name, query)" :key="i"
                                        :class="part.match ? 'text-accent bg-accent/10 rounded-sm px-px' : ''">{{ part.text }}</span>
                                </div>
                                <div v-if="getLocationPath(loc.id).length > 1"
                                    class="text-[11px] text-text-muted mt-0.5 truncate">
                                    {{ getLocationPath(loc.id).slice(0, -1).join(' › ') }}
                                </div>
                            </div>
                            <IconCheck v-if="modelValue === loc.id" :size="15" class="text-accent shrink-0" />
                        </button>
                    </template>
                    <div v-else class="flex flex-col items-center justify-center py-12 gap-2 text-text-muted">
                        <IconMapPinOff :size="32" />
                        <span class="text-[13px]">Keine Orte gefunden</span>
                    </div>
                </div>

                <!-- Location list (drill-down) -->
                <div v-else-if="viewMode === 'locations'" class="flex-1 overflow-y-auto overscroll-contain py-1.5">

                    <!-- Option to select the current parent location -->
                    <button v-if="breadcrumb.length > 0"
                        @click="selectDirect(breadcrumb[breadcrumb.length - 1].id)"
                        class="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-all border-b border-border"
                        :class="modelValue === breadcrumb[breadcrumb.length - 1].id ? 'bg-accent-dim text-accent' : 'hover:bg-bg-elevated text-text-secondary active:bg-bg-hover'">
                        <IconCornerUpLeft :size="14" class="shrink-0 text-text-muted" />
                        <span class="text-[13px] flex-1">„{{ breadcrumb[breadcrumb.length - 1].name }}" wählen</span>
                        <IconCheck v-if="modelValue === breadcrumb[breadcrumb.length - 1].id" :size="14" class="text-accent shrink-0" />
                    </button>

                    <template v-if="currentLevelLocations.length > 0">
                        <button v-for="loc in currentLevelLocations" :key="loc.id"
                            class="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer transition-all border-b border-border-subtle/50 last:border-none"
                            :class="modelValue === loc.id && !loc.hasChildren && !loc.container ? 'bg-accent-dim' : 'hover:bg-bg-elevated active:bg-bg-hover'"
                            @click="handleLocationClick(loc)">

                            <!-- Type icon -->
                            <span class="shrink-0"
                                :class="modelValue === loc.id ? 'text-accent' : loc.container ? 'text-text-secondary' : 'text-text-muted'">
                                <IconBox v-if="loc.container" :size="17" />
                                <IconMapPin v-else :size="16" />
                            </span>

                            <!-- Name -->
                            <span class="flex-1 text-[14px] truncate"
                                :class="[
                                    modelValue === loc.id && !loc.hasChildren && !loc.container ? 'text-accent font-medium' : 'text-text-primary',
                                    loc.container ? 'font-medium' : ''
                                ]">
                                {{ loc.name }}
                            </span>

                            <!-- Checkmark (leaf, selected) -->
                            <IconCheck v-if="modelValue === loc.id && !loc.hasChildren && !loc.container" :size="15"
                                class="text-accent shrink-0" />
                            <!-- Chevron (has children or container) -->
                            <IconChevronRight v-else-if="loc.hasChildren || loc.container" :size="15"
                                class="text-text-muted shrink-0" />
                        </button>
                    </template>

                    <div v-else class="flex flex-col items-center justify-center py-12 gap-2 text-text-muted">
                        <IconMapPinOff :size="28" />
                        <span class="text-[13px]">Keine Orte vorhanden</span>
                    </div>
                </div>

                <!-- Container zone picker -->
                <div v-else-if="viewMode === 'container' && activeContainer"
                    class="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-3">
                    <p class="text-[12px] text-text-muted">Zone auswählen:</p>
                    <div class="w-full rounded-xl overflow-hidden border border-border bg-bg-elevated"
                        :style="{ aspectRatio: `${activeContainer.dimensions.width} / ${activeContainer.dimensions.height}` }">
                        <ContainerZonePickerNode
                            :node="activeContainer.rootNode"
                            :selected-id="modelValue"
                            @select="selectZone"
                        />
                    </div>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { useLocations } from "~/composables/useLocations"
import { useContainers } from "~/composables/useContainers"
import type { Container } from "~/types/container"

const props = defineProps<{
    open: boolean
    modelValue: string
}>()

const emit = defineEmits<{
    close: []
    "update:modelValue": [id: string]
}>()

const { locations, flatList, getLocationPath } = useLocations()
const { containers } = useContainers()

const searchRef = ref<HTMLInputElement>()
const query = ref("")
const breadcrumb = ref<{ id: string; name: string }[]>([])
const viewMode = ref<"locations" | "container">("locations")
const activeContainer = ref<Container | null>(null)

const currentParentId = computed(() =>
    breadcrumb.value.length > 0 ? breadcrumb.value[breadcrumb.value.length - 1].id : null
)

const currentLevelLocations = computed(() => {
    return locations.value
        .filter((l) => l.parentId === currentParentId.value)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((loc) => {
            const container = containers.value.find((c) => c.locationId === loc.id)
            const hasChildren = !container && locations.value.some((l) => l.parentId === loc.id)
            return { ...loc, container, hasChildren }
        })
})

const searchResults = computed(() => {
    if (!query.value) return []
    const q = query.value.toLowerCase()
    return flatList.value.filter((l) => l.name.toLowerCase().includes(q))
})

function handleLocationClick(loc: { id: string; name: string; container?: Container; hasChildren: boolean }) {
    if (loc.container) {
        activeContainer.value = loc.container
        viewMode.value = "container"
    } else if (loc.hasChildren) {
        breadcrumb.value = [...breadcrumb.value, { id: loc.id, name: loc.name }]
    } else {
        selectDirect(loc.id)
    }
}

function goBack() {
    if (viewMode.value === "container") {
        viewMode.value = "locations"
        activeContainer.value = null
    } else {
        breadcrumb.value = breadcrumb.value.slice(0, -1)
    }
}

function navigateToCrumb(index: number) {
    breadcrumb.value = breadcrumb.value.slice(0, index + 1)
    viewMode.value = "locations"
    activeContainer.value = null
}

function selectDirect(id: string) {
    emit("update:modelValue", id)
    emit("close")
}

function selectZone(locationId: string) {
    emit("update:modelValue", locationId)
    emit("close")
}

function highlight(name: string, q: string) {
    const idx = name.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return [{ text: name, match: false }]
    return [
        { text: name.slice(0, idx), match: false },
        { text: name.slice(idx, idx + q.length), match: true },
        { text: name.slice(idx + q.length), match: false },
    ].filter((p) => p.text)
}

watch(() => props.open, (v) => {
    if (v) {
        query.value = ""
        breadcrumb.value = []
        viewMode.value = "locations"
        activeContainer.value = null
        nextTick(() => searchRef.value?.focus())
    }
})
</script>
