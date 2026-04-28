// composables/useItems.ts
import { itemRepository } from "~/repositories/itemRepository";
import type { Item, ItemWithPath } from "~/types";

export function useItems() {
  const items = useState<Item[]>("items", () => []);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      items.value = await itemRepository.getAll();
    } finally {
      loading.value = false;
    }
  }

  async function createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const item = await itemRepository.create(data);
    items.value = await itemRepository.getAll();
    return item;
  }

  async function updateItem(
    id: string,
    data: Partial<Omit<Item, "id">>
  ): Promise<void> {
    await itemRepository.update(id, data);
    items.value = await itemRepository.getAll();
  }

  async function deleteItem(id: string): Promise<void> {
    await itemRepository.delete(id);
    items.value = await itemRepository.getAll();
  }

  return {
    items,
    loading,
    load,
    createItem,
    updateItem,
    deleteItem,
  };
}