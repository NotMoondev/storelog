import Fuse from "fuse.js"
import type { ItemView, Location } from "~/types"
import { useDebounceFn } from "./useDebounce"

/** A search result is just an item with its card context attached. */
export type SearchHit = ItemView

export function useSearch() {
    const { items } = useItems()
    const { locations } = useLocations()
    const { decorateItem, zoneLocationIds } = useTopology()

    const query = ref("")
    const results = ref<SearchHit[]>([])
    const locationResults = ref<Location[]>([])

    const decorated = computed<SearchHit[]>(() => items.value.map(decorateItem))

    /** Newest first — what the page shows before anything is typed. */
    const recent = computed<SearchHit[]>(() =>
        [...decorated.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 12)
    )

    const fuse = computed(
        () =>
            new Fuse(decorated.value, {
                keys: [
                    { name: "name", weight: 0.7 },
                    { name: "locationPath", weight: 0.2 },
                    { name: "note", weight: 0.1 },
                ],
                threshold: 0.35,
                includeScore: true,
                ignoreLocation: true,
                minMatchCharLength: 1,
            })
    )

    const locationFuse = computed(
        () =>
            new Fuse(locations.value, {
                keys: [{ name: "name", weight: 1 }],
                threshold: 0.3,
                ignoreLocation: true,
                minMatchCharLength: 2,
            })
    )

    const runSearch = useDebounceFn(() => {
        const q = query.value.trim()
        if (!q) {
            results.value = recent.value
            locationResults.value = []
            return
        }
        results.value = fuse.value.search(q).map((r) => r.item).slice(0, 60)
        locationResults.value = locationFuse.value
            .search(q)
            .map((r) => r.item)
            .filter((l) => !zoneLocationIds.value.has(l.id))
            .slice(0, 5)
    }, 80)

    watch([query, decorated], () => runSearch(), { immediate: true })

    function clearQuery() {
        query.value = ""
    }

    return {
        query,
        results,
        locationResults,
        recent,
        clearQuery,
    }
}
