export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!location) return

  // Re-parent children to this location's parent
  db.prepare('UPDATE locations SET parent_id = ? WHERE parent_id = ?').run(location.parent_id ?? null, id)

  // Move items to parent location
  if (location.parent_id) {
    db.prepare('UPDATE items SET location_id = ? WHERE location_id = ?').run(location.parent_id, id)
  }

  db.prepare('DELETE FROM locations WHERE id = ?').run(id)
})
