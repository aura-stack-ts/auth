import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    entry: ["src/index.ts"],
    unbundle: true,
    platform: "node",
})
