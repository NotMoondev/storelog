export default defineEventHandler((event) => {
  const locationId = getRouterParam(event, 'locationId')!
  const db = getDb()
  const row = db.prepare('SELECT * FROM containers WHERE location_id = ? LIMIT 1').get(locationId) as Record<string, unknown> | undefined
  if (!row) return null
  return mapContainer(row)
})
