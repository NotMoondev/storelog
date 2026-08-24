export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()
  const actorId = getActorId(event)
  const now = Date.now()
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!location) return

  // Re-parent children to this location's parent
  db.prepare('UPDATE locations SET parent_id = ?, updated_by = ?, updated_at = ? WHERE parent_id = ?')
    .run(location.parent_id ?? null, actorId, now, id)

  // Move items to parent location
  if (location.parent_id) {
    db.prepare('UPDATE items SET location_id = ?, updated_by = ?, updated_at = ? WHERE location_id = ?')
      .run(location.parent_id, actorId, now, id)
  }

  db.prepare('DELETE FROM locations WHERE id = ?').run(id)
})
