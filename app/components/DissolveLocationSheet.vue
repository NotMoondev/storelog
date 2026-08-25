<template>
    <UiSheet size="lg" max-height="92dvh" @close="$emit('close')">
        <template #header>
            <div class="flex-1 min-w-0">
                <h2 class="font-['Syne'] text-[18px] font-bold text-text-primary leading-tight truncate">
                    „{{ location.name }}" auflösen
                </h2>
                <p class="text-[11.5px] text-text-muted mt-0.5">
                    Der Ort verschwindet. Entscheide, wohin sein Inhalt geht.
                </p>
            </div>
        </template>

        <div v-if="loading" class="px-5 py-12 text-center text-[13px] text-text-muted">Wird geprüft…</div>

        <div v-else-if="loadError" class="px-5 py-10 text-center flex flex-col items-center gap-3">
            <IconTriangleAlert :size="34" class="text-danger" />
            <p class="text-[13.5px] text-text-secondary">{{ loadError }}</p>
        </div>

        <div v-else-if="impact" class="px-4 py-4 flex flex-col gap-5">

            <!-- Default destination: set once, every "verschieben" row follows it -->
            <div class="flex items-center gap-3 bg-bg-elevated border rounded-xl px-3.5 py-3 transition-colors"
                :class="needsDefaultTarget ? 'border-danger/60' : 'border-border'">
                <div class="min-w-0 flex-1">
                    <p class="text-[11px] text-text-secondary tracking-[0.08em] uppercase">Standardziel</p>
                    <p class="text-[12px] mt-0.5 leading-snug"
                        :class="needsDefaultTarget ? 'text-danger' : 'text-text-muted'">
                        {{ needsDefaultTarget
                            ? 'Wird gebraucht — dieser Ort hat keinen übergeordneten Ort.'
                            : 'Gilt für alles, was du auf „Verschieben" stellst.' }}
                    </p>
                </div>
                <button type="button" @click="openPicker('default')"
                    class="shrink-0 max-w-[46%] flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer transition-all border"
                    :class="defaultTargetId
                        ? 'bg-accent-dim border-accent text-accent'
                        : needsDefaultTarget
                            ? 'bg-danger-dim border-danger text-danger'
                            : 'bg-bg-surface border-border text-text-muted hover:border-text-muted'">
                    <IconCornerUpRight :size="13" class="shrink-0" />
                    <span class="truncate">{{ defaultTargetName ?? 'Wählen…' }}</span>
                </button>
            </div>

            <!-- Sub-locations -->
            <section v-if="impact.children.length" class="flex flex-col gap-2">
                <div class="flex items-baseline gap-2 px-0.5">
                    <h3 class="text-[11px] text-text-secondary/80 tracking-[0.12em] uppercase">Unterorte</h3>
                    <span class="text-[11px] text-text-muted tabular-nums">{{ impact.children.length }}</span>
                    <button type="button" @click="setAllChildren('promote')"
                        class="ml-auto text-[11px] text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer transition-colors">
                        alle hochstufen
                    </button>
                </div>

                <div v-for="child in impact.children" :key="child.id"
                    class="rounded-xl border transition-colors" :class="rowTone(childPlans[child.id]!.action)">
                    <div class="flex items-start gap-2.5 px-3 pt-3 pb-2">
                        <IconLayoutGrid v-if="child.isContainer" :size="15" class="text-text-muted shrink-0 mt-0.5" />
                        <IconMapPin v-else :size="15" class="text-text-muted shrink-0 mt-0.5" />
                        <div class="min-w-0 flex-1">
                            <p class="text-[13.5px] font-medium text-text-primary truncate">{{ child.name }}</p>
                            <p class="text-[11px] text-text-muted">
                                <span v-if="child.descendantLocations">{{ subLocationCount(child.descendantLocations) }} · </span>
                                {{ itemCount(child.descendantItems) }}
                            </p>
                        </div>
                    </div>

                    <div class="px-3 pb-3 flex flex-col gap-2">
                        <div class="flex gap-1 bg-bg-elevated rounded-lg p-0.5">
                            <button v-for="opt in childOptions" :key="opt.value" type="button"
                                :aria-pressed="childPlans[child.id]!.action === opt.value"
                                @click="childPlans[child.id]!.action = opt.value"
                                class="flex-1 rounded-md py-1.5 text-[11.5px] cursor-pointer border-none transition-colors"
                                :class="segClass(childPlans[child.id]!.action === opt.value, opt.value)">
                                {{ opt.label }}
                            </button>
                        </div>

                        <p class="text-[11px] leading-snug flex items-center gap-1.5"
                            :class="childPlans[child.id]!.action === 'delete' ? 'text-danger' : 'text-text-muted'">
                            <template v-if="childPlans[child.id]!.action === 'promote'">
                                <IconCornerUpLeft :size="11" class="shrink-0" />
                                <span>{{ impact.parentName ? `rückt hoch nach „${impact.parentName}"` : 'wird selbst zum Hauptort' }}</span>
                            </template>
                            <template v-else-if="childPlans[child.id]!.action === 'move'">
                                <IconCornerUpRight :size="11" class="shrink-0" />
                                <button type="button" @click="openPicker('child', child.id)"
                                    class="bg-transparent border-none p-0 cursor-pointer underline decoration-dotted underline-offset-2 transition-colors"
                                    :class="effectiveTarget(childPlans[child.id]!) ? 'text-accent' : 'text-danger'">
                                    {{ targetLabel(childPlans[child.id]!) }}
                                </button>
                                <span>· mit allem darin</span>
                            </template>
                            <template v-else>
                                <IconTrash2 :size="11" class="shrink-0" />
                                <span>
                                    löscht {{ locationCount(child.descendantLocations + 1) }}
                                    und {{ itemCount(child.descendantItems) }}
                                </span>
                            </template>
                        </p>
                    </div>
                </div>
            </section>

            <!-- Items that lose their home -->
            <section v-if="impact.items.length" class="flex flex-col gap-2">
                <div class="flex items-baseline gap-2 px-0.5">
                    <h3 class="text-[11px] text-text-secondary/80 tracking-[0.12em] uppercase">Gegenstände</h3>
                    <span class="text-[11px] text-text-muted tabular-nums">{{ impact.items.length }}</span>
                    <div class="ml-auto flex items-center gap-2">
                        <button type="button" @click="setAllItems('move')"
                            class="text-[11px] text-text-muted hover:text-accent bg-transparent border-none cursor-pointer transition-colors">
                            alle verschieben
                        </button>
                        <button type="button" @click="setAllItems('delete')"
                            class="text-[11px] text-text-muted hover:text-danger bg-transparent border-none cursor-pointer transition-colors">
                            alle löschen
                        </button>
                    </div>
                </div>
                <p class="text-[11px] text-text-muted px-0.5 -mt-1">
                    Sie können nicht bleiben — ihr Ort verschwindet.
                </p>

                <div v-for="item in impact.items" :key="item.id"
                    class="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors"
                    :class="rowTone(itemPlans[item.id]!.action)">
                    <div class="min-w-0 flex-1">
                        <p class="text-[13px] text-text-primary truncate">
                            {{ item.name }}
                            <span v-if="item.note" class="text-text-muted italic">· {{ item.note }}</span>
                        </p>
                        <p class="text-[10.5px] truncate"
                            :class="itemPlans[item.id]!.action === 'delete' ? 'text-danger' : 'text-text-muted'">
                            <template v-if="itemPlans[item.id]!.action === 'delete'">wird gelöscht</template>
                            <template v-else>
                                <span class="text-text-muted">→ </span>
                                <button type="button" @click="openPicker('item', item.id)"
                                    class="bg-transparent border-none p-0 cursor-pointer underline decoration-dotted underline-offset-2 transition-colors"
                                    :class="effectiveTarget(itemPlans[item.id]!) ? 'text-accent' : 'text-danger'">
                                    {{ targetLabel(itemPlans[item.id]!) }}
                                </button>
                            </template>
                            <span v-if="item.zoneName" class="text-text-muted"> · aus {{ item.zoneName }}</span>
                        </p>
                    </div>

                    <div class="flex gap-1 bg-bg-elevated rounded-lg p-0.5 shrink-0">
                        <button v-for="opt in itemOptions" :key="opt.value" type="button"
                            :aria-pressed="itemPlans[item.id]!.action === opt.value"
                            :aria-label="`${item.name}: ${opt.label}`"
                            @click="itemPlans[item.id]!.action = opt.value"
                            class="w-9 h-7 flex items-center justify-center rounded-md cursor-pointer border-none transition-colors"
                            :class="segClass(itemPlans[item.id]!.action === opt.value, opt.value)">
                            <component :is="opt.icon" :size="13" />
                        </button>
                    </div>
                </div>
            </section>

            <p v-if="!impact.children.length && !impact.items.length"
                class="text-[13px] text-text-muted text-center py-6">
                Der Ort ist leer — er wird einfach entfernt.
            </p>
        </div>

        <template #footer>
            <div class="flex flex-col gap-3">
                <div v-if="impact" class="flex flex-col gap-1 text-[11.5px]">
                    <p v-for="line in summaryLines" :key="line.text"
                        :class="line.tone === 'danger' ? 'text-danger' : 'text-text-secondary'">
                        {{ line.text }}
                    </p>
                </div>

                <p v-if="blocker || submitError" class="text-[11.5px] text-danger flex items-start gap-1.5">
                    <IconTriangleAlert :size="13" class="shrink-0 mt-0.5" />
                    <span>{{ blocker || submitError }}</span>
                </p>

                <div class="flex gap-3">
                    <button type="button" @click="$emit('close')"
                        class="flex-1 py-3.5 rounded-xl text-[14px] cursor-pointer border transition-all bg-bg-elevated text-text-secondary border-border active:scale-[0.97] hover:text-text-primary">
                        Abbrechen
                    </button>
                    <button type="button" :disabled="!!blocker || submitting || loading" @click="submit"
                        class="flex-1 py-3.5 rounded-xl text-[14px] font-medium cursor-pointer border-none transition-all bg-danger text-black active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                        {{ submitting ? 'Wird aufgelöst…' : 'Auflösen' }}
                    </button>
                </div>
            </div>
        </template>

        <LocationPickerSheet :open="!!picker" :model-value="pickerCurrent" @update:model-value="onPick"
            @close="picker = null" />
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
    if (action === "move") return "bg-bg-surface border-accent/30"
    return "bg-bg-surface border-border-subtle"
}

function segClass(active: boolean, value: ChildAction | ItemAction): string {
    if (!active) return "bg-transparent text-text-muted hover:text-text-secondary"
    if (value === "delete") return "bg-danger text-black font-semibold"
    if (value === "move") return "bg-accent text-black font-semibold"
    return "bg-bg-hover text-text-primary font-semibold"
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
    if (missing) return `${missing} Zeile${missing !== 1 ? "n" : ""} ohne Zielort — oben ein Standardziel setzen.`
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
