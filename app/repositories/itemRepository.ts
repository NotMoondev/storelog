import { useDB } from "./db";
import type { Item } from "~/types";

function generateId(): string {
  return crypto.randomUUID();
}

export const itemRepository = {
  async getAll(): Promise<Item[]> {
    const db = useDB();
    return db.items.orderBy("createdAt").reverse().toArray();
  },

  async getById(id: string): Promise<Item | undefined> {
    const db = useDB();
    return db.items.get(id);
  },

  async create(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const db = useDB();
    const item: Item = {
      id: generateId(),
      createdAt: Date.now(),
      ...data,
    };
    await db.items.add(item);
    return item;
  },

  async update(id: string, data: Partial<Omit<Item, "id">>): Promise<void> {
    const db = useDB();
    await db.items.update(id, data);
  },

  async delete(id: string): Promise<void> {
    const db = useDB();
    await db.items.delete(id);
  },

  async getByLocation(locationId: string): Promise<Item[]> {
    const db = useDB();
    return db.items.where("locationId").equals(locationId).toArray();
  },
};
