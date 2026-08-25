/**
 * Deletes an empty location outright. Anything with contents goes through
 * `POST /api/locations/:id/dissolve` instead, where every sub-location and every
 * item gets an explicit destination — the old re-parenting shortcut silently
 * orphaned items whenever the deleted location had no parent to move them to.
 */
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!location) return

  const rows = allLocations(db)
  const index = childIndex(rows)
  const ids = subtreeIds(index, id)
  const items = countItemsIn(db, ids)
  const childLocations = ids.length - 1

  if (items > 0 || childLocations > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ort ist nicht leer',
      message:
        `„${location.name}" enthält noch ${items} Gegenstände und ${childLocations} Unterorte. ` +
        'Zum Löschen den Ort auflösen.',
    })
  }

  db.transaction(() => {
    db.prepare('DELETE FROM containers WHERE location_id = ?').run(id)
    db.prepare('DELETE FROM locations WHERE id = ?').run(id)
  })()
})
