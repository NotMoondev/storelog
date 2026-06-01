export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) { sets.push('name = ?'); values.push(body.name) }
  if (body.parentId !== undefined) { sets.push('parent_id = ?'); values.push(body.parentId) }
  if (!sets.length) return
  values.push(id)
  db.prepare(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`).run(...values)
})
