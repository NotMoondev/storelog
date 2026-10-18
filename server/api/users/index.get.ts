export default defineEventHandler(() => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM users ORDER BY name COLLATE NOCASE ASC').all()
  return rows.map(mapUser)
})
