import type { ContainerNode } from '~/types/container'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()
  const actorId = getActorId(event)

  const rootNode = syncLeafLocations(body.rootNode as ContainerNode, body.locationId, db, actorId)

  const id = crypto.randomUUID()
  const now = Date.now()
  db.prepare(
    `INSERT INTO containers (id, name, location_id, dimensions, root_node, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, body.name, body.locationId, JSON.stringify(body.dimensions), JSON.stringify(rootNode), now, actorId)

  return mapContainer({
    id,
    name: body.name,
    location_id: body.locationId,
    dimensions: JSON.stringify(body.dimensions),
    root_node: JSON.stringify(rootNode),
    created_at: now,
    created_by: actorId,
    updated_by: null,
    updated_at: null,
  })
})
