import type { Context } from "elysia"
import type { WithAuthContext } from "@/lib/with-auth"
import type { zod } from "@aura-stack/auth/identity/zod"
import type { AuthInstance, InferSchema, Prettify, RemoveIndexSignature, SchemaTypes, User } from "@aura-stack/auth/types"

export interface ElysiaInstance<
    DefaultUser extends User = User,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<DefaultUser, SignUpSchema> {
    toHandler: (context: Context) => Promise<Response>
    withAuth: (context: Context) => Promise<WithAuthContext<DefaultUser>>
}

/**
 * Infers the sign-up data type from an {@link ElysiaInstance} config's `signUp.schema`. It supports
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
    T extends ElysiaInstance<any, infer SignUpSchema> ? Prettify<RemoveIndexSignature<InferSchema<SignUpSchema>>> : never
