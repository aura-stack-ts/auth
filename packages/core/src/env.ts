// @ts-nocheck Ignore type errors for cross-runtime compatibility
/**
 * A runtime-agnostic environment variable proxy.
 * Checks multiple sources to ensure compatibility with Node, Bun, Deno, Vite, and Edge platforms.
 */
export const env = new Proxy({} as Record<string, string | undefined>, {
    get(_, prop: string) {
        if (typeof prop !== "string") return undefined
        try {
            if (typeof process !== "undefined" && process.env?.[prop]) {
                return process.env[prop]
            }
            if (typeof import.meta !== "undefined" && import.meta.env?.[prop]) {
                return import.meta.env[prop]
            }
            if (typeof Deno !== "undefined" && Deno.env?.get) {
                return Deno.env.get(prop)
            }
            if (typeof Bun !== "undefined" && Bun.env?.[prop]) {
                return Bun.env[prop]
            }
            return globalThis[prop] || undefined
        } catch {
            return undefined
        }
    },
})
