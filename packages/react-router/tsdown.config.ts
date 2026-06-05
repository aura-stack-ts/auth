import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    platform: "browser",
    entry: [
        "src/index.ts",
        "src/client.tsx",
        "src/oauth/index.ts",
        "src/_core/identity.ts",
        "src/_core/crypto.ts",
        "src/_core/shared.ts",
        "src/_core/cookies.ts",
        "src/@types/index.ts",
    ],
    fixedExtension: false,
    deps: {
        ...tsdownConfig.deps,
        onlyBundle: false,
        neverBundle: ["react", "react-dom", "react-router"],
    },
})
