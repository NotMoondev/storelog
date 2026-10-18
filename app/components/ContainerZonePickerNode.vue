<template>
    <!-- Split node -->
    <div v-if="node.type !== 'leaf'" class="flex w-full h-full overflow-hidden"
        :class="node.type === 'vsplit' ? 'flex-row' : 'flex-col'">
        <div class="overflow-hidden relative shrink-0" :style="childAStyle">
            <ContainerZonePickerNode :node="node.children[0]" :selected-id="selectedId"
                @select="$emit('select', $event)" />
        </div>
        <div class="shrink-0 bg-text-muted/35" :class="node.type === 'vsplit' ? 'w-px' : 'h-px'" />
        <div class="overflow-hidden relative flex-1">
            <ContainerZonePickerNode :node="node.children[1]" :selected-id="selectedId"
                @select="$emit('select', $event)" />
        </div>
    </div>

    <!-- Leaf node: tapping a compartment picks it -->
    <button v-else type="button"
        class="w-full h-full min-h-11 flex flex-col items-center justify-center gap-1 p-2 transition-colors"
        :class="[
            node.locationId ? 'cursor-pointer' : 'cursor-default opacity-30',
            isSelected
                ? 'bg-accent-dim shadow-[inset_0_0_0_2px_var(--accent)]'
                : node.locationId ? 'hover:bg-bg-hover active:bg-bg-hover' : ''
        ]" :aria-pressed="isSelected" :disabled="!node.locationId"
        @click="node.locationId && $emit('select', node.locationId)">
        <span class="text-caption text-center select-none"
            :class="isSelected ? 'text-accent-text font-semibold' : 'text-text-secondary font-medium'">
            {{ node.name }}
        </span>
        <Check v-if="isSelected" :size="16" class="text-accent-text" />
    </button>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { ContainerNode } from '~/types/container'

const props = defineProps<{
    node: ContainerNode
    selectedId?: string
}>()

defineEmits<{ select: [locationId: string] }>()

const isSelected = computed(() =>
    props.node.type === 'leaf' && !!props.node.locationId && props.selectedId === props.node.locationId
)

const childAStyle = computed(() => {
    if (props.node.type === 'leaf') return {}
    const n = props.node
    return n.type === 'vsplit'
        ? { width: `${n.splitPos * 100}%`, height: '100%' }
        : { height: `${n.splitPos * 100}%`, width: '100%' }
})
</script>
