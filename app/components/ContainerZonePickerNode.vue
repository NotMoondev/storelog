<template>
    <!-- Split node -->
    <div v-if="node.type !== 'leaf'" class="flex w-full h-full overflow-hidden"
        :class="node.type === 'vsplit' ? 'flex-row' : 'flex-col'">
        <div class="overflow-hidden relative shrink-0" :style="childAStyle">
            <ContainerZonePickerNode :node="node.children[0]" :selected-id="selectedId"
                @select="$emit('select', $event)" />
        </div>
        <div class="shrink-0 bg-border/60" :class="node.type === 'vsplit' ? 'w-px' : 'h-px'" />
        <div class="overflow-hidden relative flex-1">
            <ContainerZonePickerNode :node="node.children[1]" :selected-id="selectedId"
                @select="$emit('select', $event)" />
        </div>
    </div>

    <!-- Leaf node -->
    <button v-else type="button"
        class="w-full h-full flex flex-col items-center justify-center gap-1 p-2 transition-colors"
        :class="[
            node.locationId ? 'cursor-pointer' : 'cursor-default opacity-30',
            node.locationId && selectedId === node.locationId
                ? 'bg-accent-dim'
                : node.locationId ? 'hover:bg-bg-hover active:bg-bg-elevated' : ''
        ]"
        :disabled="!node.locationId"
        @click="node.locationId && $emit('select', node.locationId)"
    >
        <span class="text-[11px] leading-tight text-center select-none"
            :class="node.locationId && selectedId === node.locationId ? 'text-accent font-medium' : 'text-text-muted'">
            {{ node.name }}
        </span>
        <IconCheck v-if="node.locationId && selectedId === node.locationId" :size="11" class="text-accent" />
    </button>
</template>

<script setup lang="ts">
import type { ContainerNode } from '~/types/container'

const props = defineProps<{
    node: ContainerNode
    selectedId?: string
}>()

defineEmits<{ select: [locationId: string] }>()

const childAStyle = computed(() => {
    if (props.node.type === 'leaf') return {}
    const n = props.node
    return n.type === 'vsplit'
        ? { width: `${n.splitPos * 100}%`, height: '100%' }
        : { height: `${n.splitPos * 100}%`, width: '100%' }
})
</script>
