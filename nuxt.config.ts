import tailwindcss from "@tailwindcss/vite"
import { execSync } from "node:child_process"

function getAppVersion(): string {
    if (process.env.APP_VERSION) return process.env.APP_VERSION
    try {
        return execSync('git log origin/production -1 --pretty=format:%s', {
            stdio: ['pipe', 'pipe', 'pipe'],
        })
            .toString()
            .trim()
    } catch {
        return 'dev'
    }
}

const appVersion = getAppVersion()

export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: false },

    css: ["~/assets/css/main.css"],

    vite: {
        plugins: [tailwindcss()],
    },

    runtimeConfig: {
        public: {
            appVersion,
        },
    },

    // The two pages these used to serve now live at / and /orte.
    routeRules: {
        "/search": { redirect: { to: "/", statusCode: 301 } },
        "/locations": { redirect: { to: "/orte", statusCode: 301 } },
    },

    nitro: {
        rollupConfig: {
            // @ts-ignore
            external: ['better-sqlite3'],
        },
    },

    modules: ["@vite-pwa/nuxt", "nuxt-lucide-icons"],

    pwa: {
        registerType: "autoUpdate",
        manifest: {
            name: "STORELOG",
            short_name: "STORELOG",
            description: "Finde jeden Gegenstand sofort.",
            theme_color: "#1a1a1a",
            background_color: "#1a1a1a",
            display: "standalone",
            orientation: "portrait",
            icons: [
                {
                    src: "/icons/icon-192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    src: "/icons/icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
            ],
        },
        workbox: {
            navigateFallback: "/",
            globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        },
        devOptions: {
            enabled: false,
            suppressWarnings: true,
            navigateFallbackAllowlist: [/^\/$/],
            type: "module",
        },
    },

    lucide: {
        namePrefix: "Icon",
    },

    app: {
        head: {
            title: "STORELOG",
            meta: [
                { charset: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
                { name: "description", content: "Finde jeden Gegenstand sofort." },
                { name: "theme-color", content: "#1a1a1a" },
                { name: "apple-mobile-web-app-capable", content: "yes" },
                {
                    name: "apple-mobile-web-app-status-bar-style",
                    content: "black-translucent",
                },
            ],
            // Set the theme before the first paint, so a light-theme device
            // never flashes the dark default while the app boots.
            script: [
                {
                    innerHTML: "try{document.documentElement.setAttribute('data-theme',localStorage.getItem('replog-theme')||'dark')}catch(e){}",
                    tagPosition: "head",
                },
            ],
            link: [
                // Self-hosted Archivo (see main.css); preloading the Latin file
                // keeps the first paint from flashing the fallback.
                {
                    rel: "preload",
                    href: "/fonts/archivo-latin.woff2",
                    as: "font",
                    type: "font/woff2",
                    crossorigin: "",
                },
            ],
        },
    },
});
