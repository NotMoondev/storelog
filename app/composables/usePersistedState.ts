/**
 * Returns a ref backed by localStorage. Reads the initial value from storage
 * and watches for changes to write back automatically.
 */
export function usePersistedRef<T>(key: string, defaultValue: T) {
    function read(): T {
        if (import.meta.server) return defaultValue
        try {
            const raw = localStorage.getItem(key)
            if (raw === null) return defaultValue
            return JSON.parse(raw) as T
        } catch {
            return defaultValue
        }
    }

    const state = ref<T>(read())

    watch(state, val => {
        try {
            localStorage.setItem(key, JSON.stringify(val))
        } catch { /* quota exceeded or private mode */ }
    }, { deep: true })

    return state
}
