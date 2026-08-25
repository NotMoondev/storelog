/**
 * German plurals that a `n !== 1 ? 'e' : ''` suffix gets wrong — "Gegenstände"
 * takes an umlaut, "Fächer" changes stem and ending.
 */
function count(n: number, one: string, many: string): string {
    return `${n} ${n === 1 ? one : many}`
}

export function itemCount(n: number): string {
    return count(n, "Gegenstand", "Gegenstände")
}

export function locationCount(n: number): string {
    return count(n, "Ort", "Orte")
}

export function subLocationCount(n: number): string {
    return count(n, "Unterort", "Unterorte")
}

export function zoneCount(n: number): string {
    return count(n, "Fach", "Fächer")
}

export function resultCount(n: number): string {
    return count(n, "Ergebnis", "Ergebnisse")
}
