import Fuse from "fuse.js"
import type { Item, ItemWithPath } from "~/types"
import { useItems } from "./useItems"
import { useLocations } from "./useLocations"
import { useDebounceFn } from "./useDebounce"

export function useSearch() {
  const { items } = useItems()
  const { locations, getLocationPath } = useLocations()

  const query = ref("")
  const results = ref<ItemWithPath[]>([])

  const itemsWithPath = computed<ItemWithPath[]>(() =>
    items.value.map((item) => {
      const locationNames = getLocationPath(item.locationId)
      return {
        ...item,
        locationNames,
        locationPath: locationNames.join(" / "),
      }
    })
  )

  const fuse = computed(
    () =>
      new Fuse(itemsWithPath.value, {
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

  const debouncedSearch = useDebounceFn(() => {
    if (!query.value.trim()) {
      results.value = itemsWithPath.value.slice(0, 30)
      return
    }
    const raw = fuse.value.search(query.value)
    results.value = raw.map((r) => r.item).slice(0, 50)
  }, 80)

  watch([query, itemsWithPath], () => {
    debouncedSearch()
  })

  function clearQuery() {
    query.value = ""
  }

  // Initialize with all items
  watch(
    itemsWithPath,
    (val) => {
      if (!query.value.trim()) {
        results.value = val.slice(0, 30)
      }
    },
    { immediate: true }
  )

  return {
    query,
    results,
    clearQuery,
  }
}