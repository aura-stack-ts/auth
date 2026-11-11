import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    platform: "node",
    entry: [
        "src/index.ts",
        "src/client.ts",
        "src/context.tsx",
        "src/pages/index.ts",
        "src/pages/client.ts",
        "src/pages/context.tsx",
        "src/@types/index.ts",
        "src/generated/oauth/*.ts",
        "src/generated/identity/index.ts",
        "src/generated/oauth/index.ts",
        "src/generated/identity/*.ts",
        "src/generated/exports/crypto.ts",
        "src/generated/exports/shared.ts",
        "src/generated/exports/cookies.ts",
    ],
    fixedExtension: false,
    deps: {
        onlyBundle: false,
        neverBundle: ["next", "next/headers", "next/navigation", "react", "react-dom"],
    },
})
