import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    entry: ["src/index.ts", "src/providers/index.ts", "src/@types/index.ts"],
})
