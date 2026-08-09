import type { Request, RequestHandler, Response } from "express"
import type { AuthInstance } from "@aura-stack/auth"
import type { zod } from "@/identity/zod.ts"
import type { LocalsWithSession } from "@/lib/with-auth.ts"
import type { FromShapeToObject, Identities, InferSchema, SchemaTypes } from "@aura-stack/auth/identity"
import type { EditableShape, Prettify, RemoveIndexSignature, ZodIdentitySchema } from "@aura-stack/auth/types"

/**
 * The ExpressInstance type represents the shape of the object returned by the `createAuth`
 * function in the Express integration of Aura Auth. It was implemented due to errors related
 * to unportable types from the `createAuth` function.
 */
export interface ExpressInstance<
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<FromShapeToObject<Identity>, SignUpSchema> {
    toHandler: (req: Request, res: Response) => Promise<Response>
    withAuth: RequestHandler<any, any, any, any, LocalsWithSession<FromShapeToObject<Identity>>>
}

export type InferSignUp<T> =
    T extends ExpressInstance<any, infer SignUpSchema> ? Prettify<RemoveIndexSignature<InferSchema<SignUpSchema>>> : never
