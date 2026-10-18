/**
 * Selecting items for a bulk move or delete. The state is shared because the
 * SelectionBar lives in the layout, where it replaces the navigation at the
 * bottom of the screen while a page owns the rows being selected.
 */
const active = ref(false)
const ids = ref<Set<string>>(new Set())

export function useSelection() {
    const count = computed(() => ids.value.size)

    function start(firstId?: string) {
        active.value = true
        ids.value = new Set(firstId ? [firstId] : [])
    }

    function stop() {
        active.value = false
        ids.value = new Set()
    }

    function toggle(id: string) {
        const next = new Set(ids.value)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        ids.value = next
    }

    function selectAll(all: string[]) {
        ids.value = new Set(all)
    }

    function has(id: string) {
        return ids.value.has(id)
    }

    return { active: readonly(active), ids: readonly(ids), count, start, stop, toggle, selectAll, has }
}
