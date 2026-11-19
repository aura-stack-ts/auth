import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.tsx", "test/**/*.test.ts"],
        exclude: ["test/**/*.test-d.ts"],
        environment: "jsdom",
        globals: true,
        typecheck: {
            enabled: false,
            include: ["test/**/*.test-d.ts"],
            exclude: ["test/**/*.test.ts", "test/**/*.test.tsx"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
            "@test": path.resolve(import.meta.dirname, "./test"),
        },
    },
})
