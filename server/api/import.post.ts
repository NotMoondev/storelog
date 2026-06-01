import type { Location, Item } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!Array.isArray(body.locations) || !Array.isArray(body.items)) {
    throw createError({ statusCode: 400, message: 'Ungültiges Format.' })
  }

  const db = getDb()
  const run = db.transaction(() => {
    db.prepare('DELETE FROM items').run()
    db.prepare('DELETE FROM locations').run()

    const insertLocation = db.prepare(
      'INSERT INTO locations (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)',
    )
    for (const loc of body.locations as Location[]) {
      insertLocation.run(loc.id, loc.name, loc.parentId ?? null, loc.createdAt)
    }

    const insertItem = db.prepare(
      'INSERT INTO items (id, name, location_id, note, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    for (const item of body.items as Item[]) {
      insertItem.run(item.id, item.name, item.locationId, item.note ?? null, item.createdAt)
    }
  })

  run()
})
