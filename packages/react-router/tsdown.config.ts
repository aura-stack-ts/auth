import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    platform: "browser",
    entry: [
        "src/index.ts",
        "src/client.tsx",
        "src/@types/index.ts",
        "src/generated/oauth/index.ts",
        "src/generated/oauth/*.ts",
        "src/generated/identity/index.ts",
        "src/generated/identity/*.ts",
        "src/generated/exports/crypto.ts",
        "src/generated/exports/shared.ts",
        "src/generated/exports/cookies.ts",
    ],
    fixedExtension: false,
    deps: {
        ...tsdownConfig.deps,
        onlyBundle: false,
        neverBundle: ["react", "react-dom", "react-router"],
    },
})
