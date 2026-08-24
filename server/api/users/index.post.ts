/**
 * "Login": hand in a name, get the matching user back – created on first use.
 * Same name on another device resolves to the same user.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()
  return resolveUserByName(db, body?.name)
})
