import path from "node:path"
import crypto from "node:crypto"
import { defineConfig } from "vitest/config"

/**
 * For a strange reason, crypto.randomBytes function is not generating a correct length
 */
const SECRET_KEY = crypto.randomBytes(24).toString("base64")

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        coverage: {
            provider: "v8",
            enabled: true,
        },
        unstubEnvs: true,
        env: {
            AURA_AUTH_SECRET: SECRET_KEY,
            AURA_AUTH_GITHUB_CLIENT_ID: "github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "github-client-secret",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@test": path.resolve(__dirname, "./test"),
        },
    },
})
