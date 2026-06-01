import Database from 'better-sqlite3'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import type { Location, Item } from '~/types'
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
  `)
}

export function mapLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    parentId: (row.parent_id as string | null) ?? null,
    createdAt: row.created_at as number,
  }
}

export function mapItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    name: row.name as string,
    locationId: row.location_id as string,
    note: (row.note as string | undefined) ?? undefined,
    createdAt: row.created_at as number,
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
  }
}
