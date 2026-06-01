import type { Location } from '~/types'

export const locationRepository = {
  async getAll(): Promise<Location[]> {
    return $fetch<Location[]>('/api/locations')
  },

  async getById(id: string): Promise<Location | undefined> {
    const all = await this.getAll()
    return all.find((l) => l.id === id)
  },

  async create(data: Omit<Location, 'id' | 'createdAt'>): Promise<Location> {
    return $fetch<Location>('/api/locations', { method: 'POST', body: data })
  },

  async update(id: string, data: Partial<Omit<Location, 'id'>>): Promise<void> {
    await $fetch(`/api/locations/${id}`, { method: 'PUT', body: data })
  },

  async delete(id: string): Promise<void> {
    await $fetch(`/api/locations/${id}`, { method: 'DELETE' })
  },

  async getChildren(parentId: string | null): Promise<Location[]> {
    const all = await this.getAll()
    if (parentId === null) return all.filter((l) => !l.parentId)
    return all.filter((l) => l.parentId === parentId)
  },
}
