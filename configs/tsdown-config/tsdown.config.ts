import type { UserConfig } from "tsdown"

/**
 * Tsdown base configuration used by Aura Auth packages
 */
export const tsdownConfig = {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    treeshake: true,
    fixedExtension: false,
    platform: "neutral",
    deps: {
        onlyBundle: false,
    },
} satisfies UserConfig
