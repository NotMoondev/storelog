import type { ContainerNode } from '~/types/container'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const existing = db.prepare('SELECT * FROM containers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return

  const leaves = collectLeaves(JSON.parse(existing.root_node as string) as ContainerNode)
  for (const leaf of leaves) {
    if (leaf.locationId) {
      db.prepare('UPDATE items SET location_id = ? WHERE location_id = ?').run(existing.location_id, leaf.locationId)
      db.prepare('DELETE FROM locations WHERE id = ?').run(leaf.locationId)
    }
  }

  db.prepare('DELETE FROM containers WHERE id = ?').run(id)
})
