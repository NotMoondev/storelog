<template>
    <div class="flex flex-col h-dvh bg-bg overflow-hidden">

        <!-- Header -->
        <header
            class="shrink-0 flex items-center px-4 h-13 border-b border-border-subtle bg-bg relative z-10">

            <!-- Title -->
            <div class="flex justify-between items-center w-full px-2">
                <NuxtLink to="/" class="flex items-center gap-2 font-['Syne'] font-bold text-[15px] tracking-widest text-text-primary">
                    <span class="text-accent text-[20px]">
                        <img src="/icons/icon-192.png" width="18" height="18" />
                    </span>
                    STORELOG
                </NuxtLink>
                <NuxtLink
                    to="/settings"
                    :class="$route.path.startsWith('/settings') ? 'text-accent' : 'text-text-muted'"
                >
                    <Settings :size="20" />
                </NuxtLink>
            </div>

        </header>

        <!-- Content -->
        <main class="flex-1 overflow-hidden flex flex-col">
            <slot />
        </main>

        <!-- Fade overlay behind the nav -->
        <div class="fixed bottom-0 inset-x-0 h-28 z-30 pointer-events-none"
            style="background: linear-gradient(to top, var(--bg) 0%, transparent 100%);" />

        <!-- Floating Bottom Nav -->
        <div class="fixed bottom-4 inset-x-4 z-40">
            <nav>
                <div class="flex bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                    <NuxtLink
                        to="/"
                        class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                        :class="$route.path === '/' ? 'text-accent' : 'text-text-muted'"
                    >
                        <Home :size="20" />
                        <span class="text-[10px] font-medium">Home</span>
                    </NuxtLink>

                    <NuxtLink
                        to="/search"
                        class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                        :class="$route.path.startsWith('/search') ? 'text-accent' : 'text-text-muted'"
                    >
                        <Search :size="20" />
                        <span class="text-[10px] font-medium">Suche</span>
                    </NuxtLink>

                    <NuxtLink
                        to="/locations"
                        class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                        :class="$route.path.startsWith('/locations') ? 'text-accent' : 'text-text-muted'"
                    >
                        <MapPin :size="20" />
                        <span class="text-[10px] font-medium">Orte</span>
                    </NuxtLink>
                </div>
            </nav>
        </div>

    </div>
</template>

<script setup lang="ts">
import { Home, Search, MapPin, Settings } from 'lucide-vue-next'
</script>
