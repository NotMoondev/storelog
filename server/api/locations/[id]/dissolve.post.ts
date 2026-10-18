import type { ChildAction, DissolvePlan, DissolveResult, ItemAction } from '~/types/dissolve'

/**
 * Take a location apart according to an explicit plan: one decision per
 * sub-location and one per item. Runs as a single transaction — a half-applied
 * plan would strand items in a location that no longer exists, which is exactly
 * the failure this replaces.
 */
export default defineEventHandler(async (event): Promise<DissolveResult> => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()
  const actorId = getActorId(event)
  const now = Date.now()
  const plan = await readBody<DissolvePlan>(event)

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!location) throw createError({ statusCode: 404, statusMessage: 'Ort nicht gefunden' })

  const parentId = (location.parent_id as string | null) ?? null
  const rows = allLocations(db)
  const index = childIndex(rows)
  const zoneIds = ownZoneLocationIds(db, id)
  const zoneSet = new Set(zoneIds)

  const doomed = new Set([id, ...zoneIds])
  const childRows = (index.get(id) ?? []).filter((c) => !zoneSet.has(c.id))
  const childById = new Map(childRows.map((c) => [c.id, c]))

  const childPlans = new Map<string, { action: ChildAction; targetId: string | null }>()
  for (const entry of plan.children ?? []) {
    if (!childById.has(entry.id)) continue
    childPlans.set(entry.id, { action: entry.action, targetId: entry.targetId ?? null })
  }
  // Anything the client did not mention keeps its contents and moves up a level.
  for (const child of childRows) {
    if (!childPlans.has(child.id)) childPlans.set(child.id, { action: 'promote', targetId: null })
  }

  const homelessIds = [id, ...zoneIds]
  const itemPlaceholders = homelessIds.map(() => '?').join(',')
  const affectedItems = db
    .prepare(`SELECT id FROM items WHERE location_id IN (${itemPlaceholders})`)
    .all(...homelessIds) as { id: string }[]
  const affectedItemIds = new Set(affectedItems.map((i) => i.id))

  const itemPlans = new Map<string, { action: ItemAction; targetId: string | null }>()
  for (const entry of plan.items ?? []) {
    if (!affectedItemIds.has(entry.id)) continue
    itemPlans.set(entry.id, { action: entry.action, targetId: entry.targetId ?? null })
  }

  const undecided = [...affectedItemIds].filter((itemId) => !itemPlans.has(itemId))
  if (undecided.length) {
    // Never silently drop belongings. Without a parent to fall back to there is
    // no safe default, so the caller has to decide.
    if (!parentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unvollständiger Plan',
        message: `Für ${undecided.length} Gegenstände fehlt eine Entscheidung.`,
      })
    }
    for (const itemId of undecided) itemPlans.set(itemId, { action: 'move', targetId: parentId })
  }

  // ── Validate every target before writing anything ──────────────────────────

  function assertTarget(targetId: string | null, label: string, forbidden: Set<string>): string {
    if (!targetId) {
      throw createError({ statusCode: 400, statusMessage: 'Zielort fehlt', message: `${label}: kein Zielort gewählt.` })
    }
    if (forbidden.has(targetId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Zielort ungültig',
        message: `${label}: der Zielort wird selbst aufgelöst.`,
      })
    }
    const exists = db.prepare('SELECT 1 FROM locations WHERE id = ?').get(targetId)
    if (!exists) {
      throw createError({ statusCode: 400, statusMessage: 'Zielort fehlt', message: `${label}: Zielort existiert nicht.` })
    }
    return targetId
  }

  for (const [childId, entry] of childPlans) {
    if (entry.action !== 'move') continue
    const name = childById.get(childId)!.name
    // A branch cannot be filed inside itself.
    const forbidden = new Set([...doomed, ...subtreeIds(index, childId)])
    assertTarget(entry.targetId, `„${name}"`, forbidden)
  }
  for (const [itemId, entry] of itemPlans) {
    if (entry.action !== 'move') continue
    assertTarget(entry.targetId, 'Gegenstand', doomed)
  }

  // ── Apply ─────────────────────────────────────────────────────────────────

  const result: DissolveResult = {
    promotedLocations: 0,
    movedLocations: 0,
    deletedLocations: 0,
    movedItems: 0,
    deletedItems: 0,
  }

  const apply = db.transaction(() => {
    for (const [childId, entry] of childPlans) {
      if (entry.action === 'delete') {
        const removed = deleteSubtree(db, index, childId)
        result.deletedLocations += removed.locations
        result.deletedItems += removed.items
        continue
      }
      const newParent = entry.action === 'promote' ? parentId : entry.targetId
      db.prepare('UPDATE locations SET parent_id = ?, updated_by = ?, updated_at = ? WHERE id = ?')
        .run(newParent, actorId, now, childId)
      if (entry.action === 'promote') result.promotedLocations += 1
      else result.movedLocations += 1
    }

    for (const [itemId, entry] of itemPlans) {
      if (entry.action === 'delete') {
        db.prepare('DELETE FROM items WHERE id = ?').run(itemId)
        result.deletedItems += 1
        continue
      }
      db.prepare('UPDATE items SET location_id = ?, updated_by = ?, updated_at = ? WHERE id = ?')
        .run(entry.targetId, actorId, now, itemId)
      result.movedItems += 1
    }

    // The container and its zones only exist as part of this location.
    db.prepare('DELETE FROM containers WHERE location_id = ?').run(id)
    if (zoneIds.length) {
      const placeholders = zoneIds.map(() => '?').join(',')
      db.prepare(`DELETE FROM containers WHERE location_id IN (${placeholders})`).run(...zoneIds)
      db.prepare(`DELETE FROM locations WHERE id IN (${placeholders})`).run(...zoneIds)
      result.deletedLocations += zoneIds.length
    }
    db.prepare('DELETE FROM locations WHERE id = ?').run(id)
    result.deletedLocations += 1
  })

  apply()
  return result
})
