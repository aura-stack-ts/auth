import path from "path"
import { defineConfig } from "vitest/config"
import { getRandomBytes } from "@aura-stack/jose/crypto"
import { base64url } from "@aura-stack/jose/jose"
import { readFileSync } from "fs"

const SECRET_KEY = getRandomBytes(44)
const SALT_KEY = getRandomBytes(44)

const version = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")).version

const resolve = {
    alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@test": path.resolve(import.meta.dirname, "./test"),
    },
}

/**
 * Vitest configuration for the Aura Auth core package.
 *
 * @example
 * pnpm test
 */
export default defineConfig({
    define: {
        __PACKAGE_VERSION__: JSON.stringify(version),
    },
    test: {
        include: ["test/**/*.test.ts"],
        unstubEnvs: true,
        isolate: false,
        pool: "threads",
        env: {
            AURA_AUTH_SALT: base64url.encode(SALT_KEY),
            AURA_AUTH_SECRET: base64url.encode(SECRET_KEY),
            AURA_AUTH_GITHUB_CLIENT_ID: "github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "github-client-secret",
            AURA_AUTH_OAUTH_PROVIDER_CLIENT_ID: "oauth_client_id",
            AURA_AUTH_OAUTH_PROVIDER_CLIENT_SECRET: "oauth_client_secret",
        },
        typecheck: {
            enabled: false,
            include: ["test/**/*.test-d.ts"],
            exclude: ["test/**/*.test.ts"],
        },
        setupFiles: ["./test/setup/rate-limiter.setup.ts", "./test/setup/actions.setup.ts"],
    },
    resolve,
})
