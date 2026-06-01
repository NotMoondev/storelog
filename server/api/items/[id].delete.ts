export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()
  db.prepare('DELETE FROM items WHERE id = ?').run(id)
})
