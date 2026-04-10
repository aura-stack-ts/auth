import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    test: {
        include: ["test/**/*.test.tsx", "test/**/*.test.ts"],
        environment: "jsdom",
        globals: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@test": path.resolve(__dirname, "./test"),
        },
    },
})
