import type { Context, MiddlewareHandler } from "hono"
import type { zod } from "@aura-stack/auth/identity/zod"
import type { Prettify } from "@aura-stack/jose"
import type { EnvWithSession } from "@/lib/with-auth"
import type { SchemaTypes, AuthInstance, RemoveIndexSignature, InferSchema, User } from "@aura-stack/auth/types"

export type * from "@aura-stack/auth/types"

export interface HonoInstance<
    DefaultUser extends User = User,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<DefaultUser, SignUpSchema> {
    toHandler: (ctx: Context) => Promise<any>
    withAuth: MiddlewareHandler<
        {
            Variables: EnvWithSession<DefaultUser>
        },
        string,
        {},
        /**
         * @todo fix types type
         */
        any
    >
}

/**
 * Infers the sign-up data type from an {@link HonoInstance} config's `signUp.schema`. It supports
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
    T extends HonoInstance<any, infer SignUpSchema> ? Prettify<RemoveIndexSignature<InferSchema<SignUpSchema>>> : never
