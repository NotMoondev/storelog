import type { Item } from '~/types'
import type { DissolveChildImpact, DissolveImpact, DissolveItemImpact } from '~/types/dissolve'

/**
 * Everything the dissolve dialog needs to show real numbers before anything is
 * touched: one row per sub-location, and every item that has to be re-homed
 * because its location is about to disappear.
 */
export default defineEventHandler((event): DissolveImpact => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!location) throw createError({ statusCode: 404, statusMessage: 'Ort nicht gefunden' })

  const rows = allLocations(db)
  const index = childIndex(rows)
  const zoneIds = ownZoneLocationIds(db, id)
  const zoneSet = new Set(zoneIds)

  const parentId = (location.parent_id as string | null) ?? null
  const parentName = parentId
    ? ((db.prepare('SELECT name FROM locations WHERE id = ?').get(parentId) as { name: string } | undefined)?.name ?? null)
    : null

  // Zones are not independent places — they vanish with their container, and
  // their contents are decided item by item below.
  const children: DissolveChildImpact[] = (index.get(id) ?? [])
    .filter((child) => !zoneSet.has(child.id))
    .map((child) => {
      const ids = subtreeIds(index, child.id)
      const hasContainer = !!db
        .prepare('SELECT 1 FROM containers WHERE location_id = ?')
        .get(child.id)
      return {
        id: child.id,
        name: child.name,
        descendantLocations: ids.length - 1,
        descendantItems: countItemsIn(db, ids),
        isContainer: hasContainer,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  const zoneNames = new Map<string, string>()
  for (const zoneId of zoneIds) {
    const row = db.prepare('SELECT name FROM locations WHERE id = ?').get(zoneId) as
      | { name: string }
      | undefined
    if (row) zoneNames.set(zoneId, row.name)
  }

  const homelessIds = [id, ...zoneIds]
  const placeholders = homelessIds.map(() => '?').join(',')
  const items = (
    db
      .prepare(`SELECT * FROM items WHERE location_id IN (${placeholders}) ORDER BY name COLLATE NOCASE ASC`)
      .all(...homelessIds) as Record<string, unknown>[]
  ).map(mapItem)

  return {
    id,
    name: location.name as string,
    parentId,
    parentName,
    isContainer: zoneIds.length > 0 || !!db.prepare('SELECT 1 FROM containers WHERE location_id = ?').get(id),
    children,
    items: items.map((item: Item): DissolveItemImpact => ({
      id: item.id,
      name: item.name,
      note: item.note,
      locationId: item.locationId,
      zoneName: zoneNames.get(item.locationId),
    })),
  }
})
