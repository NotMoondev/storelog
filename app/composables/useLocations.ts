import { locationRepository } from "~/repositories/locationRepository"
import type { Location, LocationNode } from "~/types"

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

  async function createLocation(
    name: string,
    parentId: string | null
  ): Promise<Location> {
    const loc = await locationRepository.create({ name, parentId })
    locations.value = await locationRepository.getAll()
    return loc
  }

  async function updateLocation(id: string, name: string): Promise<void> {
    await locationRepository.update(id, { name })
    locations.value = await locationRepository.getAll()
  }

  async function deleteLocation(id: string): Promise<void> {
    await locationRepository.delete(id)
    locations.value = await locationRepository.getAll()
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
    while (current) {
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
    createLocation,
    updateLocation,
    deleteLocation,
    getLocationPath,
  }
}