<template>
    <div class="flex h-dvh bg-bg overflow-hidden">

        <!-- Desktop Sidebar -->
        <aside class="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-bg-surface border-r border-border z-40">
            <!-- Logo -->
            <div class="flex items-center gap-2 px-6 h-16 border-b border-border-subtle">
                <NuxtLink to="/" class="flex items-center gap-2 font-['Syne'] font-bold text-[15px] tracking-widest text-text-primary">
                    <img src="/icons/icon-192.png" width="18" height="18" />
                    STORELOG
                </NuxtLink>
            </div>

            <!-- Nav Links -->
            <nav class="flex-1 flex flex-col gap-1 px-3 py-4">
                <NuxtLink
                    to="/"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    :class="$route.path === '/' ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'"
                >
                    <Home :size="18" />
                    Home
                </NuxtLink>
                <NuxtLink
                    to="/search"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    :class="$route.path.startsWith('/search') ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'"
                >
                    <Search :size="18" />
                    Suche
                </NuxtLink>
                <NuxtLink
                    to="/locations"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    :class="$route.path.startsWith('/locations') ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'"
                >
                    <MapPin :size="18" />
                    Orte
                </NuxtLink>
            </nav>

            <!-- Settings at bottom -->
            <div class="px-3 py-4 border-t border-border-subtle">
                <NuxtLink
                    to="/settings"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    :class="$route.path.startsWith('/settings') ? 'text-accent bg-accent-dim' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'"
                >
                    <Settings :size="18" />
                    Einstellungen
                </NuxtLink>
            </div>
        </aside>

        <!-- Mobile Header -->
        <header
            class="lg:hidden shrink-0 flex items-center px-4 h-13 border-b border-border-subtle bg-bg z-10 fixed top-0 inset-x-0">
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

        <!-- Content wrapper -->
        <div class="flex flex-col flex-1 lg:ml-60 pt-13 lg:pt-0 overflow-hidden">
            <!-- Content -->
            <main class="flex-1 overflow-hidden flex flex-col">
                <slot />
            </main>

            <!-- Fade overlay behind the nav (mobile only) -->
            <div class="lg:hidden fixed bottom-0 inset-x-0 h-28 z-30 pointer-events-none"
                style="background: linear-gradient(to top, var(--bg) 0%, transparent 100%);" />

            <!-- Floating Bottom Nav (mobile only) -->
            <div class="lg:hidden fixed bottom-4 inset-x-4 z-40">
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

    </div>
</template>

<script setup lang="ts">
import { Home, Search, MapPin, Settings } from 'lucide-vue-next'
</script>
