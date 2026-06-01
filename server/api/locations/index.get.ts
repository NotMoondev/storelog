export default defineEventHandler(() => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM locations ORDER BY created_at ASC').all()
  return rows.map(mapLocation)
})
