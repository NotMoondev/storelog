import { userRepository } from "~/repositories/userRepository"
import type { AppUser } from "~/types"
import {
    normalizeUserName,
    readStoredIdentity,
    writeStoredIdentity,
    userInitials,
    userHue,
} from "~/utils/userIdentity"

/** Guards the background refresh triggered by an unknown author id. */
let refreshing = false

export function useUser() {
    const currentUser = useState<AppUser | null>("currentUser", () => null)
    const users = useState<AppUser[]>("users", () => [])
    /** False until we know whether this device has an identity yet. */
    const ready = useState<boolean>("currentUserReady", () => false)

    const isIdentified = computed(() => !!currentUser.value)

    const usersById = computed(() => {
        const map: Record<string, AppUser> = {}
        for (const user of users.value) map[user.id] = user
        return map
    })

    async function loadUsers(): Promise<void> {
        users.value = await userRepository.getAll()
    }

    /**
     * Restore the identity from this device's storage. The name is re-resolved
     * on the server so the id stays valid even after a database reset or import.
     */
    async function init(): Promise<void> {
        try {
            const stored = readStoredIdentity()
            if (!stored) return

            const user = await userRepository.resolveByName(stored.name)
            currentUser.value = user
            writeStoredIdentity({ id: user.id, name: user.name })
            await loadUsers()
        } catch {
            // Offline or server unreachable – keep the stored name so the UI
            // does not fall back to the setup screen unnecessarily.
            const stored = readStoredIdentity()
            if (stored) {
                currentUser.value = {
                    id: stored.id,
                    name: stored.name,
                    createdAt: Date.now(),
                    lastSeenAt: Date.now(),
                }
            }
        } finally {
            ready.value = true
        }
    }

    /** Pick a name and become that user. Same name = same user, on any device. */
    async function signIn(rawName: string): Promise<AppUser> {
        const name = normalizeUserName(rawName)
        if (!name) throw new Error("Name darf nicht leer sein.")

        const user = await userRepository.resolveByName(name)
        writeStoredIdentity({ id: user.id, name: user.name })
        currentUser.value = user
        await loadUsers()
        return user
    }

    /** Display name for an author id. Unknown ids trigger one background reload. */
    function userName(id: string | null | undefined): string {
        if (!id) return "Unbekannt"
        const known = usersById.value[id]
        if (known) return known.name
        // Offline the user list is empty, but our own name is known locally.
        if (currentUser.value?.id === id) return currentUser.value.name
        if (import.meta.client && !refreshing) {
            refreshing = true
            loadUsers().finally(() => { refreshing = false })
        }
        return "Unbekannt"
    }

    function isMe(id: string | null | undefined): boolean {
        return !!id && id === currentUser.value?.id
    }

    return {
        currentUser,
        users,
        usersById,
        ready,
        isIdentified,
        init,
        loadUsers,
        signIn,
        userName,
        isMe,
        userInitials,
        userHue,
    }
}
