<template>
    <UiSheet size="lg" max-height="92dvh" :title="`„${location.name}“ auflösen`"
        subtitle="Der Ort verschwindet. Entscheide, wohin sein Inhalt geht." @close="$emit('close')">

        <div v-if="loading" class="px-5 py-12 text-center text-meta text-text-muted">Wird geprüft…</div>

        <div v-else-if="loadError" class="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <IconTriangleAlert :size="40" class="text-danger" />
            <p class="text-body text-text-secondary">{{ loadError }}</p>
        </div>

        <div v-else-if="impact" class="px-4 pt-1 pb-4 flex flex-col gap-6">

            <!-- Default destination: set once, every "Verschieben" row follows it -->
            <div class="flex items-center gap-3 rounded-md bg-bg-elevated border px-4 py-3"
                :class="needsDefaultTarget ? 'border-danger' : 'border-border'">
                <div class="min-w-0 flex-1">
                    <p class="eyebrow">Standardziel</p>
                    <p class="text-meta mt-0.5" :class="needsDefaultTarget ? 'text-danger' : 'text-text-muted'">
                        {{ needsDefaultTarget
                            ? 'Wird gebraucht: dieser Ort hat keinen übergeordneten Ort.'
                            : 'Gilt für alles, was du auf „Verschieben“ stellst.' }}
                    </p>
                </div>
                <UiChip class="max-w-[46%]" :pressed="!!defaultTargetId" @click="openPicker('default')">
                    <IconCornerUpRight :size="16" class="shrink-0" />
                    <span class="truncate">{{ defaultTargetName ?? 'Ziel wählen' }}</span>
                </UiChip>
            </div>

            <!-- Sub-locations -->
            <section v-if="impact.children.length" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 px-1 min-h-11">
                    <h3 class="eyebrow">Unterorte <span class="text-text-muted tracking-normal tabular-nums">{{ impact.children.length }}</span></h3>
                    <button type="button" class="tap-area ml-auto text-meta font-medium text-accent-text cursor-pointer"
                        @click="setAllChildren('promote')">
                        Alle hochstufen
                    </button>
                </div>

                <div v-for="child in impact.children" :key="child.id" class="rounded-md border p-3 flex flex-col gap-3"
                    :class="rowTone(childPlans[child.id]!.action)">
                    <div class="flex items-start gap-3">
                        <IconLayoutGrid v-if="child.isContainer" :size="18" class="text-text-muted shrink-0 mt-0.5" />
                        <IconMapPin v-else :size="18" class="text-text-muted shrink-0 mt-0.5" />
                        <div class="min-w-0 flex-1">
                            <p class="font-name text-title-sm text-text-primary truncate">{{ child.name }}</p>
                            <p class="text-caption text-text-muted tabular-nums">
                                <span v-if="child.descendantLocations">{{ subLocationCount(child.descendantLocations) }} · </span>
                                {{ itemCount(child.descendantItems) }}
                            </p>
                        </div>
                    </div>

                    <UiSegmented v-model="childPlans[child.id]!.action" :options="childOptions"
                        :label="`${child.name}: was passiert`" />

                    <p class="text-meta flex items-center gap-1.5"
                        :class="childPlans[child.id]!.action === 'delete' ? 'text-danger' : 'text-text-muted'">
                        <template v-if="childPlans[child.id]!.action === 'promote'">
                            <IconCornerUpLeft :size="14" class="shrink-0" />
                            <span>{{ impact.parentName ? `rückt hoch nach „${impact.parentName}“` : 'wird selbst zum Hauptort' }}</span>
                        </template>
                        <template v-else-if="childPlans[child.id]!.action === 'move'">
                            <IconCornerUpRight :size="14" class="shrink-0" />
                            <button type="button" class="tap-area underline decoration-dotted underline-offset-2 cursor-pointer"
                                :class="effectiveTarget(childPlans[child.id]!) ? 'text-accent-text' : 'text-danger'"
                                @click="openPicker('child', child.id)">
                                {{ targetLabel(childPlans[child.id]!) }}
                            </button>
                            <span>· mit allem darin</span>
                        </template>
                        <template v-else>
                            <IconTrash2 :size="14" class="shrink-0" />
                            <span>
                                löscht {{ locationCount(child.descendantLocations + 1) }}
                                und {{ itemCount(child.descendantItems) }}
                            </span>
                        </template>
                    </p>
                </div>
            </section>

            <!-- Items that lose their home -->
            <section v-if="impact.items.length" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 px-1 min-h-11">
                    <h3 class="eyebrow">Gegenstände <span class="text-text-muted tracking-normal tabular-nums">{{ impact.items.length }}</span></h3>
                    <div class="ml-auto flex items-center gap-4">
                        <button type="button" class="tap-area text-meta font-medium text-accent-text cursor-pointer"
                            @click="setAllItems('move')">
                            Alle verschieben
                        </button>
                        <button type="button" class="tap-area text-meta font-medium text-danger cursor-pointer"
                            @click="setAllItems('delete')">
                            Alle löschen
                        </button>
                    </div>
                </div>
                <p class="text-meta text-text-muted px-1 -mt-1">Sie können nicht bleiben, ihr Ort verschwindet.</p>

                <div v-for="item in impact.items" :key="item.id"
                    class="flex items-center gap-3 rounded-md border pl-3 pr-1.5 py-2 min-h-16"
                    :class="rowTone(itemPlans[item.id]!.action)">
                    <div class="min-w-0 flex-1">
                        <p class="font-name text-title-sm text-text-primary truncate">{{ item.name }}</p>
                        <p class="text-meta truncate"
                            :class="itemPlans[item.id]!.action === 'delete' ? 'text-danger' : 'text-text-muted'">
                            <template v-if="itemPlans[item.id]!.action === 'delete'">wird gelöscht</template>
                            <template v-else>
                                nach
                                <button type="button" class="underline decoration-dotted underline-offset-2 cursor-pointer"
                                    :class="effectiveTarget(itemPlans[item.id]!) ? 'text-accent-text' : 'text-danger'"
                                    @click="openPicker('item', item.id)">
                                    {{ targetLabel(itemPlans[item.id]!) }}
                                </button>
                            </template>
                            <span v-if="item.zoneName"> · aus {{ item.zoneName }}</span>
                        </p>
                    </div>

                    <div role="radiogroup" :aria-label="`${item.name}: was passiert`"
                        class="flex gap-1 p-1 rounded-md bg-bg-elevated border border-border shrink-0">
                        <button v-for="opt in itemOptions" :key="opt.value" type="button" role="radio"
                            :aria-checked="itemPlans[item.id]!.action === opt.value" :aria-label="opt.label"
                            :title="opt.label"
                            class="size-10 flex items-center justify-center rounded-sm cursor-pointer transition-colors"
                            :class="segClass(itemPlans[item.id]!.action === opt.value, opt.value)"
                            @click="itemPlans[item.id]!.action = opt.value">
                            <component :is="opt.icon" :size="18" />
                        </button>
                    </div>
                </div>
            </section>

            <p v-if="!impact.children.length && !impact.items.length" class="text-meta text-text-muted text-center py-6">
                Der Ort ist leer und wird einfach entfernt.
            </p>
        </div>

        <template #footer>
            <div class="flex flex-col gap-3">
                <div v-if="impact" class="flex flex-col gap-1 text-meta">
                    <p v-for="line in summaryLines" :key="line.text"
                        :class="line.tone === 'danger' ? 'text-danger' : 'text-text-secondary'">
                        {{ line.text }}
                    </p>
                </div>

                <p v-if="blocker || submitError" class="text-meta text-danger flex items-start gap-1.5">
                    <IconTriangleAlert :size="16" class="shrink-0 mt-0.5" />
                    <span>{{ blocker || submitError }}</span>
                </p>

                <!-- The one confirmation step left in Storelog: this cannot be undone. -->
                <UiActionBar>
                    <UiButton variant="danger-solid" :disabled="!!blocker || loading" :loading="submitting"
                        @click="submit">
                        {{ submitting ? 'Wird aufgelöst…' : `„${location.name}“ auflösen` }}
                    </UiButton>
                </UiActionBar>
            </div>
        </template>

        <template #after>
            <LocationPickerSheet :open="!!picker" :model-value="pickerCurrent" title="Ziel wählen"
                @update:model-value="onPick" @close="picker = null" />
        </template>
    </UiSheet>
</template>

<script setup lang="ts">
import type { Location } from "~/types"
import type { ChildAction, DissolveImpact, ItemAction } from "~/types/dissolve"
import { locationRepository } from "~/repositories/locationRepository"
import { errorMessage } from "~/utils/errorMessage"
import { itemCount, locationCount, subLocationCount } from "~/utils/plural"
import { CornerUpRight, Trash2 } from "lucide-vue-next"

/** `targetId: null` means "follow the default destination". */
interface RowPlan<A> {
    action: A
    targetId: string | null
}

const props = defineProps<{ location: Location }>()
const emit = defineEmits<{ close: []; dissolved: [] }>()

const { load: reloadLocations } = useLocations()
const { load: reloadItems } = useItems()
const { load: reloadContainers } = useContainers()
const { getLocation, subtreeIds } = useTopology()

const impact = ref<DissolveImpact | null>(null)
const loading = ref(true)
const loadError = ref("")
const submitError = ref("")
const submitting = ref(false)

const defaultTargetId = ref<string | null>(null)
const childPlans = reactive<Record<string, RowPlan<ChildAction>>>({})
const itemPlans = reactive<Record<string, RowPlan<ItemAction>>>({})

const childOptions: { value: ChildAction; label: string }[] = [
    { value: "promote", label: "Hochstufen" },
    { value: "move", label: "Verschieben" },
    { value: "delete", label: "Löschen" },
]
const itemOptions: { value: ItemAction; label: string; icon: unknown }[] = [
    { value: "move", label: "Verschieben", icon: CornerUpRight },
    { value: "delete", label: "Löschen", icon: Trash2 },
]

// ── Targets ───────────────────────────────────────────────────────────────────

const defaultTargetName = computed(() =>
    defaultTargetId.value ? (getLocation(defaultTargetId.value)?.name ?? null) : null
)

function effectiveTarget(plan: RowPlan<ChildAction | ItemAction>): string | null {
    return plan.targetId ?? defaultTargetId.value
}

function targetLabel(plan: RowPlan<ChildAction | ItemAction>): string {
    const id = effectiveTarget(plan)
    if (!id) return "Ziel wählen"
    return getLocation(id)?.name ?? "Unbekannter Ort"
}

/** Locations that vanish with this one and therefore cannot receive anything. */
const doomedIds = computed(() => new Set(subtreeIds(props.location.id)))

// ── Picker ────────────────────────────────────────────────────────────────────

const picker = ref<{ scope: "default" | "child" | "item"; id?: string } | null>(null)

const pickerCurrent = computed(() => {
    if (!picker.value) return ""
    if (picker.value.scope === "default") return defaultTargetId.value ?? ""
    const plan = picker.value.scope === "child"
        ? childPlans[picker.value.id!]
        : itemPlans[picker.value.id!]
    return plan ? (effectiveTarget(plan) ?? "") : ""
})

function openPicker(scope: "default" | "child" | "item", id?: string) {
    picker.value = { scope, id }
}

function onPick(targetId: string) {
    const current = picker.value
    picker.value = null
    if (!targetId || !current) return
    if (doomedIds.value.has(targetId)) {
        submitError.value = "Dieser Ort wird selbst aufgelöst und kann kein Ziel sein."
        return
    }
    if (current.scope === "default") {
        defaultTargetId.value = targetId
        return
    }
    if (current.scope === "child") {
        const plan = childPlans[current.id!]
        if (plan) { plan.targetId = targetId; plan.action = "move" }
        return
    }
    const plan = itemPlans[current.id!]
    if (plan) { plan.targetId = targetId; plan.action = "move" }
}

// ── Bulk helpers ──────────────────────────────────────────────────────────────

watch([childPlans, itemPlans, defaultTargetId], () => { submitError.value = "" }, { deep: true })

function setAllChildren(action: ChildAction) {
    for (const plan of Object.values(childPlans)) plan.action = action
}

function setAllItems(action: ItemAction) {
    for (const plan of Object.values(itemPlans)) plan.action = action
}

// ── Styling by outcome ────────────────────────────────────────────────────────

function rowTone(action: ChildAction | ItemAction): string {
    if (action === "delete") return "bg-danger-dim border-danger/30"
    if (action === "move") return "bg-bg-surface border-accent/40"
    return "bg-bg-surface border-border-subtle"
}

function segClass(active: boolean, value: ChildAction | ItemAction): string {
    if (!active) return "text-text-muted hover:text-text-primary"
    if (value === "delete") return "bg-danger text-on-danger"
    return "bg-accent text-on-accent"
}

// ── Summary and validation ────────────────────────────────────────────────────

const summary = computed(() => {
    const out = { promoted: 0, moved: 0, kept: 0, movedItems: 0, deletedItems: 0, deletedLocations: 1 }
    if (!impact.value) return out
    for (const child of impact.value.children) {
        const action = childPlans[child.id]?.action ?? "promote"
        if (action === "promote") out.promoted += 1
        else if (action === "move") out.moved += 1
        else {
            out.deletedLocations += child.descendantLocations + 1
            out.deletedItems += child.descendantItems
        }
    }
    for (const item of impact.value.items) {
        if (itemPlans[item.id]?.action === "delete") out.deletedItems += 1
        else out.movedItems += 1
    }
    out.kept = out.promoted + out.moved
    return out
})

const movesPending = computed(() => {
    if (!impact.value) return false
    return impact.value.children.some((c) => childPlans[c.id]?.action === "move")
        || impact.value.items.some((i) => itemPlans[i.id]?.action === "move")
})

/** With no parent to fall back on, moving anything needs an explicit target. */
const needsDefaultTarget = computed(() =>
    !defaultTargetId.value && !impact.value?.parentId && movesPending.value
)

const summaryLines = computed<{ text: string; tone: "normal" | "danger" }[]>(() => {
    if (!impact.value) return []
    const totals = summary.value
    const lines: { text: string; tone: "normal" | "danger" }[] = []

    if (totals.kept) {
        const parts: string[] = []
        if (totals.promoted) parts.push(`${totals.promoted} hochgestuft`)
        if (totals.moved) parts.push(`${totals.moved} verschoben`)
        const verb = totals.kept === 1 ? "bleibt" : "bleiben"
        lines.push({ text: `${locationCount(totals.kept)} ${verb} erhalten (${parts.join(", ")})`, tone: "normal" })
    }
    if (totals.movedItems) {
        const verb = totals.movedItems === 1 ? "wird" : "werden"
        lines.push({ text: `${itemCount(totals.movedItems)} ${verb} umgehängt`, tone: "normal" })
    }

    const gone: string[] = []
    if (totals.deletedItems) gone.push(itemCount(totals.deletedItems))
    // The location being dissolved always counts among the deleted ones.
    if (totals.deletedLocations) gone.push(locationCount(totals.deletedLocations))
    if (gone.length) {
        lines.push({ text: `${gone.join(" und ")} werden gelöscht`, tone: "danger" })
    }
    return lines
})

const blocker = computed(() => {
    if (!impact.value) return ""
    const missing =
        impact.value.children.filter((c) => childPlans[c.id]?.action === "move" && !effectiveTarget(childPlans[c.id]!)).length +
        impact.value.items.filter((i) => itemPlans[i.id]?.action === "move" && !effectiveTarget(itemPlans[i.id]!)).length
    if (missing) return `${missing} Zeile${missing !== 1 ? "n" : ""} ohne Zielort. Setze oben ein Standardziel.`
    return ""
})

// ── Load and submit ───────────────────────────────────────────────────────────

async function loadImpact() {
    loading.value = true
    loadError.value = ""
    try {
        const data = await locationRepository.impact(props.location.id)
        impact.value = data
        defaultTargetId.value = data.parentId
        for (const child of data.children) {
            childPlans[child.id] = { action: "promote", targetId: null }
        }
        for (const item of data.items) {
            // Moving keeps things; deleting is never the default.
            itemPlans[item.id] = { action: "move", targetId: null }
        }
    } catch (err) {
        loadError.value = errorMessage(err, "Vorschau konnte nicht geladen werden.")
    } finally {
        loading.value = false
    }
}

async function submit() {
    if (!impact.value || blocker.value || submitting.value) return
    submitting.value = true
    try {
        await locationRepository.dissolve(props.location.id, {
            children: impact.value.children.map((c) => ({
                id: c.id,
                action: childPlans[c.id]!.action,
                targetId: effectiveTarget(childPlans[c.id]!),
            })),
            items: impact.value.items.map((i) => ({
                id: i.id,
                action: itemPlans[i.id]!.action,
                targetId: effectiveTarget(itemPlans[i.id]!),
            })),
        })
        // Tell the page to navigate first: the reload below drops this location
        // from the store, which unmounts this sheet mid-await.
        emit("dissolved")
        await Promise.all([reloadLocations(), reloadItems(), reloadContainers()])
    } catch (err) {
        submitError.value = errorMessage(err, "Auflösen fehlgeschlagen.")
    } finally {
        submitting.value = false
    }
}

onMounted(loadImpact)
</script>
