import path from "path"
import crypto from "crypto"
import { defineConfig } from "vitest/config"

const SECRET_KEY = crypto.randomBytes(32).toString("base64")
const SALT_KEY = crypto.randomBytes(32).toString("base64")

export default defineConfig({
    test: {
        globals: true,
        include: ["test/**/*.test.ts"],
        typecheck: {
            enabled: true,
            include: ["test/**/*.test-d.ts"],
            exclude: ["test/**/*.test.ts"],
        },
        coverage: {
            provider: "v8",
            enabled: true,
        },
        unstubEnvs: true,
        env: {
            AURA_AUTH_SECRET: SECRET_KEY,
            AURA_AUTH_SALT: SALT_KEY,
            AURA_AUTH_GITHUB_CLIENT_ID: "test-github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "test-github-client-secret",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
            "@test": path.resolve(import.meta.dirname, "./test"),
        },
    },
})
