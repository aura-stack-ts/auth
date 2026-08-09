import tailwindcss from "@tailwindcss/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import { fileURLToPath, URL } from "url"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"

const config = defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
        tsconfigPaths: true,
    },
    plugins: [tailwindcss(), tanstackStart({ srcDirectory: "src" }), viteReact(), nitro(), devtools()],
})

export default config
