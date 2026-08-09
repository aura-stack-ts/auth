import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.tsx", "test/**/*.test.ts"],
        environment: "jsdom",
        globals: true,
        clearMocks: true,
        restoreMocks: true,
        typecheck: {
            enabled: true,
            include: ["test/**/*.test-d.ts"],
            exclude: ["test/**/*.test.ts"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
            "@test": path.resolve(import.meta.dirname, "./test"),
        },
    },
})
