<template>
    <div role="radiogroup" :aria-label="label" class="flex gap-1 p-1 rounded-md bg-bg-elevated border border-border">
        <button v-for="opt in options" :key="opt.value" type="button" role="radio"
            :aria-checked="modelValue === opt.value"
            class="flex-1 min-w-0 h-9 px-2 rounded-sm text-meta font-medium truncate cursor-pointer transition-colors duration-150"
            :class="modelValue === opt.value
                ? 'bg-bg-selected text-text-primary shadow-[0_1px_2px_#0000001f,inset_0_0_0_1px_var(--border)]'
                : 'text-text-secondary hover:text-text-primary'" @click="$emit('update:modelValue', opt.value)">
            {{ opt.label }}
        </button>
    </div>
</template>

<script setup lang="ts" generic="T extends string">
/** Two or three equal options inside one control. Words only, no icons. */
defineProps<{
    modelValue: T
    options: { value: T; label: string }[]
    label?: string
}>()

defineEmits<{ "update:modelValue": [value: T] }>()
</script>
