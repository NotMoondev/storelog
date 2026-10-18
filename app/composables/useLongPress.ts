const DELAY = 500
/** A finger that travels further than this is scrolling, not pressing. */
const SLOP = 8

/**
 * Long press on touch, right click with a pointer. Returns listeners to spread
 * with `v-on`, plus `consumeClick()`: the click that follows a long press must
 * not also open the row.
 */
export function useLongPress(onLongPress: () => void) {
    let timer: ReturnType<typeof setTimeout> | null = null
    let startX = 0
    let startY = 0
    let fired = false

    function cancel() {
        if (timer) clearTimeout(timer)
        timer = null
    }

    function onTouchstart(e: TouchEvent) {
        const t = e.touches[0]
        if (!t) return
        fired = false
        startX = t.clientX
        startY = t.clientY
        cancel()
        timer = setTimeout(() => {
            fired = true
            timer = null
            navigator.vibrate?.(10)
            onLongPress()
        }, DELAY)
    }

    function onTouchmove(e: TouchEvent) {
        const t = e.touches[0]
        if (!t || !timer) return
        if (Math.abs(t.clientX - startX) > SLOP || Math.abs(t.clientY - startY) > SLOP) cancel()
    }

    function onContextmenu(e: Event) {
        e.preventDefault()
        // On touch the timer already fired. A right click arrives on its own and
        // is not followed by a click, so it must not arm `consumeClick`.
        if (fired) return
        onLongPress()
    }

    /** True once, right after a long press: swallow that click. */
    function consumeClick(): boolean {
        if (!fired) return false
        fired = false
        return true
    }

    onBeforeUnmount(cancel)

    return {
        listeners: {
            touchstart: onTouchstart,
            touchmove: onTouchmove,
            touchend: cancel,
            touchcancel: cancel,
            contextmenu: onContextmenu,
        },
        consumeClick,
    }
}
