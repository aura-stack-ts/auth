import path from "path"
import { defineConfig } from "vitest/config"
import { getRandomBytes } from "@aura-stack/jose/crypto"
import { base64url } from "@aura-stack/jose/jose"

const SECRET_KEY = getRandomBytes(44)
const SALT_KEY = getRandomBytes(44)

/**
 * Vitest configuration for the Aura Auth core package.
 *
 * @example
 * pnpm test
 * pnpm test --project core
 * pnpm test --project rate-limiter
 */
export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        unstubEnvs: true,
        env: {
            AURA_AUTH_SECRET: base64url.encode(SECRET_KEY),
            AURA_AUTH_GITHUB_CLIENT_ID: "github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "github-client-secret",
            AURA_AUTH_SALT: base64url.encode(SALT_KEY),
            AURA_AUTH_OAUTH_PROVIDER_CLIENT_ID: "oauth_client_id",
            AURA_AUTH_OAUTH_PROVIDER_CLIENT_SECRET: "oauth_client_secret",
            "AURA_AUTH_OAUTH-PROVIDER_CLIENT_ID": "oauth_client_id",
            "AURA_AUTH_OAUTH-PROVIDER_CLIENT_SECRET": "oauth_client_secret",
            "AURA_AUTH_OAUTH-PROFILE_CLIENT_ID": "oauth_profile_client_id",
            "AURA_AUTH_OAUTH-PROFILE_CLIENT_SECRET": "oauth_profile_client_secret",
            AURA_AUTTH_LOGGER: process.env.CI === "true" ? "false" : "true",
        },
        typecheck: {
            include: ["test/**/*.test-d.ts"],
            enabled: false,
        },
        projects: [
            {
                test: {
                    name: "core",
                    include: ["test/**/*.test.ts"],
                    exclude: ["test/rate-limiter.test.ts"],
                    setupFiles: ["./test/setup/vitest.setup.ts"],
                },
                resolve: {
                    alias: {
                        "@": path.resolve(__dirname, "./src"),
                        "@test": path.resolve(__dirname, "./test"),
                    },
                },
            },
            {
                test: {
                    name: "rate-limiter",
                    include: ["test/rate-limiter.test.ts"],
                },
                resolve: {
                    alias: {
                        "@": path.resolve(__dirname, "./src"),
                        "@test": path.resolve(__dirname, "./test"),
                    },
                },
            },
        ],
    },
})
