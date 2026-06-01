import type { ContainerNode } from '~/types/container'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const existing = db.prepare('SELECT * FROM containers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) throw createError({ statusCode: 404 })

  const root = JSON.parse(existing.root_node as string) as ContainerNode
  const leaf = findNode(root, body.leafId)
  if (!leaf || leaf.type !== 'leaf') throw createError({ statusCode: 404 })

  const newRoot = replaceNode(root, body.leafId, { ...leaf, name: body.name })
  db.prepare('UPDATE containers SET root_node = ? WHERE id = ?').run(JSON.stringify(newRoot), id)

  if (leaf.locationId) {
    db.prepare('UPDATE locations SET name = ? WHERE id = ?').run(body.name, leaf.locationId)
  }
})
