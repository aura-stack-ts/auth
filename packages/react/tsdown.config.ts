import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    entry: [
        "src/index.tsx",
        "src/server.ts",
        "src/hooks.ts",
        "src/context.tsx",
        "src/oauth/index.ts",
        "src/oauth/*.ts",
        "src/_core/identity.ts",
        "src/_core/crypto.ts",
        "src/_core/shared.ts",
        "src/_core/cookies.ts",
        "src/@types/index.ts",
    ],
    deps: {
        ...tsdownConfig.deps,
        neverBundle: ["react", "react-dom"],
    },
})
