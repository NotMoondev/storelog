export default defineEventHandler(() => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all()
  return rows.map(mapItem)
})
