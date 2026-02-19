import crypto from "crypto"
import { defineConfig } from "vitest/config"

const SECRET_KEY = crypto.randomBytes(32).toString("base64url")
const SALT_KEY = crypto.randomBytes(32).toString("base64url")

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
            AURA_AUTH_SALT: SALT_KEY,
            AURA_AUTH_GITHUB_CLIENT_ID: "test-github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "test-github-client-secret",
        },
    },
})
