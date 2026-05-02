import { useDB } from "./db"
import type { Location } from "~/types"

function generateId(): string {
  return crypto.randomUUID()
}

export const locationRepository = {
  async getAll(): Promise<Location[]> {
    const db = useDB()
    return db.locations.orderBy("createdAt").toArray()
  },

  async getById(id: string): Promise<Location | undefined> {
    const db = useDB()
    return db.locations.get(id)
  },

  async create(data: Omit<Location, "id" | "createdAt">): Promise<Location> {
    const db = useDB()
    const location: Location = {
      id: generateId(),
      createdAt: Date.now(),
      ...data,
    }
    await db.locations.add(location)
    return location
  },

  async update(
    id: string,
    data: Partial<Omit<Location, "id">>
  ): Promise<void> {
    const db = useDB()
    await db.locations.update(id, data)
  },

  async delete(id: string): Promise<void> {
    const db = useDB()
    // Reassign children to parent
    const location = await db.locations.get(id)
    if (location) {
      const children = await db.locations
        .where("parentId")
        .equals(id)
        .toArray()
      for (const child of children) {
        await db.locations.update(child.id, { parentId: location.parentId })
      }
      // Move items to parent or null
      const items = await db.items.where("locationId").equals(id).toArray()
      for (const item of items) {
        if (location.parentId) {
          await db.items.update(item.id, { locationId: location.parentId })
        }
      }
    }
    await db.locations.delete(id)
  },

  async getChildren(parentId: string | null): Promise<Location[]> {
    const db = useDB()
    if (parentId === null) {
      return db.locations.where("parentId").equals("").toArray()
    }
    return db.locations.where("parentId").equals(parentId).toArray()
  },
}
