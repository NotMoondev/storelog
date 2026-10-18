import type Database from 'better-sqlite3'
import type { ContainerNode, ContainerLeafNode } from '~/types/container'

export function collectLeaves(node: ContainerNode): ContainerLeafNode[] {
  if (node.type === 'leaf') return [node]
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])]
}

export function findNode(root: ContainerNode, id: string): ContainerNode | null {
  if (root.id === id) return root
  if (root.type === 'leaf') return null
  return findNode(root.children[0], id) || findNode(root.children[1], id)
}

export function replaceNode(
  root: ContainerNode,
  id: string,
  replacement: ContainerNode,
): ContainerNode {
  if (root.id === id) return replacement
  if (root.type === 'leaf') return root
  return {
    ...root,
    children: [
      replaceNode(root.children[0], id, replacement),
      replaceNode(root.children[1], id, replacement),
    ],
  }
}

export function syncLeafLocations(
  node: ContainerNode,
  parentLocationId: string,
  db: Database.Database,
  actorId: string | null = null,
): ContainerNode {
  const now = Date.now()
  if (node.type === 'leaf') {
    if (node.locationId) {
      // Every container save walks all zones – only a real rename counts as an edit.
      const row = db.prepare('SELECT name FROM locations WHERE id = ?').get(node.locationId) as
        | { name: string }
        | undefined
      if (row && row.name !== node.name) {
        db.prepare('UPDATE locations SET name = ?, updated_by = ?, updated_at = ? WHERE id = ?')
          .run(node.name, actorId, now, node.locationId)
      }
      return node
    }
    const id = crypto.randomUUID()
    db.prepare(
      `INSERT INTO locations (id, name, parent_id, created_at, created_by)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, node.name, parentLocationId, now, actorId)
    return { ...node, locationId: id }
  }
  return {
    ...node,
    children: [
      syncLeafLocations(node.children[0], parentLocationId, db, actorId),
      syncLeafLocations(node.children[1], parentLocationId, db, actorId),
    ],
  } as ContainerNode
}
