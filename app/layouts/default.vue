<template>
    <div class="flex flex-col h-dvh bg-bg overflow-hidden">

        <!-- Header -->
        <header
            class="shrink-0 flex items-center justify-between px-4 h-13 border-b border-border-subtle bg-bg relative z-10">

            <!-- Title -->
            <NuxtLink to="/" :class="{ 'border-b border-b-accent': $route.path === '/' }" class="flex items-center gap-2 font-['Syne'] font-bold text-[15px] tracking-widest text-text-primary">
                <span class="text-accent text-[20px]">
                    <img src="/icons/icon-192.png" width="18" height="18" />
                </span>
                STORELOG
            </NuxtLink>

            <!-- Nav -->
            <nav class="flex gap-0.5">
                <NuxtLink v-for="tab in tabs" :key="tab.id" :to="tab.id"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-['DM_Mono'] text-sm tracking-[0.03em] border-none cursor-pointer transition-all duration-150"
                    :class="$route.name === tab.id ? 'bg-accent-dim text-accent' : 'bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary'">
                    <component :is="tab.icon" :size="16" />
                    <span v-if="tab.label">{{ tab.label }}</span>
                </NuxtLink>
            </nav>

        </header>

        <!-- Content -->
        <main class="flex-1 overflow-hidden flex flex-col">
            <slot />
        </main>

    </div>
</template>

<script setup lang="ts">
import { Search, MapPin, Settings } from 'lucide-vue-next'

const tabs = [
    { id: "search", label: "Suche", icon: Search },
    { id: "locations", label: "Orte", icon: MapPin },
    { id: "settings", icon: Settings },
]
</script>