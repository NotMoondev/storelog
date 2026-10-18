export interface HighlightPart {
    text: string
    match: boolean
}

/**
 * Split `text` around every occurrence of `query` so a template can wrap the
 * matching runs. Case-insensitive, returns a single non-matching part when the
 * query is empty or absent.
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
    const needle = query.trim().toLowerCase()
    if (!needle) return [{ text, match: false }]

    const parts: HighlightPart[] = []
    const haystack = text.toLowerCase()
    let cursor = 0

    while (cursor < text.length) {
        const idx = haystack.indexOf(needle, cursor)
        if (idx === -1) break
        if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false })
        parts.push({ text: text.slice(idx, idx + needle.length), match: true })
        cursor = idx + needle.length
    }

    if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })
    return parts.length ? parts : [{ text, match: false }]
}
