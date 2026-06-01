export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()
  const id = crypto.randomUUID()
  const now = Date.now()
  db.prepare(
    'INSERT INTO locations (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, body.name, body.parentId ?? null, now)
  return mapLocation({ id, name: body.name, parent_id: body.parentId ?? null, created_at: now })
})
