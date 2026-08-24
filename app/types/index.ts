/** Authorship metadata shared by every record. Values are `AppUser` ids. */
export interface Authored {
  createdBy?: string | null
  updatedBy?: string | null
  updatedAt?: number | null
}

export interface AppUser {
  id: string
  name: string
  createdAt: number
  lastSeenAt: number
}

export interface Location extends Authored {
  id: string
  name: string
  parentId: string | null
  createdAt: number
}

export interface Item extends Authored {
  id: string
  name: string
  locationId: string
  note?: string
  createdAt: number
}

export interface ItemWithPath extends Item {
  locationPath: string
  locationNames: string[]
}

export interface LocationNode extends Location {
  children: LocationNode[]
  depth: number
}
