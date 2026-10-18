/**
 * Adding an item is reachable from everywhere — the nav, a location page, an
 * empty search. All of those flip the same flag, and the layout owns the sheet,
 * so no page has to mount its own copy.
 */
const open = ref(false)
const presetLocationId = ref<string | null>(null)

export function useQuickAdd() {
    /** Pass a location to have it preselected — that is the fast path from a location page. */
    function openQuickAdd(locationId?: string | null) {
        presetLocationId.value = locationId ?? null
        open.value = true
    }

    function closeQuickAdd() {
        open.value = false
        presetLocationId.value = null
    }

    return { open, presetLocationId, openQuickAdd, closeQuickAdd }
}
