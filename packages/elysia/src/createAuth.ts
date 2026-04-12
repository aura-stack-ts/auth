import { createAuth as createAuthBasic, type AuthConfig } from "@aura-stack/auth"
import { toHandler } from "@/lib/handler"
import { withAuth } from "@/lib/with-auth"
import type { ShapeToObject, EditableShape, UserShape } from "@aura-stack/auth/identity"

/**
 * Creates an Aura Auth instance with Elysia-specific utilities.
 */
export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthBasic<Identity>(config)

    return {
        ...auth,
        /**
         * Elysia handler that bridges Aura Auth Web-API handlers.
         * Mount this on the `basePath` configured in `createAuth()` (default: `/api/auth`).
         *
         * @example
         * app.all("/api/auth/*", auth.toHandler)
         */
        toHandler: toHandler(auth.handlers),
        /**
         * Utility to be used with Elysia's `.derive()` or `.resolve()` to inject the session into the context.
         *
         * @example
         * app.derive(auth.withAuth).get("/me", ({ session }) => session)
         */
        withAuth: withAuth<ShapeToObject<Identity>>(auth),
    }
}
