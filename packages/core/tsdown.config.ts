import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    entry: [
        "src/index.ts",
        "src/oauth/*.ts",
        "src/@types/index.ts",
        "src/client/index.ts",
        "src/identity/*.ts",
        "src/shared/crypto.ts",
        "src/shared/index.ts",
        "src/shared/cookies.ts",
    ],
})
