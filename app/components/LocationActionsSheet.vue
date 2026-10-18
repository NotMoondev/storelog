<template>
    <UiActionSheet v-if="menuOpen" :title="location.name" :subtitle="parentPath || undefined" :actions="actions"
        @close="menuOpen = false; settle()" />

    <LocationPickerSheet :open="pickerOpen" :model-value="location.parentId ?? ''" title="Verschieben nach"
        allow-root @update:model-value="moveTo" @close="pickerOpen = false; settle()" />

    <DissolveLocationSheet v-if="dissolveOpen" :location="location" @close="dissolveOpen = false; settle()"
        @dissolved="onDissolved" />
</template>

<script setup lang="ts">
import { CornerUpLeft, CornerUpRight, LayoutGrid, Pen, Trash2 } from "lucide-vue-next"
import type { Location } from "~/types"
import type { SheetAction } from "~/components/UiActionSheet.vue"

/**
 * Everything you can do to a place, behind ⋯ on its page or a long press on
 * its row. Renaming and editing the layout belong to the page, so those two
 * are handed back as events; the rest happens here.
 */
const props = defineProps<{ location: Location }>()

const emit = defineEmits<{
    close: []
    rename: []
    "edit-layout": []
}>()

const { moveLocation } = useLocations()
const { containerOf, ancestorsOf } = useTopology()
const toast = useToast()
const router = useRouter()

const menuOpen = ref(true)
const pickerOpen = ref(false)
const dissolveOpen = ref(false)

const parentPath = computed(() => ancestorsOf(props.location.id).slice(0, -1).map((l) => l.name).join(" › "))

const actions = computed<SheetAction[]>(() => {
    const list: SheetAction[] = [
        { label: "Umbenennen", hint: "Namen direkt im Titel ändern", icon: Pen, run: () => emit("rename") },
    ]
    if (containerOf(props.location.id)) {
        list.push({
            label: "Aufteilung bearbeiten",
            hint: "Fächer teilen, benennen, entfernen",
            icon: LayoutGrid,
            run: () => emit("edit-layout"),
        })
    }
    list.push({
        label: "Verschieben",
        hint: "Mit allem Inhalt woanders einhängen",
        icon: CornerUpRight,
        run: () => { pickerOpen.value = true },
    })
    if (props.location.parentId) {
        list.push({
            label: "Zum Hauptort machen",
            hint: "Aus der Verschachtelung auf die oberste Ebene holen",
            icon: CornerUpLeft,
            run: () => { moveTo("") },
        })
    }
    list.push({
        label: "Ort auflösen",
        hint: "Für jeden Inhalt entscheiden, wohin",
        icon: Trash2,
        danger: true,
        run: () => { dissolveOpen.value = true },
    })
    return list
})

/**
 * Once nothing of this component is open any more, tell the parent. A
 * macrotask, not nextTick: the menu runs its chosen action on nextTick after
 * closing, and that action may open the next sheet.
 */
function settle() {
    setTimeout(() => {
        if (!menuOpen.value && !pickerOpen.value && !dissolveOpen.value) emit("close")
    })
}

async function moveTo(targetId: string) {
    const from = props.location.parentId
    const to = targetId || null
    if (to === from) return settle()
    try {
        await moveLocation(props.location.id, to)
        const name = props.location.name
        toast.show({
            message: to ? `„${name}“ verschoben nach ${ancestorsOf(to).map((l) => l.name).slice(-2).join(" › ")}` : `„${name}“ ist jetzt ein Hauptort`,
            undo: () => moveLocation(props.location.id, from),
        })
    } catch (err) {
        toast.error(err, "Verschieben hat nicht geklappt.")
    }
    settle()
}

function onDissolved() {
    const parent = props.location.parentId
    const name = props.location.name
    dissolveOpen.value = false
    router.replace(parent ? `/orte/${parent}` : "/orte")
    toast.show({ message: `„${name}“ aufgelöst` })
    settle()
}
</script>
