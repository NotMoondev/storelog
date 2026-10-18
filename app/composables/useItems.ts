import { itemRepository } from "~/repositories/itemRepository"
import type { Item } from "~/types"

let initialLoad: Promise<void> | null = null

export function useItems() {
  const items = useState<Item[]>("items", () => [])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      items.value = await itemRepository.getAll()
    } finally {
      loading.value = false
    }
  }

  /** Fetch once per session, no matter how many components ask. */
  function ensureLoaded(): Promise<void> {
    if (!initialLoad) initialLoad = load()
    return initialLoad
  }

  async function createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const item = await itemRepository.create(data)
    items.value = await itemRepository.getAll()
    return item
  }

  async function updateItem(
    id: string,
    data: Partial<Omit<Item, "id">>
  ): Promise<void> {
    await itemRepository.update(id, data)
    items.value = await itemRepository.getAll()
  }

  /**
   * Moving is the action people repeat most, so it lands locally first and the
   * request follows. On failure the previous state is put back.
   */
  async function moveItems(ids: string[], locationId: string): Promise<void> {
    if (!ids.length) return
    const previous = items.value
    const target = new Set(ids)
    items.value = items.value.map((i) => (target.has(i.id) ? { ...i, locationId } : i))
    try {
      await Promise.all(ids.map((id) => itemRepository.update(id, { locationId })))
      items.value = await itemRepository.getAll()
    } catch (err) {
      items.value = previous
      throw err
    }
  }

  function moveItem(id: string, locationId: string): Promise<void> {
    return moveItems([id], locationId)
  }

  async function deleteItem(id: string): Promise<void> {
    await itemRepository.delete(id)
    items.value = await itemRepository.getAll()
  }

  /**
   * Delete several at once and hand back what was removed, so the toast's
   * "Rückgängig" can put them back with `restoreItems`.
   */
  async function deleteItems(ids: string[]): Promise<Item[]> {
    const target = new Set(ids)
    const removed = items.value.filter((i) => target.has(i.id))
    await Promise.all(ids.map((id) => itemRepository.delete(id)))
    items.value = await itemRepository.getAll()
    return removed
  }

  /** Re-create deleted items. They get new ids; name, place and note survive. */
  async function restoreItems(removed: Item[]): Promise<void> {
    await Promise.all(
      removed.map((i) => itemRepository.create({ name: i.name, locationId: i.locationId, note: i.note }))
    )
    items.value = await itemRepository.getAll()
  }

  return {
    items,
    loading,
    load,
    ensureLoaded,
    createItem,
    updateItem,
    moveItem,
    moveItems,
    deleteItem,
    deleteItems,
    restoreItems,
  }
}
