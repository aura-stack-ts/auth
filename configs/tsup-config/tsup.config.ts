import { Options } from "tsup"

/**
 * Tsup base configuration used by Aura Auth packages
 */
export const tsupConfig: Options = {
    entry: ["src"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
}
