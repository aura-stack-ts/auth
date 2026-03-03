import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    css: ["~/assets/css/tailwind.css"],
    vite: {
        // @ts-expect-error - Nuxt/Vite plugin typing mismatch for `@tailwindcss/vite`
        plugins: [tailwindcss()],
        build: {
            target: "es2022",
            sourcemap: false,
        },
        optimizeDeps: {
            esbuildOptions: {
                target: "es2022",
            },
        },
    },
    nitro: {
        esbuild: {
            options: {
                target: "es2022",
            },
        },
    },
})
