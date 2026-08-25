import type { Container } from "~/types/container"
import type { Item, ItemView, Location } from "~/types"
import { collectLeaves } from "~/repositories/containerRepository"

const ROOT_KEY = "__root__"

export interface SubtreeCount {
    /** Items directly in this location. */
    own: number
    /** Items in this location and everything below it. */
    total: number
    /** Locations below this one, container zones not counted. */
    locations: number
}

/**
 * One place that joins locations, items and containers. Every page needs the
 * same derived views (child lists, item counts, zone membership); computing
 * them here keeps them consistent instead of rebuilding them per page.
 */
export function useTopology() {
    const { locations, getLocationPath } = useLocations()
    const { items } = useItems()
    const { containers } = useContainers()

    /** Items sitting directly in a location. */
    const itemCountByLocation = computed<Record<string, number>>(() => {
        const counts: Record<string, number> = {}
        for (const item of items.value) counts[item.locationId] = (counts[item.locationId] ?? 0) + 1
        return counts
    })

    const containerByLocation = computed<Record<string, Container>>(() => {
        const map: Record<string, Container> = {}
        for (const c of containers.value) map[c.locationId] = c
        return map
    })

    /** Every location that exists only as a zone inside some container. */
    const zoneLocationIds = computed<Set<string>>(() => {
        const set = new Set<string>()
        for (const c of containers.value) {
            for (const leaf of collectLeaves(c.rootNode)) {
                if (leaf.locationId) set.add(leaf.locationId)
            }
        }
        return set
    })

    const childrenByParent = computed<Record<string, Location[]>>(() => {
        const map: Record<string, Location[]> = {}
        for (const loc of locations.value) {
            const key = loc.parentId ?? ROOT_KEY
            if (!map[key]) map[key] = []
            map[key].push(loc)
        }
        for (const key of Object.keys(map)) {
            map[key]!.sort((a, b) => a.name.localeCompare(b.name, "de"))
        }
        return map
    })

    /** Direct children, container zones excluded, because those live in the zone map. */
    function childrenOf(parentId: string | null): Location[] {
        const all = childrenByParent.value[parentId ?? ROOT_KEY] ?? []
        return all.filter((l) => !zoneLocationIds.value.has(l.id))
    }

    /** Direct children including zones. Used when dissolving or counting. */
    function allChildrenOf(parentId: string | null): Location[] {
        return childrenByParent.value[parentId ?? ROOT_KEY] ?? []
    }

    /** Item and location totals for every subtree, computed in one pass. */
    const subtreeCounts = computed<Record<string, SubtreeCount>>(() => {
        const result: Record<string, SubtreeCount> = {}
        const zones = zoneLocationIds.value
        const own = itemCountByLocation.value

        function walk(id: string): SubtreeCount {
            const cached = result[id]
            if (cached) return cached
            const node: SubtreeCount = { own: own[id] ?? 0, total: own[id] ?? 0, locations: 0 }
            result[id] = node
            for (const child of childrenByParent.value[id] ?? []) {
                const sub = walk(child.id)
                node.total += sub.total
                node.locations += zones.has(child.id) ? sub.locations : sub.locations + 1
            }
            return node
        }

        for (const loc of locations.value) walk(loc.id)
        return result
    })

    function countsOf(id: string): SubtreeCount {
        return subtreeCounts.value[id] ?? { own: 0, total: 0, locations: 0 }
    }

    function getLocation(id: string): Location | undefined {
        return locations.value.find((l) => l.id === id)
    }

    /** Full ancestor chain, root first, the location itself included. */
    function ancestorsOf(id: string): Location[] {
        const chain: Location[] = []
        let current = getLocation(id)
        const guard = new Set<string>()
        while (current && !guard.has(current.id)) {
            guard.add(current.id)
            chain.unshift(current)
            current = current.parentId ? getLocation(current.parentId) : undefined
        }
        return chain
    }

    function containerOf(locationId: string): Container | undefined {
        return containerByLocation.value[locationId]
    }

    /** The container this location is a zone of, if any. */
    function containerOwning(zoneLocationId: string): Container | undefined {
        return containers.value.find((c) =>
            collectLeaves(c.rootNode).some((l) => l.locationId === zoneLocationId)
        )
    }

    function itemsIn(locationId: string): Item[] {
        return items.value.filter((i) => i.locationId === locationId)
    }

    /**
     * Attach breadcrumb and container context. An item either sits in a zone of
     * a container, or in a location that is a container itself.
     */
    function decorateItem(item: Item): ItemView {
        const locationNames = getLocationPath(item.locationId)
        const container = zoneLocationIds.value.has(item.locationId)
            ? containerOwning(item.locationId)
            : containerOf(item.locationId)
        return {
            ...item,
            locationNames,
            locationPath: locationNames.join(" / "),
            container,
            zoneLocationId: container ? item.locationId : undefined,
        }
    }

    /** Every location id in this subtree, the location itself included. */
    function subtreeIds(id: string): string[] {
        const out: string[] = []
        const stack = [id]
        const seen = new Set<string>()
        while (stack.length) {
            const cur = stack.pop()!
            if (seen.has(cur)) continue
            seen.add(cur)
            out.push(cur)
            for (const child of childrenByParent.value[cur] ?? []) stack.push(child.id)
        }
        return out
    }

    return {
        itemCountByLocation,
        containerByLocation,
        zoneLocationIds,
        subtreeCounts,
        childrenOf,
        allChildrenOf,
        countsOf,
        getLocation,
        ancestorsOf,
        containerOf,
        containerOwning,
        itemsIn,
        decorateItem,
        subtreeIds,
        getLocationPath,
    }
}
