import { createAuth as createBasicAuth, type AuthConfig } from "@aura-stack/auth"
import { withAuth } from "@/lib/with-auth.ts"
import { toExpressHandler } from "@/lib/handler.ts"
import type { Request, Response } from "express"
import type { zod } from "@/identity/zod.ts"
import type { ExpressInstance } from "@/@types/index.ts"
import type { EditableShape, ZodIdentitySchema } from "@aura-stack/auth/types"
import type { Identities, FromShapeToObject, SchemaTypes } from "@aura-stack/auth/identity"

export const createAuth = <
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
>(
    config: AuthConfig<Identity, SignUpSchema>
): ExpressInstance<FromShapeToObject<Identity>, SignUpSchema> => {
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
        withAuth: withAuth<FromShapeToObject<Identity>, SignUpSchema>(auth),
    }
}
