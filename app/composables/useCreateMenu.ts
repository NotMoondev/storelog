/**
 * The "Neu" button in both navs asks what to create before opening anything.
 * The layout owns the panel and every sheet behind it, so no page mounts its
 * own copy — location pages keep their own context-bound create buttons,
 * which already know their parent.
 */
const open = ref(false)

export function useCreateMenu() {
    function openCreateMenu() {
        open.value = true
    }

    function closeCreateMenu() {
        open.value = false
    }

    return { open, openCreateMenu, closeCreateMenu }
}
