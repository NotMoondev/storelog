export type SplitDirection = "vsplit" | "hsplit"

export interface ContainerLeafNode {
    type: "leaf"
    id: string
    name: string
    locationId?: string // auto-created Location entry
}

export interface ContainerSplitNode {
    type: "vsplit" | "hsplit"
    id: string
    splitPos: number // 0.0 – 1.0, relative to parent zone
    children: [ContainerNode, ContainerNode]
}

export type ContainerNode = ContainerLeafNode | ContainerSplitNode

// Dimensions – designed for future extensibility (real units later)
export interface ContainerDimensions {
    unit: "ratio" // extensible: 'cm' | 'inch' later
    width: number  // relative width
    height: number // relative height
}

export interface Container {
    id: string
    name: string
    locationId: string      // the parent Location this container belongs to
    dimensions: ContainerDimensions
    rootNode: ContainerNode
    createdAt: number
}