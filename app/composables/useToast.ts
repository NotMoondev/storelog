import { errorMessage } from "~/utils/errorMessage"

/**
 * One short message after every change, with an optional way back. Replaces
 * confirm() dialogs: things happen at once and can be taken back here.
 */
export interface ToastOptions {
    /** Participle with the result, e.g. "Verschoben nach Keller › Werkbank". */
    message: string
    /** Puts back the state from before the change. */
    undo?: () => void | Promise<void>
    /** Label of the undo button; "Rückgängig" by default. */
    undoLabel?: string
    tone?: "success" | "danger"
}

interface ToastState extends ToastOptions {
    id: number
}

const DURATION = 6000

const current = ref<ToastState | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null
let nextId = 1

function clear() {
    if (timer) clearTimeout(timer)
    timer = null
}

export function useToast() {
    function show(options: ToastOptions) {
        clear()
        current.value = { ...options, id: nextId++ }
        timer = setTimeout(dismiss, DURATION)
    }

    function dismiss() {
        clear()
        current.value = null
    }

    /** Touching the toast keeps it; leaving restarts the clock. */
    function hold() {
        clear()
    }

    function release() {
        if (!current.value) return
        clear()
        timer = setTimeout(dismiss, DURATION)
    }

    async function runUndo() {
        const toast = current.value
        dismiss()
        if (!toast?.undo) return
        try {
            await toast.undo()
        } catch (err) {
            show({ message: errorMessage(err, "Rückgängig machen hat nicht geklappt."), tone: "danger" })
        }
    }

    /** Report a failed action in the same place a success would appear. */
    function error(err: unknown, fallback: string) {
        show({ message: errorMessage(err, fallback), tone: "danger" })
    }

    return { current: readonly(current), show, dismiss, hold, release, runUndo, error }
}
