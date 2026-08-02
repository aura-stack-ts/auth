import path from "path"
import crypto from "crypto"
import { defineConfig, TestProjectConfiguration } from "vitest/config"

const SECRET_KEY = crypto.randomBytes(32).toString("base64")
const SALT_KEY = crypto.randomBytes(32).toString("base64")

const alias = {
    "@": path.resolve(__dirname, "./src"),
    "@test": path.resolve(__dirname, "./test"),
}

const statefulProject =
    process.env.CI === "true"
        ? {}
        : ({
              test: {
                  name: "stateful",
                  include: ["test/stateful/**/*.test.ts"],
                  setupFiles: ["test/stateful/setup.ts"],
                  fileParallelism: false,
                  sequence: {
                      concurrent: false,
                  },
              },
              resolve: {
                  alias,
              },
          } as TestProjectConfiguration)

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: "v8",
            enabled: true,
        },
        unstubEnvs: true,
        env: {
            DEBUG: "1",
            AURA_AUTH_SECRET: SECRET_KEY,
            AURA_AUTH_SALT: SALT_KEY,
            AURA_AUTH_GOOGLE_CLIENT_ID: "test-google-client-id",
            AURA_AUTH_GOOGLE_CLIENT_SECRET: "test-google-client-secret",
            AURA_AUTH_GITHUB_CLIENT_ID: "test-github-client-id",
            AURA_AUTH_GITHUB_CLIENT_SECRET: "test-github-client-secret",
        },
        projects: [
            statefulProject,
            {
                test: {
                    name: "stateless",
                    include: ["test/stateless/**/*.test.ts"],
                    exclude: ["test/stateful/**/*.test.ts"],
                },
                resolve: {
                    alias,
                },
            },
        ],
    },
    resolve: {
        alias,
    },
})
