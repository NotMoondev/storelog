import Database from 'better-sqlite3'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import type { Location, Item, AppUser } from '~/types'
import type { Container } from '~/types/container'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'storelog.db')
  mkdirSync(join(dbPath, '..'), { recursive: true })

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location_id TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS containers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location_id TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      root_node TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
  `)

  // Authorship columns – added after the fact, so existing databases keep working.
  for (const table of ['locations', 'items', 'containers']) {
    ensureColumn(db, table, 'created_by', 'TEXT')
    ensureColumn(db, table, 'updated_by', 'TEXT')
    ensureColumn(db, table, 'updated_at', 'INTEGER')
  }
}

function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (columns.some((c) => c.name === column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

function mapAuthorship(row: Record<string, unknown>) {
  return {
    createdBy: (row.created_by as string | null) ?? null,
    updatedBy: (row.updated_by as string | null) ?? null,
    updatedAt: (row.updated_at as number | null) ?? null,
  }
}

export function mapLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    parentId: (row.parent_id as string | null) ?? null,
    createdAt: row.created_at as number,
    ...mapAuthorship(row),
  }
}

export function mapItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    name: row.name as string,
    locationId: row.location_id as string,
    note: (row.note as string | undefined) ?? undefined,
    createdAt: row.created_at as number,
    ...mapAuthorship(row),
  }
}

export function mapContainer(row: Record<string, unknown>): Container {
  return {
    id: row.id as string,
    name: row.name as string,
    locationId: row.location_id as string,
    dimensions: JSON.parse(row.dimensions as string),
    rootNode: JSON.parse(row.root_node as string),
    createdAt: row.created_at as number,
    ...mapAuthorship(row),
  }
}

export function mapUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as number,
    lastSeenAt: row.last_seen_at as number,
  }
}
