import type { Request, RequestHandler, Response } from "express"
import type { AuthInstance } from "@aura-stack/auth"
import type { LocalsWithSession } from "@/lib/with-auth.ts"
import type { FromShapeToObject, Identities } from "@aura-stack/auth/identity"

/**
 * The ExpressInstance type represents the shape of the object returned by the `createAuth`
 * function in the Express integration of Aura Auth. It was implemented due to errors related
 * to unportable types from the `createAuth` function.
 */
export type ExpressInstance<Identity extends Identities = Identities> = AuthInstance<FromShapeToObject<Identity>> & {
    toHandler: (req: Request, res: Response) => Promise<Response>
    withAuth: RequestHandler<any, any, any, any, LocalsWithSession<FromShapeToObject<Identity>>>
}
