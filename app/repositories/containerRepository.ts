import { useDB } from "./db"
import type { Container, ContainerNode, ContainerLeafNode } from "~/types/container"

function generateId(): string {
    return crypto.randomUUID()
}

// ── BSP Tree helpers ──────────────────────────────────────────────────────────

/** Collect all leaf nodes from a BSP tree */
export function collectLeaves(node: ContainerNode): ContainerLeafNode[] {
    if (node.type === "leaf") return [node]
    return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])]
}

/** Find a node by id anywhere in the tree */
export function findNode(root: ContainerNode, id: string): ContainerNode | null {
    if (root.id === id) return root
    if (root.type === "leaf") return null
    return findNode(root.children[0], id) || findNode(root.children[1], id)
}

/** Immutably replace a node in the tree */
export function replaceNode(
    root: ContainerNode,
    id: string,
    replacement: ContainerNode
): ContainerNode {
    if (root.id === id) return replacement
    if (root.type === "leaf") return root
    return {
        ...root,
        children: [
            replaceNode(root.children[0], id, replacement),
            replaceNode(root.children[1], id, replacement),
        ],
    }
}

/** Create a fresh leaf node */
export function makeLeaf(name = "Zone"): ContainerLeafNode {
    return { type: "leaf", id: generateId(), name }
}

/** Build a BSP tree that mirrors a cols×rows grid */
export function buildGridTree(cols: number, rows: number): ContainerNode {
    return _buildGridNode(cols, rows, 0, 0, cols, rows)
}

function _buildGridNode(
    cols: number, rows: number,
    colStart: number, rowStart: number,
    totalCols: number, totalRows: number,
): ContainerNode {
    if (cols === 1 && rows === 1) {
        const zoneNum = rowStart * totalCols + colStart + 1
        return makeLeaf(`Zone ${zoneNum}`)
    }
    if (cols >= rows) {
        const leftCols = Math.floor(cols / 2)
        const rightCols = cols - leftCols
        return {
            type: "vsplit",
            id: generateId(),
            splitPos: leftCols / cols,
            children: [
                _buildGridNode(leftCols, rows, colStart, rowStart, totalCols, totalRows),
                _buildGridNode(rightCols, rows, colStart + leftCols, rowStart, totalCols, totalRows),
            ],
        }
    } else {
        const topRows = Math.floor(rows / 2)
        const bottomRows = rows - topRows
        return {
            type: "hsplit",
            id: generateId(),
            splitPos: topRows / rows,
            children: [
                _buildGridNode(cols, topRows, colStart, rowStart, totalCols, totalRows),
                _buildGridNode(cols, bottomRows, colStart, rowStart + topRows, totalCols, totalRows),
            ],
        }
    }
}

// ── Repository ────────────────────────────────────────────────────────────────

export const containerRepository = {
    async getAll(): Promise<Container[]> {
        const db = useDB()
        return db.containers.orderBy("createdAt").toArray()
    },

    async getById(id: string): Promise<Container | undefined> {
        const db = useDB()
        return db.containers.get(id)
    },

    async getByLocationId(locationId: string): Promise<Container | undefined> {
        const db = useDB()
        return db.containers.where("locationId").equals(locationId).first()
    },

    /**
     * Create a container and auto-create Location entries for every leaf zone.
     * Returns the saved container with locationIds populated on each leaf.
     */
    async create(data: Omit<Container, "id" | "createdAt">): Promise<Container> {
        const db = useDB()
        const containerId = generateId()

        // Walk all leaf nodes, create a child Location for each
        const rootNodeWithLocations = await this._syncLeafLocations(
            data.rootNode,
            data.locationId,
            db
        )

        const container: Container = {
            id: containerId,
            createdAt: Date.now(),
            ...data,
            rootNode: rootNodeWithLocations,
        }

        await db.containers.add(container)
        return container
    },

    /**
     * Update a container's BSP tree.
     * - New leaf nodes get a Location created.
     * - Removed leaf nodes get their Location deleted (items moved to container parent).
     */
    async update(id: string, rootNode: ContainerNode): Promise<void> {
        const db = useDB()
        const existing = await db.containers.get(id)
        if (!existing) return

        const oldLeaves = collectLeaves(existing.rootNode)
        const oldIds = new Set(oldLeaves.map((l) => l.id))

        // Sync locations for all leaves in new tree
        const newRootNode = await this._syncLeafLocations(rootNode, existing.locationId, db)

        const newLeaves = collectLeaves(newRootNode)
        const newIds = new Set(newLeaves.map((l) => l.id))

        // Delete locations for removed leaves
        for (const leaf of oldLeaves) {
            if (!newIds.has(leaf.id) && leaf.locationId) {
                // Move items to container's parent location before deleting
                const items = await db.items.where("locationId").equals(leaf.locationId).toArray()
                for (const item of items) {
                    await db.items.update(item.id, { locationId: existing.locationId })
                }
                await db.locations.delete(leaf.locationId)
            }
        }

        await db.containers.update(id, { rootNode: newRootNode })
    },

    /** Update only the name of a single leaf zone */
    async renameZone(containerId: string, leafId: string, name: string): Promise<void> {
        const db = useDB()
        const container = await db.containers.get(containerId)
        if (!container) return

        const leaf = findNode(container.rootNode, leafId)
        if (!leaf || leaf.type !== "leaf") return

        const newRoot = replaceNode(container.rootNode, leafId, { ...leaf, name })
        await db.containers.update(containerId, { rootNode: newRoot })

        // Also sync the location name
        if (leaf.locationId) {
            await db.locations.update(leaf.locationId, { name })
        }
    },

    async delete(id: string): Promise<void> {
        const db = useDB()
        const container = await db.containers.get(id)
        if (!container) return

        // Delete all child locations created for zones
        const leaves = collectLeaves(container.rootNode)
        for (const leaf of leaves) {
            if (leaf.locationId) {
                const items = await db.items.where("locationId").equals(leaf.locationId).toArray()
                for (const item of items) {
                    await db.items.update(item.id, { locationId: container.locationId })
                }
                await db.locations.delete(leaf.locationId)
            }
        }

        await db.containers.delete(id)
    },

    /** Internal: ensure every leaf has a matching Location entry */
    async _syncLeafLocations(
        node: ContainerNode,
        parentLocationId: string,
        db: ReturnType<typeof useDB>
    ): Promise<ContainerNode> {
        if (node.type === "leaf") {
            if (node.locationId) {
                // Already has a location – just update its name in case it changed
                await db.locations.update(node.locationId, { name: node.name })
                return node
            }
            // Create a new child location
            const location = {
                id: generateId(),
                parentId: parentLocationId,
                name: node.name,
                createdAt: Date.now(),
            }
            await db.locations.add(location)
            return { ...node, locationId: location.id }
        }

        // Recurse for split nodes
        return {
            ...node,
            children: [
                await this._syncLeafLocations(node.children[0], parentLocationId, db),
                await this._syncLeafLocations(node.children[1], parentLocationId, db),
            ],
        } as ContainerNode
    },
}
