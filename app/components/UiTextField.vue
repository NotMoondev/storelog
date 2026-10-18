<template>
    <div class="flex flex-col gap-2">
        <label v-if="label" :for="id" class="eyebrow">
            {{ label }}
            <span v-if="optional" class="normal-case tracking-normal font-medium text-text-muted">(optional)</span>
        </label>
        <input :id="id" ref="inputRef" :value="modelValue" type="text" :placeholder="placeholder" autocomplete="off"
            spellcheck="false" autocapitalize="sentences" :enterkeyhint="enterkeyhint" :maxlength="maxlength"
            :aria-invalid="!!error || undefined" :aria-describedby="error || hint ? `${id}-hint` : undefined"
            class="h-13 w-full px-4 rounded-md bg-bg-elevated border text-body text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] focus-visible:shadow-[0_0_0_3px_var(--accent-glow)]"
            :class="[error ? 'border-danger' : 'border-border', variant === 'title' ? 'font-name text-title-md' : '']"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            @keydown.enter="$emit('enter')" @keydown.escape="$emit('escape')" @blur="$emit('blur')" />
        <p v-if="error || hint" :id="`${id}-hint`" class="text-meta"
            :class="error ? 'text-danger' : 'text-text-muted'">
            {{ error || hint }}
        </p>
    </div>
</template>

<script setup lang="ts">
/** A labelled input. Always 16px text: anything smaller makes iOS zoom in on focus. */
withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    optional?: boolean
    hint?: string
    error?: string
    /** `title` sets the field in the name face, for renaming in place. */
    variant?: "default" | "title"
    enterkeyhint?: "done" | "next" | "go" | "search" | "enter"
    maxlength?: number
}>(), {
    variant: "default",
    enterkeyhint: "done",
})

defineEmits<{
    "update:modelValue": [value: string]
    enter: []
    escape: []
    blur: []
}>()

const id = useId()
const inputRef = ref<HTMLInputElement>()

defineExpose({
    focus: () => inputRef.value?.focus(),
    select: () => inputRef.value?.select(),
})
</script>
