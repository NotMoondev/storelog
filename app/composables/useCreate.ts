/**
 * Everything that can be created goes through one sheet. Callers pass what they
 * already know (a search term, the open location, the tapped compartment) so
 * nobody types it twice. The layout owns the sheet; pages only call `openCreate`.
 */
export type CreateKind = "item" | "location" | "container"

export interface CreateRequest {
    kind?: CreateKind
    /** Prefilled name, usually the search term that found nothing. */
    name?: string
    /** For an item: where it goes. For a location or container: its parent. */
    locationId?: string | null
    /**
     * Fill one place with several items in a row: the place is fixed, Enter
     * saves and clears the name. The default when coming from a location page.
     */
    series?: boolean
}

const open = ref(false)
const request = ref<Required<Omit<CreateRequest, "locationId">> & { locationId: string | null }>({
    kind: "item",
    name: "",
    locationId: null,
    series: false,
})

export function useCreate() {
    function openCreate(req: CreateRequest = {}) {
        request.value = {
            kind: req.kind ?? "item",
            name: req.name?.trim() ?? "",
            locationId: req.locationId ?? null,
            series: req.series ?? false,
        }
        open.value = true
    }

    function closeCreate() {
        open.value = false
    }

    return { open: readonly(open), request: readonly(request), openCreate, closeCreate }
}
