import { defineConfig } from "tsup"
import { tsupConfig } from "@aura-stack/tsup-config"

export default defineConfig([
    {
        ...tsupConfig,
        entry: ["src", "!src/index.ts"],
        banner: {
            //js: `"use client"`,
        },
    },
])
