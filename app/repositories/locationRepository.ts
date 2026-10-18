import type { Location } from '~/types'
import type { DissolveImpact, DissolvePlan, DissolveResult } from '~/types/dissolve'
import { api } from '~/utils/api'

export const locationRepository = {
  async getAll(): Promise<Location[]> {
    return api<Location[]>('/api/locations')
  },

  async getById(id: string): Promise<Location | undefined> {
    const all = await this.getAll()
    return all.find((l) => l.id === id)
  },

  async create(data: Omit<Location, 'id' | 'createdAt'>): Promise<Location> {
    return api<Location>('/api/locations', { method: 'POST', body: data })
  },

  async update(id: string, data: Partial<Omit<Location, 'id'>>): Promise<void> {
    await api(`/api/locations/${id}`, { method: 'PUT', body: data })
  },

  async delete(id: string): Promise<void> {
    await api(`/api/locations/${id}`, { method: 'DELETE' })
  },

  /** Preview of what dissolving this location would affect. */
  async impact(id: string): Promise<DissolveImpact> {
    return api<DissolveImpact>(`/api/locations/${id}/impact`)
  },

  /** Take the location apart following an explicit per-row plan. */
  async dissolve(id: string, plan: DissolvePlan): Promise<DissolveResult> {
    return api<DissolveResult>(`/api/locations/${id}/dissolve`, { method: 'POST', body: plan })
  },

  async getChildren(parentId: string | null): Promise<Location[]> {
    const all = await this.getAll()
    if (parentId === null) return all.filter((l) => !l.parentId)
    return all.filter((l) => l.parentId === parentId)
  },
}
