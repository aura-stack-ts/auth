import { toHandler } from "@/lib/handler.ts"
import { withAuth } from "@/lib/with-auth.ts"
import { type AuthConfig, createAuth as createAuthInstance } from "@aura-stack/auth"
import type { Identities } from "@aura-stack/auth/identity"

export const createAuth = <Identity extends Identities>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)
    return {
        ...auth,
        /**
         * Oak handler that bridges Aura Auth Web-API handlers.
         * Mount this on the `basePath` configured in `createAuth()` (default: `/api/auth`).
         *
         * @example
         * router.all("/api/auth/(.*)", auth.toHandler)
         */
        toHandler: toHandler(auth),
        /**
         * Middleware to be used with Oak's `.use()` to inject the session into the context.
         *
         * @example
         * router.get("/api/protected", auth.withAuth, (ctx) => {
         *     ctx.response.body = {
         *         message: "You have access to this protected resource.",
         *         session: ctx.state.session,
         *     }
         * })
         */
        withAuth: withAuth(auth),
    }
}
