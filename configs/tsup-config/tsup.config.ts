import type { Options } from "tsup"
import type { UserConfig } from "tsdown"

/**
 * Tsup base configuration used by Aura Auth packages
 */
export const tsupConfig: Options = {
    entry: ["src"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
}

export const tsdownConfig: UserConfig = {
    entry: ["src"],
    format: ["esm", "cjs"],
}
