import type { Request, RequestHandler, Response } from "express"
import type { AuthInstance, User } from "@aura-stack/auth"
import type { zod } from "@/identity/zod.ts"
import type { LocalsWithSession } from "@/lib/with-auth.ts"
import type { InferSchema, SchemaTypes } from "@aura-stack/auth/identity"
import type { Prettify, RemoveIndexSignature } from "@aura-stack/auth/types"

/**
 * The ExpressInstance type represents the shape of the object returned by the `createAuth`
 * function in the Express integration of Aura Auth. It was implemented due to errors related
 * to unportable types from the `createAuth` function.
 */
export interface ExpressInstance<
    DefaultUser extends User = User,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<DefaultUser, SignUpSchema> {
    toHandler: (req: Request, res: Response) => Promise<Response>
    withAuth: RequestHandler<any, any, any, any, LocalsWithSession<DefaultUser>>
}

/**
 * Infers the sign-up data type from an {@link ExpressInstance} config's `signUp.schema`. It supports
 * Zod, Valibot and ArkType schemas.
 *
 * > For TypeBox its recommended to use the `Static` utility type directly to infer the schema.
 *
 * @example
 * const auth = createAuth({
 *   oauth: [],
 *   signUp: {
 *     schema: z.object({
 *       username: z.string(),
 *       nickname: z.string(),
 *       password: z.string(),
 *     })
 *   }
 * })
 *
 * type SignUp = InferSignUp<typeof auth>
 */
export type InferSignUp<T> =
    T extends ExpressInstance<any, infer SignUpSchema> ? Prettify<RemoveIndexSignature<InferSchema<SignUpSchema>>> : never
