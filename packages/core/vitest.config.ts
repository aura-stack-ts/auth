import path from "path"
import { defineConfig } from "vitest/config"
import { getRandomBytes } from "@aura-stack/jose/crypto"
import { base64url } from "@aura-stack/jose/jose"

const SECRET_KEY = getRandomBytes(44)
const SALT_KEY = getRandomBytes(44)

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        coverage: {
            provider: "v8",
            enabled: true,
        },
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
        },
        typecheck: {
            include: ["test/**/*.test-d.ts"],
            enabled: false,
        },
        // Causes issues with msw and global fetch mocks, need to investigate further
        //setupFiles: ["test/mocks/setupTest.ts"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@test": path.resolve(__dirname, "./test"),
        },
    },
})
