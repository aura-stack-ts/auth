import crypto from "crypto"
import path from "path"
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
            AURA_AUTH_GITHUB_CLIENT_ID: "github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "github-client-secret",
            AURA_AUTH_SALT: SALT_KEY,
            AURA_AUTH_OAUTH_PROVIDER_CLIENT_ID: "oauth_client_id",
            AURA_AUTH_OAUTH_PROVIDER_CLIENT_SECRET: "oauth_client_secret",
            "AURA_AUTH_OAUTH-PROVIDER_CLIENT_ID": "oauth_client_id",
            "AURA_AUTH_OAUTH-PROVIDER_CLIENT_SECRET": "oauth_client_secret",
            "AURA_AUTH_OAUTH-PROFILE_CLIENT_ID": "oauth_profile_client_id",
            "AURA_AUTH_OAUTH-PROFILE_CLIENT_SECRET": "oauth_profile_client_secret",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@test": path.resolve(__dirname, "./test"),
        },
    },
})
