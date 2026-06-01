export default defineEventHandler(() => {
  const db = getDb()
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    locations: db.prepare('SELECT * FROM locations ORDER BY created_at ASC').all().map(mapLocation),
    items: db.prepare('SELECT * FROM items ORDER BY created_at DESC').all().map(mapItem),
  }
})
