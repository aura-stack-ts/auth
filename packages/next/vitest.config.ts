import path from "path"
import crypto from "crypto"
import { defineConfig } from "vitest/config"

const SECRET_KEY = crypto.randomBytes(32).toString("base64url")
const SALT_KEY = crypto.randomBytes(32).toString("base64url")

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
        environment: "node",
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: "v8",
            enabled: true,
        },
        unstubEnvs: true,
        env: {
            AURA_AUTH_SECRET: SECRET_KEY,
            AURA_AUTH_SALT: SALT_KEY,
        },
        typecheck: {
            enabled: true,
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
