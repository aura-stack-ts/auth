import crypto from "crypto"
import path from "path"
import { defineConfig } from "vitest/config"

const SECRET_KEY = crypto.randomBytes(32).toString("base64url")

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
