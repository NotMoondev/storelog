/**
 * The local identity claim. There is no login – the name a person types once is
 * stored here and sent with every request, so typing the same name on another
 * device makes you the same user.
 */
export const USER_STORAGE_KEY = 'storelog-user'
export const USER_HEADER = 'x-storelog-user'
export const MAX_USER_NAME_LENGTH = 32

export interface StoredIdentity {
    id: string
    name: string
}

export function readStoredIdentity(): StoredIdentity | null {
    if (import.meta.server) return null
    try {
        const raw = localStorage.getItem(USER_STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as StoredIdentity
        if (!parsed?.id || !parsed?.name) return null
        return { id: parsed.id, name: parsed.name }
    } catch {
        return null
    }
}

export function writeStoredIdentity(identity: StoredIdentity | null): void {
    if (import.meta.server) return
    try {
        if (identity) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(identity))
        else localStorage.removeItem(USER_STORAGE_KEY)
    } catch { /* quota exceeded or private mode */ }
}

/** Trim and collapse whitespace – mirrors the server so both agree on a name. */
export function normalizeUserName(name: string): string {
    return name.replace(/\s+/g, ' ').trim().slice(0, MAX_USER_NAME_LENGTH)
}

/** Up to two letters for the avatar bubble. */
export function userInitials(name: string): string {
    const parts = normalizeUserName(name).split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** Stable hue per name, so a user keeps the same colour on every device. */
export function userHue(name: string): number {
    let hash = 0
    for (const char of normalizeUserName(name).toLowerCase()) {
        hash = (hash * 31 + char.charCodeAt(0)) % 360_000
    }
    return hash % 360
}
