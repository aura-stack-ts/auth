import { toHandler } from "@/lib/handler.ts"
import { withAuth } from "@/lib/with-auth.ts"
import { type AuthConfig, createAuth as createAuthInstance } from "@aura-stack/auth"
import type { FromShapeToObject, Identities, SchemaTypes } from "@aura-stack/auth/identity"
import type { OakInstance } from "@/types/index.ts"

export const createAuth = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema>
): OakInstance<FromShapeToObject<Identity>, SignUpSchema> => {
    const auth = createAuthInstance<Identity, SignUpSchema>(config)
    return {
        ...auth,
        /**
         * Oak handler that bridges Aura Auth Web-API handlers.
         * Mount this on the `basePath` configured in `createAuth()` (default: `/api/auth`).
         *
         * @example
         * router.all("/api/auth/(.*)", auth.toHandler)
         */
        toHandler: toHandler<FromShapeToObject<Identity>, SignUpSchema>(auth),
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
        withAuth: withAuth<FromShapeToObject<Identity>, SignUpSchema>(auth),
    }
}
