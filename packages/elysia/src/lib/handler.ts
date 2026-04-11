import type { Context } from "elysia"
import type { AuthInstance } from "@aura-stack/auth"

/**
 * Bridges Elysia's context to Aura Auth's core handlers.
 * Expects to be mounted directly on an Elysia endpoint.
 *
 * @example
 * app.all("/api/auth/*", auth.toHandler)
 */
export const toHandler =
    (handlers: AuthInstance["handlers"]) =>
    async ({ request }: Context) => {
        return await handlers.ALL(request)
    }
