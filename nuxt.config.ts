import tailwindcss from "@tailwindcss/vite"
import { execSync } from "node:child_process"

function getAppVersion(): string {
    if (process.env.APP_VERSION) return process.env.APP_VERSION
    try {
        return execSync('git describe --tags --match "v*.*.*" --abbrev=0', { stdio: ['pipe', 'pipe', 'pipe'] })
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

    modules: ["@vite-pwa/nuxt", "nuxt-lucide-icons"],

    pwa: {
        registerType: "autoUpdate",
        manifest: {
            name: "STORELOG",
            short_name: "STORELOG",
            description: "Finde jeden Gegenstand sofort.",
            theme_color: "#0b0b0b",
            background_color: "#0b0b0b",
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
            globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
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
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                { name: "description", content: "Finde jeden Gegenstand sofort." },
                { name: "theme-color", content: "#0b0b0b" },
                { name: "apple-mobile-web-app-capable", content: "yes" },
                {
                    name: "apple-mobile-web-app-status-bar-style",
                    content: "black-translucent",
                },
            ],
            link: [
                { rel: "preconnect", href: "https://fonts.googleapis.com" },
                {
                    rel: "preconnect",
                    href: "https://fonts.gstatic.com",
                    crossorigin: "",
                },
                {
                    rel: "stylesheet",
                    href: "https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;500;600;700;800&display=swap",
                },
            ],
        },
    },
});
