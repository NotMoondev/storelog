import type { AppUser } from '~/types'
import { api } from '~/utils/api'

export const userRepository = {
  async getAll(): Promise<AppUser[]> {
    return api<AppUser[]>('/api/users')
  },

  /** Find-or-create by name. This is the whole sign-in. */
  async resolveByName(name: string): Promise<AppUser> {
    return api<AppUser>('/api/users', { method: 'POST', body: { name } })
  },
}
