import type { Item } from '~/types'

export const itemRepository = {
  async getAll(): Promise<Item[]> {
    return $fetch<Item[]>('/api/items')
  },

  async getById(id: string): Promise<Item | undefined> {
    const all = await this.getAll()
    return all.find((i) => i.id === id)
  },

  async create(data: Omit<Item, 'id' | 'createdAt'>): Promise<Item> {
    return $fetch<Item>('/api/items', { method: 'POST', body: data })
  },

  async update(id: string, data: Partial<Omit<Item, 'id'>>): Promise<void> {
    await $fetch(`/api/items/${id}`, { method: 'PUT', body: data })
  },

  async delete(id: string): Promise<void> {
    await $fetch(`/api/items/${id}`, { method: 'DELETE' })
  },

  async getByLocation(locationId: string): Promise<Item[]> {
    const all = await this.getAll()
    return all.filter((i) => i.locationId === locationId)
  },
}
