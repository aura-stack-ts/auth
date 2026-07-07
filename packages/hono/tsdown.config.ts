import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    entry: [
        "src/index.ts",
        "src/oauth/index.ts",
        "src/oauth/*.ts",
        "src/identity/index.ts",
        "src/identity/*.ts",
        "src/_core/crypto.ts",
        "src/_core/shared.ts",
        "src/_core/cookies.ts",
    ],
})
