import type Database from 'better-sqlite3'
import { collectLeaves } from './containerHelpers'
import type { ContainerNode } from '~/types/container'

export interface LocationRow {
  id: string
  name: string
  parent_id: string | null
}

export function allLocations(db: Database.Database): LocationRow[] {
  return db.prepare('SELECT id, name, parent_id FROM locations').all() as LocationRow[]
}

/** Children keyed by parent id, so a walk does not re-scan the table per node. */
export function childIndex(rows: LocationRow[]): Map<string, LocationRow[]> {
  const map = new Map<string, LocationRow[]>()
  for (const row of rows) {
    if (!row.parent_id) continue
    const list = map.get(row.parent_id)
    if (list) list.push(row)
    else map.set(row.parent_id, [row])
  }
  return map
}

/** Every id in this subtree, the root included. Cycle-safe. */
export function subtreeIds(index: Map<string, LocationRow[]>, rootId: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
    for (const child of index.get(id) ?? []) stack.push(child.id)
  }
  return out
}

/** Location ids that exist only as zones of the container on `locationId`. */
export function ownZoneLocationIds(db: Database.Database, locationId: string): string[] {
  const row = db
    .prepare('SELECT root_node FROM containers WHERE location_id = ?')
    .get(locationId) as { root_node: string } | undefined
  if (!row) return []
  const tree = JSON.parse(row.root_node) as ContainerNode
  return collectLeaves(tree)
    .map((leaf) => leaf.locationId)
    .filter((id): id is string => !!id)
}

export function countItemsIn(db: Database.Database, locationIds: string[]): number {
  if (!locationIds.length) return 0
  const placeholders = locationIds.map(() => '?').join(',')
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM items WHERE location_id IN (${placeholders})`)
    .get(...locationIds) as { n: number }
  return row.n
}

/**
 * Remove a whole branch: the locations, everything stored in them, and any
 * containers anchored to them. Callers must already be inside a transaction.
 */
export function deleteSubtree(db: Database.Database, index: Map<string, LocationRow[]>, rootId: string): {
  locations: number
  items: number
} {
  const ids = subtreeIds(index, rootId)
  const placeholders = ids.map(() => '?').join(',')
  const items = countItemsIn(db, ids)
  db.prepare(`DELETE FROM items WHERE location_id IN (${placeholders})`).run(...ids)
  db.prepare(`DELETE FROM containers WHERE location_id IN (${placeholders})`).run(...ids)
  db.prepare(`DELETE FROM locations WHERE id IN (${placeholders})`).run(...ids)
  return { locations: ids.length, items }
}
