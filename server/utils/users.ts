import type Database from 'better-sqlite3'
import type { H3Event } from 'h3'
import type { AppUser } from '~/types'

/** Header the client uses to identify itself. No auth – just an identity claim. */
export const USER_HEADER = 'x-storelog-user'

export const MAX_USER_NAME_LENGTH = 32

/** Trim and collapse whitespace, so " Max  Mustermann " and "Max Mustermann" match. */
export function normalizeUserName(name: unknown): string {
  if (typeof name !== 'string') return ''
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_USER_NAME_LENGTH)
}

/** Case-insensitive identity key – "max" and "Max" are the same person. */
export function userNameKey(name: string): string {
  return name.toLocaleLowerCase('de-DE')
}

/** Find the user with this name or create them. This is the whole "login". */
export function resolveUserByName(db: Database.Database, rawName: string): AppUser {
  const name = normalizeUserName(rawName)
  if (!name) throw createError({ statusCode: 400, message: 'Name darf nicht leer sein.' })

  const key = userNameKey(name)
  const now = Date.now()

  const existing = db.prepare('SELECT * FROM users WHERE name_key = ?').get(key) as
    | Record<string, unknown>
    | undefined

  if (existing) {
    // Keep the most recent spelling of the name (e.g. "max" → "Max").
    db.prepare('UPDATE users SET name = ?, last_seen_at = ? WHERE id = ?').run(name, now, existing.id)
    return mapUser({ ...existing, name, last_seen_at: now })
  }

  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO users (id, name, name_key, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, name, key, now, now)

  return mapUser({ id, name, name_key: key, created_at: now, last_seen_at: now })
}

/**
 * The user id sent by the client, but only if that user actually exists.
 * Returns null for anonymous clients or stale ids (e.g. after a database reset).
 */
export function getActorId(event: H3Event): string | null {
  const claimed = getHeader(event, USER_HEADER)?.trim()
  if (!claimed) return null

  const db = getDb()
  const row = db.prepare('SELECT id FROM users WHERE id = ?').get(claimed) as
    | { id: string }
    | undefined
  if (!row) return null

  db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(Date.now(), row.id)
  return row.id
}
