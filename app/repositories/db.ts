import Dexie, { type Table } from "dexie"
import type { Location, Item } from "~/types"
import type { Container } from "~/types/container"

export class StorelogDB extends Dexie {
  locations!: Table<Location>
  items!: Table<Item>
  containers!: Table<Container>

  constructor() {
    super("storelog-db")

    // Version 1 - unchanged, keeps existing data intact
    this.version(1).stores({
      locations: "id, parentId, name, createdAt",
      items: "id, locationId, name, createdAt",
    })

    // Version 2 - additive only, no breaking changes
    this.version(2).stores({
      locations: "id, parentId, name, createdAt",
      items: "id, locationId, name, createdAt",
      containers: "id, locationId, createdAt",
    })
  }
}

let _db: StorelogDB | null = null

export function useDB(): StorelogDB {
  if (!_db) {
    _db = new StorelogDB()
  }
  return _db
}