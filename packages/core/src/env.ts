// @ts-nocheck Ignore type errors for cross-runtime compatibility
/**
 * A runtime-agnostic environment variable proxy.
 * Checks multiple sources to ensure compatibility with Node, Bun, Deno, Vite, and Edge platforms.
 */
export const env = new Proxy({} as Record<string, string | undefined>, {
    get(_, prop: string) {
        if (typeof prop !== "string") return undefined

        const hasProperty = (process: Record<string, unknown>) => {
            return process && Object.prototype.hasOwnProperty.call(process, prop)
        }

        try {
            if (typeof process !== "undefined" && hasProperty(process.env)) {
                return process.env[prop]
            }
            if (typeof import.meta !== "undefined" && hasProperty(import.meta.env)) {
                return import.meta.env[prop]
            }
            if (typeof Deno !== "undefined" && Deno.env?.get) {
                return Deno.env.get(prop)
            }
            if (typeof Bun !== "undefined" && hasProperty(Bun.env)) {
                return Bun.env[prop]
            }
            const globalValue = (globalThis as Record<string, unknown>)[prop]
            return typeof globalValue === "string" ? globalValue : undefined
        } catch {
            return undefined
        }
    },
})
