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
        return $fetch<Container[]>('/api/containers')
    },

    async getById(id: string): Promise<Container | undefined> {
        const all = await this.getAll()
        return all.find((c) => c.id === id)
    },

    async getByLocationId(locationId: string): Promise<Container | undefined> {
        return $fetch<Container | null>(`/api/containers/by-location/${locationId}`).then((r) => r ?? undefined)
    },

    async create(data: Omit<Container, "id" | "createdAt">): Promise<Container> {
        return $fetch<Container>('/api/containers', { method: 'POST', body: data })
    },

    async update(id: string, rootNode: ContainerNode): Promise<void> {
        await $fetch(`/api/containers/${id}`, { method: 'PUT', body: { rootNode } })
    },

    async renameZone(containerId: string, leafId: string, name: string): Promise<void> {
        await $fetch(`/api/containers/${containerId}/rename-zone`, { method: 'PUT', body: { leafId, name } })
    },

    async delete(id: string): Promise<void> {
        await $fetch(`/api/containers/${id}`, { method: 'DELETE' })
    },
}
