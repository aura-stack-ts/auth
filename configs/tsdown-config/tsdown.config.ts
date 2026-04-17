import type { UserConfig } from "tsdown"

/**
 * Tsdown base configuration used by Aura Auth packages
 */
export const tsdownConfig: UserConfig = {
    entry: ["src"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: true,
    fixedExtension: false,
    deps: {
        onlyBundle: false,
    },
}
