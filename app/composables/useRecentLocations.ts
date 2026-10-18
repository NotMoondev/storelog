const MAX = 6

/**
 * The last places something was put. Filing a new item almost always repeats a
 * recent choice, so these become one-tap chips instead of a picker round-trip.
 */
export function useRecentLocations() {
    const ids = usePersistedRef<string[]>("storelog:recentLocations", [])

    function remember(locationId: string) {
        if (!locationId) return
        ids.value = [locationId, ...ids.value.filter((id) => id !== locationId)].slice(0, MAX)
    }

    /** Only ids that still exist, resolved to locations. */
    function resolve(known: { id: string; name: string }[]) {
        return ids.value
            .map((id) => known.find((l) => l.id === id))
            .filter((l): l is { id: string; name: string } => !!l)
    }

    return { ids, remember, resolve }
}
