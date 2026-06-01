export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) { sets.push('name = ?'); values.push(body.name) }
  if (body.locationId !== undefined) { sets.push('location_id = ?'); values.push(body.locationId) }
  if (body.note !== undefined) { sets.push('note = ?'); values.push(body.note) }
  if (!sets.length) return
  values.push(id)
  db.prepare(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`).run(...values)
})
