export interface Location {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface Item {
  id: string;
  name: string;
  locationId: string;
  note?: string;
  createdAt: number;
}

export interface ItemWithPath extends Item {
  locationPath: string;
  locationNames: string[];
}

export interface LocationNode extends Location {
  children: LocationNode[];
  depth: number;
}
