<template>
    <!--
        The footer of every sheet: at most two buttons, the primary on the right
        and two thirds wide. No "Abbrechen" — sheets close via X, swipe or scrim.
    -->
    <div class="flex gap-3" :class="stack ? 'flex-col' : ''">
        <slot />
    </div>
</template>

<script setup lang="ts">
defineProps<{ stack?: boolean }>()
</script>

<style scoped>
div:not(.flex-col)> :slotted(*) {
    flex: 1 1 0;
    height: var(--control-lg);
    font-size: 16px;
}

div:not(.flex-col)> :slotted(.is-primary) {
    flex-grow: 2;
}

.flex-col> :slotted(*) {
    width: 100%;
    height: var(--control-lg);
    font-size: 16px;
}
</style>
