import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    platform: "node",
    entry: [
        "src/index.ts",
        "src/client.ts",
        "src/oauth/index.ts",
        "src/oauth/*.ts",
        "src/_core/identity.ts",
        "src/_core/crypto.ts",
        "src/_core/shared.ts",
        "src/@types/index.ts",
        "src/pages/index.ts",
        "src/unstable.tsx",
    ],
    fixedExtension: false,
    deps: {
        onlyBundle: false,
        neverBundle: ["next", "next/headers", "next/navigation", "react", "react-dom"],
    },
})
