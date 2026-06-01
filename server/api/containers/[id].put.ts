import type { ContainerNode } from '~/types/container'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const existing = db.prepare('SELECT * FROM containers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) throw createError({ statusCode: 404 })

  const oldLeaves = collectLeaves(JSON.parse(existing.root_node as string) as ContainerNode)
  const newRootNode = syncLeafLocations(body.rootNode as ContainerNode, existing.location_id as string, db)
  const newLeaves = collectLeaves(newRootNode)
  const newLeafIds = new Set(newLeaves.map((l) => l.id))

  // Clean up removed leaf locations
  for (const leaf of oldLeaves) {
    if (!newLeafIds.has(leaf.id) && leaf.locationId) {
      db.prepare('UPDATE items SET location_id = ? WHERE location_id = ?').run(existing.location_id, leaf.locationId)
      db.prepare('DELETE FROM locations WHERE id = ?').run(leaf.locationId)
    }
  }

  db.prepare('UPDATE containers SET root_node = ? WHERE id = ?').run(JSON.stringify(newRootNode), id)
})
