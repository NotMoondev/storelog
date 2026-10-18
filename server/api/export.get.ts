export default defineEventHandler(() => {
  const db = getDb()
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    users: db.prepare('SELECT * FROM users ORDER BY created_at ASC').all().map(mapUser),
    locations: db.prepare('SELECT * FROM locations ORDER BY created_at ASC').all().map(mapLocation),
    items: db.prepare('SELECT * FROM items ORDER BY created_at DESC').all().map(mapItem),
  }
})
