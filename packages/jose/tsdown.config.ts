import { defineConfig } from "tsdown"
import { tsdownConfig } from "@aura-stack/tsdown-config"

export default defineConfig({
    ...tsdownConfig,
    entry: ["src/index.ts", "src/encrypt.ts", "src/sign.ts", "src/jose.ts", "src/deriveKey.ts", "src/crypto.ts"],
})
