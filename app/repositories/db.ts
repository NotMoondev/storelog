import Dexie, { type Table } from "dexie";
import type { Location, Item } from "~/types";

export class StorelogDB extends Dexie {
  locations!: Table<Location>;
  items!: Table<Item>;

  constructor() {
    super("storelog-db");

    this.version(1).stores({
      locations: "id, parentId, name, createdAt",
      items: "id, locationId, name, createdAt",
    });
  }
}

let _db: StorelogDB | null = null;

export function useDB(): StorelogDB {
  if (!_db) {
    _db = new StorelogDB();
  }
  return _db;
}
