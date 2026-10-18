import { containerRepository, makeLeaf, collectLeaves, replaceNode, buildGridTree } from "~/repositories/containerRepository"
import type { Container, ContainerNode, ContainerDimensions } from "~/types/container"

/**
 * Guards the initial fetch. `useContainers()` is called from many components at
 * once; without this every one of them would trigger its own request.
 */
let initialLoad: Promise<void> | null = null

export function useContainers() {
    const containers = useState<Container[]>("containers", () => [])

    async function load() {
        containers.value = await containerRepository.getAll()
    }

    function ensureLoaded(): Promise<void> {
        if (!initialLoad) initialLoad = load()
        return initialLoad
    }

    async function createContainer(
        name: string,
        locationId: string,
        dimensions: ContainerDimensions,
        initialRootNode?: ContainerNode
    ): Promise<Container> {
        const rootNode = initialRootNode ?? makeLeaf("Hauptbereich")
        const container = await containerRepository.create({
            name,
            locationId,
            dimensions,
            rootNode,
        })
        containers.value = await containerRepository.getAll()
        return container
    }

    async function saveContainerTree(containerId: string, rootNode: ContainerNode): Promise<void> {
        await containerRepository.update(containerId, rootNode)
        containers.value = await containerRepository.getAll()
    }

    async function renameZone(containerId: string, leafId: string, name: string): Promise<void> {
        await containerRepository.renameZone(containerId, leafId, name)
        containers.value = await containerRepository.getAll()
    }

    async function deleteContainer(id: string): Promise<void> {
        await containerRepository.delete(id)
        containers.value = await containerRepository.getAll()
    }

    function getContainerByLocationId(locationId: string): Container | undefined {
        return containers.value.find((c) => c.locationId === locationId)
    }

    onMounted(() => { ensureLoaded() })

    return {
        containers,
        load,
        ensureLoaded,
        createContainer,
        saveContainerTree,
        renameZone,
        deleteContainer,
        getContainerByLocationId,
        // re-export helpers for use in components
        collectLeaves,
        makeLeaf,
        replaceNode,
        buildGridTree,
    }
}
