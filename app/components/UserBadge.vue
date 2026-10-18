<template>
    <span class="inline-flex items-center gap-1.5 min-w-0 align-middle">
        <span class="rounded-full flex items-center justify-center font-semibold shrink-0 border leading-none"
            :class="size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-4.5 h-4.5 text-[8px]'" :style="avatarStyle"
            :title="name">
            {{ initials }}
        </span>
        <span v-if="showName" class="truncate"
            :class="[size === 'sm' ? 'text-[13px]' : 'text-[11px]', mine ? 'text-text-secondary' : 'text-text-muted']">
            {{ name }}<span v-if="mine" class="text-text-muted">&nbsp;(du)</span>
        </span>
    </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    userId?: string | null
    size?: 'xs' | 'sm'
    showName?: boolean
}>(), { size: 'xs', showName: true })

const { userName, isMe, userInitials, userHue } = useUser()

const name = computed(() => userName(props.userId))
const initials = computed(() => (props.userId ? userInitials(name.value) : '?'))
const mine = computed(() => isMe(props.userId))

const avatarStyle = computed(() => {
    if (!props.userId) {
        return {
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            borderColor: 'var(--border)',
        }
    }
    const accent = `hsl(${userHue(name.value)} 65% 50%)`
    return {
        background: `color-mix(in srgb, ${accent} 22%, var(--bg-surface))`,
        color: `color-mix(in srgb, ${accent} 80%, var(--text-primary))`,
        borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
    }
})
</script>
