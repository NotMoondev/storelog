export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()
  const actorId = getActorId(event)
  const id = crypto.randomUUID()
  const now = Date.now()
  db.prepare(
    `INSERT INTO locations (id, name, parent_id, created_at, created_by)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, body.name, body.parentId ?? null, now, actorId)
  return mapLocation({
    id,
    name: body.name,
    parent_id: body.parentId ?? null,
    created_at: now,
    created_by: actorId,
    updated_by: null,
    updated_at: null,
  })
})
