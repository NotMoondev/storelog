import type { Location, Item, AppUser } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!Array.isArray(body.locations) || !Array.isArray(body.items)) {
    throw createError({ statusCode: 400, message: 'Ungültiges Format.' })
  }

  const db = getDb()
  const importedUsers: AppUser[] = Array.isArray(body.users) ? body.users : []

  const run = db.transaction(() => {
    db.prepare('DELETE FROM items').run()
    db.prepare('DELETE FROM locations').run()

    // Users are merged, never wiped – devices keep their identity across imports.
    // Names are the identity, so an imported "Max" maps onto a local "max".
    const idMap = new Map<string, string>()
    const insertUser = db.prepare(
      'INSERT INTO users (id, name, name_key, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)',
    )
    for (const user of importedUsers) {
      const name = normalizeUserName(user?.name)
      if (!name || typeof user.id !== 'string') continue
      const key = userNameKey(name)

      const existing = db.prepare('SELECT id FROM users WHERE name_key = ?').get(key) as { id: string } | undefined
      if (existing) {
        idMap.set(user.id, existing.id)
        continue
      }
      const taken = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id)
      const localId = taken ? crypto.randomUUID() : user.id
      insertUser.run(localId, name, key, user.createdAt ?? Date.now(), user.lastSeenAt ?? Date.now())
      idMap.set(user.id, localId)
    }

    /** Map an author reference from the export onto a local user, or drop it. */
    const author = (id: unknown): string | null => {
      if (typeof id !== 'string' || !id) return null
      const mapped = idMap.get(id)
      if (mapped) return mapped
      return db.prepare('SELECT id FROM users WHERE id = ?').get(id) ? id : null
    }

    const insertLocation = db.prepare(
      `INSERT INTO locations (id, name, parent_id, created_at, created_by, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const loc of body.locations as Location[]) {
      insertLocation.run(
        loc.id, loc.name, loc.parentId ?? null, loc.createdAt,
        author(loc.createdBy), author(loc.updatedBy), loc.updatedAt ?? null,
      )
    }

    const insertItem = db.prepare(
      `INSERT INTO items (id, name, location_id, note, created_at, created_by, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const item of body.items as Item[]) {
      insertItem.run(
        item.id, item.name, item.locationId, item.note ?? null, item.createdAt,
        author(item.createdBy), author(item.updatedBy), item.updatedAt ?? null,
      )
    }
  })

  run()
})
