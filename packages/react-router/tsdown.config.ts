import { tsdownConfig } from "@aura-stack/tsdown-config"
import { defineConfig, type UserConfig } from "tsdown"

export default defineConfig({
    ...tsdownConfig,
    deps: {
        neverBundle: ["react", "react-dom", "react-router"],
    },
} as UserConfig)
