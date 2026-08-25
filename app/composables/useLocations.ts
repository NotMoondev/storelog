import { locationRepository } from "~/repositories/locationRepository"
import type { Location, LocationNode } from "~/types"

let initialLoad: Promise<void> | null = null

export function useLocations() {
  const locations = useState<Location[]>("locations", () => [])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      locations.value = await locationRepository.getAll()
    } finally {
      loading.value = false
    }
  }

  /** Fetch once per session, no matter how many components ask. */
  function ensureLoaded(): Promise<void> {
    if (!initialLoad) initialLoad = load()
    return initialLoad
  }

  async function createLocation(
    name: string,
    parentId: string | null
  ): Promise<Location> {
    const loc = await locationRepository.create({ name, parentId })
    locations.value = await locationRepository.getAll()
    return loc
  }

  async function updateLocation(
    id: string,
    patch: string | Partial<Pick<Location, "name" | "parentId">>
  ): Promise<void> {
    const body = typeof patch === "string" ? { name: patch } : patch
    await locationRepository.update(id, body)
    locations.value = await locationRepository.getAll()
  }

  /**
   * Re-parent a location. Rejects moves into the location's own subtree — the
   * server has no such guard, and a cycle would strand the whole branch.
   */
  async function moveLocation(id: string, parentId: string | null): Promise<void> {
    if (parentId === id) throw new Error("Ein Ort kann nicht in sich selbst liegen.")
    if (parentId && descendantIds(id).includes(parentId)) {
      throw new Error("Ein Ort kann nicht in einen seiner eigenen Unterorte verschoben werden.")
    }
    await updateLocation(id, { parentId })
  }

  async function deleteLocation(id: string): Promise<void> {
    await locationRepository.delete(id)
    locations.value = await locationRepository.getAll()
  }

  /** Ids of everything below `id`, the location itself excluded. */
  function descendantIds(id: string): string[] {
    const out: string[] = []
    const stack = [id]
    const seen = new Set<string>([id])
    while (stack.length) {
      const cur = stack.pop()!
      for (const loc of locations.value) {
        if (loc.parentId === cur && !seen.has(loc.id)) {
          seen.add(loc.id)
          out.push(loc.id)
          stack.push(loc.id)
        }
      }
    }
    return out
  }

  function buildTree(parentId: string | null = null, depth = 0): LocationNode[] {
    return locations.value
      .filter((l) => l.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((l) => ({
        ...l,
        depth,
        children: buildTree(l.id, depth + 1),
      }))
  }

  function getLocationPath(locationId: string): string[] {
    const path: string[] = []
    let current = locations.value.find((l) => l.id === locationId)
    const guard = new Set<string>()
    while (current && !guard.has(current.id)) {
      guard.add(current.id)
      path.unshift(current.name)
      current = current.parentId
        ? locations.value.find((l) => l.id === current!.parentId)
        : undefined
    }
    return path
  }

  function flattenTree(
    nodes: LocationNode[] = [],
    depth = 0
  ): (LocationNode & { indent: number })[] {
    const result: (LocationNode & { indent: number })[] = []
    for (const node of nodes) {
      result.push({ ...node, indent: depth })
      result.push(...flattenTree(node.children, depth + 1))
    }
    return result
  }

  const tree = computed(() => buildTree(null))
  const flatList = computed(() => flattenTree(tree.value))

  return {
    locations,
    loading,
    tree,
    flatList,
    load,
    ensureLoaded,
    createLocation,
    updateLocation,
    moveLocation,
    deleteLocation,
    descendantIds,
    getLocationPath,
  }
}
