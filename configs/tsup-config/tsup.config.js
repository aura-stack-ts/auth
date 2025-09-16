/**
 * Tsup base configuration used by Aura Auth packages
 * @type {import("tsup").Options}
 */
export const tsupConfig = {
    entry: ["src"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
}
