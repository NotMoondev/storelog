<template>
    <!-- Replaces the navigation while items are selected; ends via "Fertig" above the list. -->
    <div class="flex items-center gap-2 h-16 pl-4 pr-2 bg-bg-surface border border-border rounded-lg shadow-float">
        <span class="mr-auto text-label font-medium tabular-nums whitespace-nowrap">
            {{ count }} ausgewählt
        </span>
        <UiButton variant="danger" :icon="Trash2" aria-label="Löschen" :disabled="!count" class="w-12 px-0!"
            @click="$emit('delete')" />
        <UiButton variant="primary" :icon="CornerUpRight" :disabled="!count" @click="$emit('move')">
            Verschieben
        </UiButton>
    </div>
</template>

<script setup lang="ts">
import { CornerUpRight, Trash2 } from "lucide-vue-next"

defineEmits<{ move: []; delete: [] }>()

const { count } = useSelection()
</script>
