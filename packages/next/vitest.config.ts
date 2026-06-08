import path from "path"
import { defineConfig } from "vitest/config"
import { createSecretValue } from "@aura-stack/react/crypto"

const SECRET_KEY = createSecretValue(44)
const SALT_KEY = createSecretValue(44)

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
            include: ["test/**/*.test-d.ts"],
            enabled: false,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@test": path.resolve(__dirname, "./test"),
        },
    },
})
