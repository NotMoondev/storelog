import { readStoredIdentity, USER_HEADER } from './userIdentity'

/**
 * `$fetch` with the current identity attached, so the server can record who
 * created or changed a record.
 */
export function api<T>(
    request: string,
    options: Record<string, unknown> = {},
): Promise<T> {
    const identity = readStoredIdentity()
    return $fetch<T>(request, {
        ...options,
        headers: {
            ...(options.headers as Record<string, string> | undefined),
            ...(identity ? { [USER_HEADER]: identity.id } : {}),
        },
    })
}
