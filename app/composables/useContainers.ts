import { containerRepository, makeLeaf, collectLeaves, replaceNode } from "~/repositories/containerRepository"
import type { Container, ContainerNode, ContainerDimensions } from "~/types/container"

export function useContainers() {
    const containers = useState<Container[]>("containers", () => [])

    async function load() {
        containers.value = await containerRepository.getAll()
    }

    async function createContainer(
        name: string,
        locationId: string,
        dimensions: ContainerDimensions
    ): Promise<Container> {
        const rootNode = makeLeaf("Hauptbereich")
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

    onMounted(() => load())

    return {
        containers,
        load,
        createContainer,
        saveContainerTree,
        renameZone,
        deleteContainer,
        getContainerByLocationId,
        // re-export helpers for use in components
        collectLeaves,
        makeLeaf,
        replaceNode,
    }
}