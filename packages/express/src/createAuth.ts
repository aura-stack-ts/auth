import {
    createAuth as createBasicAuth,
    type EditableShape,
    type ShapeToObject,
    type UserShape,
    type AuthConfig,
} from "@aura-stack/auth"
import { withAuth } from "@/lib/with-auth.ts"
import { toExpressHandler } from "@/lib/handler.ts"
import type { Request, Response } from "express"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createBasicAuth<Identity>(config)
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
        withAuth: withAuth<ShapeToObject<Identity>>(auth),
    }
}
