export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()
  const id = crypto.randomUUID()
  const now = Date.now()
  db.prepare(
    'INSERT INTO items (id, name, location_id, note, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, body.name, body.locationId, body.note ?? null, now)
  return mapItem({ id, name: body.name, location_id: body.locationId, note: body.note ?? null, created_at: now })
})
