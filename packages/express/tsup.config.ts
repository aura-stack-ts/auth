import { tsupConfig } from "@aura-stack/tsup-config"
import { defineConfig } from "tsup"

export default defineConfig({
    ...tsupConfig,
    external: ["@aura-stack/auth", "@aura-stack/auth/oauth/index"],
})
