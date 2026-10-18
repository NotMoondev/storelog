/** Shared by the dissolve dialog and its two endpoints. */

export type ChildAction = "promote" | "move" | "delete"
export type ItemAction = "move" | "delete"

export interface DissolveChildImpact {
    id: string
    name: string
    /** Locations below it, itself not counted. */
    descendantLocations: number
    /** Items in it and everything below it. */
    descendantItems: number
    isContainer: boolean
}

export interface DissolveItemImpact {
    id: string
    name: string
    note?: string
    locationId: string
    /** Set when the item sits in a zone of this location's own container. */
    zoneName?: string
}

export interface DissolveImpact {
    id: string
    name: string
    parentId: string | null
    parentName: string | null
    isContainer: boolean
    children: DissolveChildImpact[]
    items: DissolveItemImpact[]
}

export interface DissolvePlan {
    children?: { id: string; action: ChildAction; targetId?: string | null }[]
    items?: { id: string; action: ItemAction; targetId?: string | null }[]
}

export interface DissolveResult {
    promotedLocations: number
    movedLocations: number
    deletedLocations: number
    movedItems: number
    deletedItems: number
}
