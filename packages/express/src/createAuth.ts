import { createAuth as createBasicAuth, type AuthConfig } from "@aura-stack/auth"
import { withAuth } from "@/lib/with-auth.ts"
import { toExpressHandler } from "@/lib/handler.ts"
import type { Request, Response } from "express"
import type { ExpressInstance } from "@/@types/index.ts"
import type { Identities, FromShapeToObject, SchemaTypes } from "@aura-stack/auth/identity"

export const createAuth = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema>
): ExpressInstance<Identity> => {
    const auth = createBasicAuth<Identity, SignUpSchema>(config)
    return {
        ...auth,
        /**
         * Express middleware that bridges Aura Auth Web-API handlers to Express.
         * Mount this on the `basePath` configured in `createAuth()` (default: `/api/auth`).
         */
        toHandler: (req: Request, res: Response) => toExpressHandler(auth.handlers, req, res),
        /**
         * Middleware that retrieves the session and attaches it to `res.locals.session`.
         */
        withAuth: withAuth<FromShapeToObject<Identity>>(auth),
    }
}
