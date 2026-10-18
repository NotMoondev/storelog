<template>
    <UiSheet v-if="open" :title="title" :subtitle="subtitle" @close="close">
        <div class="flex flex-col gap-5 px-5 pt-1 pb-5">

            <UiSegmented v-if="!request.series" v-model="kind" :options="kindOptions" label="Was anlegen?" />

            <UiTextField ref="nameRef" v-model="name" label="Name" :placeholder="namePlaceholder"
                :enterkeyhint="kind === 'item' && !locationId ? 'next' : 'done'" :error="nameError" @enter="onNameEnter" />

            <!-- Item: where it goes -->
            <div v-if="kind === 'item' && !request.series" class="flex flex-col gap-2">
                <span class="eyebrow">Ort</span>
                <div v-if="chips.length" class="flex gap-2 overflow-x-auto no-scrollbar -my-1 py-1">
                    <UiChip v-for="loc in chips" :key="loc.id" :pressed="locationId === loc.id"
                        @click="locationId = loc.id">
                        {{ loc.name }}
                    </UiChip>
                </div>
                <LocationTrigger :location-id="locationId" placeholder="Ort wählen" @click="pickerOpen = true" />
            </div>

            <!-- Location / container: what it sits in -->
            <div v-else-if="kind !== 'item'" class="flex flex-col gap-2">
                <span class="eyebrow">Liegt in</span>
                <LocationTrigger :location-id="locationId" placeholder="Oberste Ebene" allow-empty
                    @click="pickerOpen = true" />
            </div>

            <!-- Item: optional note, folded away until wanted -->
            <template v-if="kind === 'item'">
                <UiTextField v-if="showNote" ref="noteRef" v-model="note" label="Notiz" optional
                    placeholder="z. B. das lange, weiße" @enter="submit" />
                <button v-else type="button"
                    class="tap-area self-start inline-flex items-center gap-1 text-meta font-medium text-accent-text cursor-pointer"
                    @click="openNote">
                    <Plus :size="16" /> Notiz hinzufügen
                </button>
            </template>

            <!-- Container: rough shape; the compartments are drawn in the editor next -->
            <div v-if="kind === 'container'" class="flex flex-col gap-2">
                <span class="eyebrow">Form</span>
                <div class="grid grid-cols-2 gap-2">
                    <button v-for="p in presets" :key="p.label" type="button" :aria-pressed="preset === p"
                        class="flex items-center gap-3 h-14 px-3 rounded-md border text-left cursor-pointer transition-colors"
                        :class="preset === p
                            ? 'bg-accent-dim border-accent text-accent-text'
                            : 'bg-bg-elevated border-border text-text-secondary hover:border-border-strong'"
                        @click="preset = p">
                        <span class="size-8 shrink-0 flex items-center justify-center">
                            <span class="border-2 rounded-[3px]" :class="preset === p ? 'border-accent' : 'border-border-strong'"
                                :style="previewBox(p)" />
                        </span>
                        <span class="min-w-0">
                            <span class="block text-meta font-medium truncate">{{ p.label }}</span>
                            <span class="block text-caption text-text-muted tabular-nums">{{ p.width }} × {{ p.height }}</span>
                        </span>
                    </button>
                </div>
                <UiChip class="self-start" :pressed="useGrid" @click="useGrid = !useGrid">
                    <Check v-if="useGrid" :size="16" />
                    Raster als {{ zoneCount(preset.width * preset.height) }} anlegen
                </UiChip>
            </div>

            <!-- Series: what went in so far -->
            <section v-if="request.series && saved.length" class="flex flex-col gap-2">
                <h3 class="eyebrow">Gerade abgelegt <span class="text-text-muted tracking-normal">{{ saved.length }}</span></h3>
                <p v-for="s in saved" :key="s.id" class="flex items-center gap-2 text-meta text-text-secondary">
                    <Check :size="16" class="text-accent-text shrink-0" />
                    <span class="truncate">{{ s.name }}</span>
                </p>
            </section>
        </div>

        <template #footer>
            <UiActionBar>
                <UiButton v-if="request.series" variant="secondary" @click="finishSeries">Fertig</UiButton>
                <UiButton variant="primary" :disabled="!canSubmit" :loading="saving" @click="submit">
                    {{ submitLabel }}
                </UiButton>
            </UiActionBar>
        </template>

        <template #after>
            <LocationPickerSheet :open="pickerOpen" :model-value="locationId ?? ''"
                :title="kind === 'item' ? 'Ort wählen' : 'Liegt in'" :allow-root="kind !== 'item'"
                @update:model-value="onPicked" @close="pickerOpen = false" />
        </template>
    </UiSheet>
</template>

<script setup lang="ts">
import { Check, Plus } from "lucide-vue-next"
import type { CreateKind } from "~/composables/useCreate"
import { buildGridTree } from "~/repositories/containerRepository"
import { zoneCount } from "~/utils/plural"

interface Preset { label: string; width: number; height: number }

/**
 * One sheet for items, places and containers. It starts from whatever the
 * caller already knows (search term, open place, chosen compartment) and keeps
 * the typed name when the kind is switched.
 */
const { open, request, closeCreate } = useCreate()
const { locations } = useLocations()
const { createItem, deleteItems } = useItems()
const { createLocation } = useLocations()
const { createContainer } = useContainers()
const { getLocationPath, getLocation } = useTopology()
const { remember, resolve } = useRecentLocations()
const toast = useToast()
const router = useRouter()

const kindOptions: { value: CreateKind; label: string }[] = [
    { value: "item", label: "Gegenstand" },
    { value: "location", label: "Ort" },
    { value: "container", label: "Container" },
]

const presets: Preset[] = [
    { label: "Quadrat", width: 1, height: 1 },
    { label: "Hochschrank", width: 1, height: 4 },
    { label: "Kleiderschrank", width: 2, height: 3 },
    { label: "Regal", width: 3, height: 2 },
    { label: "Kommode", width: 4, height: 3 },
    { label: "Sideboard", width: 4, height: 2 },
]

const kind = ref<CreateKind>("item")
const name = ref("")
const note = ref("")
const showNote = ref(false)
const locationId = ref<string | null>(null)
const preset = ref<Preset>(presets[2]!)
const useGrid = ref(true)
const saving = ref(false)
const nameError = ref("")
const pickerOpen = ref(false)
const saved = ref<{ id: string; name: string }[]>([])

const nameRef = ref<{ focus: () => void }>()
const noteRef = ref<{ focus: () => void }>()

/** A name typed and then dismissed comes back next time, instead of a prompt. */
let draft: { kind: CreateKind; name: string; note: string } | null = null

// ── Derived ──────────────────────────────────────────────────────────────────

const locationName = computed(() => (locationId.value ? getLocation(locationId.value)?.name ?? "" : ""))

const title = computed(() => {
    if (request.value.series) return `In ${locationName.value} ablegen`
    return { item: "Gegenstand anlegen", location: "Ort anlegen", container: "Container anlegen" }[kind.value]
})

const subtitle = computed(() => {
    if (!request.value.series || !locationId.value) return undefined
    const path = getLocationPath(locationId.value).slice(0, -1)
    return path.length ? path.join(" › ") : undefined
})

const namePlaceholder = computed(() => ({
    item: "z. B. Ladekabel, Schlüssel",
    location: "z. B. Keller, Schreibtisch",
    container: "z. B. Kleiderschrank, Regal",
}[kind.value]))

const submitLabel = computed(() => {
    if (request.value.series) return "Ablegen"
    return kind.value === "container" ? "Anlegen & aufteilen" : "Anlegen"
})

/** Recent places as one-tap chips; a place handed in by the caller leads. */
const chips = computed(() => {
    const list = resolve(locations.value).slice(0, 4)
    const preset = request.value.locationId
    if (preset && !list.some((l) => l.id === preset)) {
        const loc = getLocation(preset)
        if (loc) list.unshift(loc)
    }
    return list.slice(0, 4)
})

const canSubmit = computed(() => {
    if (!name.value.trim() || saving.value) return false
    return kind.value !== "item" || !!locationId.value
})

function previewBox(p: Preset) {
    const scale = 28 / Math.max(p.width, p.height)
    return { width: `${Math.max(6, p.width * scale)}px`, height: `${Math.max(6, p.height * scale)}px` }
}

// ── Open / close ─────────────────────────────────────────────────────────────

watch(open, (isOpen) => {
    if (!isOpen) return
    const req = request.value
    kind.value = req.kind
    locationId.value = req.locationId
    name.value = req.name
    note.value = ""
    showNote.value = false
    nameError.value = ""
    saved.value = []
    preset.value = presets[2]!
    useGrid.value = true

    if (!req.name && !req.series && draft && draft.kind === req.kind) {
        name.value = draft.name
        note.value = draft.note
        showNote.value = !!draft.note
    }
    draft = null

    // With the name already there, the next tap is the place, not the keyboard.
    if (!name.value) nextTick(() => nameRef.value?.focus())
})

watch(kind, () => { nameError.value = "" })

function close() {
    if (!request.value.series && name.value.trim()) {
        draft = { kind: kind.value, name: name.value, note: note.value }
    }
    if (request.value.series && saved.value.length) {
        finishSeries()
        return
    }
    closeCreate()
}

function openNote() {
    showNote.value = true
    nextTick(() => noteRef.value?.focus())
}

function onPicked(id: string) {
    locationId.value = id || null
}

function onNameEnter() {
    if (kind.value === "item" && !locationId.value) {
        pickerOpen.value = true
        return
    }
    submit()
}

// ── Save ─────────────────────────────────────────────────────────────────────

async function submit() {
    if (!canSubmit.value) {
        if (!name.value.trim()) nameError.value = "Gib einen Namen ein."
        return
    }
    saving.value = true
    try {
        if (kind.value === "item") await saveItem()
        else if (kind.value === "location") await saveLocation()
        else await saveContainer()
    } catch (err) {
        toast.error(err, "Anlegen hat nicht geklappt.")
    } finally {
        saving.value = false
    }
}

async function saveItem() {
    const target = locationId.value!
    const created = await createItem({ name: name.value.trim(), locationId: target, note: note.value.trim() || undefined })
    remember(target)

    if (request.value.series) {
        saved.value = [{ id: created.id, name: created.name }, ...saved.value]
        name.value = ""
        note.value = ""
        nextTick(() => nameRef.value?.focus())
        return
    }

    closeCreate()
    toast.show({
        message: `„${created.name}“ angelegt in ${getLocation(target)?.name ?? "Ort"}`,
        undo: () => deleteItems([created.id]).then(() => undefined),
    })
}

function finishSeries() {
    const items = saved.value
    closeCreate()
    if (!items.length) return
    toast.show({
        message: items.length === 1
            ? `„${items[0]!.name}“ in ${locationName.value} abgelegt`
            : `${items.length} Gegenstände in ${locationName.value} abgelegt`,
        undo: () => deleteItems(items.map((i) => i.id)).then(() => undefined),
    })
}

async function saveLocation() {
    const created = await createLocation(name.value.trim(), locationId.value)
    closeCreate()
    await router.push(`/orte/${created.id}`)
    toast.show({ message: `„${created.name}“ angelegt` })
}

async function saveContainer() {
    const { width, height } = preset.value
    const created = await createLocation(name.value.trim(), locationId.value)
    await createContainer(
        created.name,
        created.id,
        { unit: "ratio", width, height },
        useGrid.value ? buildGridTree(width, height) : undefined
    )
    closeCreate()
    // Straight on to drawing the compartments.
    await router.push({ path: `/orte/${created.id}`, query: { aufteilung: "1" } })
}

watch(name, () => { if (nameError.value) nameError.value = "" })
</script>
