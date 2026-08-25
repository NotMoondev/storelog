/**
 * Pull the human-readable half out of whatever a failed request threw.
 * `$fetch` puts the server's error body on `.data`, where our endpoints send
 * the long explanation as `message` and a short label as `statusMessage`.
 */
export function errorMessage(err: unknown, fallback = "Das hat nicht geklappt."): string {
    if (typeof err === "string" && err.trim()) return err

    if (err && typeof err === "object") {
        const data = (err as { data?: { message?: string; statusMessage?: string } }).data
        if (data?.message) return data.message
        if (data?.statusMessage) return data.statusMessage

        const direct = err as { statusMessage?: string; message?: string }
        if (direct.statusMessage) return direct.statusMessage
        // `message` on a FetchError is the raw "[POST] ... 400 Bad Request" line,
        // so it is only worth showing when nothing better exists.
        if (direct.message && !direct.message.startsWith("[")) return direct.message
    }

    return fallback
}
