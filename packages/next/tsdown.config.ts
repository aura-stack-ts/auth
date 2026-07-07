import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    platform: "node",
    entry: [
        "src/index.ts",
        "src/client.ts",
        "src/context.tsx",
        "src/oauth/index.ts",
        "src/oauth/*.ts",
        "src/identity/index.ts",
        "src/identity/*.ts",
        "src/_core/crypto.ts",
        "src/_core/shared.ts",
        "src/_core/cookies.ts",
        "src/pages/index.ts",
        "src/pages/client.ts",
        "src/pages/context.tsx",
        "src/@types/index.ts",
    ],
    fixedExtension: false,
    deps: {
        onlyBundle: false,
        neverBundle: ["next", "next/headers", "next/navigation", "react", "react-dom"],
    },
})
