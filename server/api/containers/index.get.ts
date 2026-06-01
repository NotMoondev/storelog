export default defineEventHandler(() => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM containers ORDER BY created_at ASC').all()
  return rows.map(mapContainer)
})
