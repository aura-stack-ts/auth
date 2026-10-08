import type { NextApiRequest, NextApiResponse } from "next"
import type { zod } from "@aura-stack/react/identity/zod"
import type { NextAPI } from "@/@types/api"
import type {
    AuthInstance,
    Handlers,
    InferSchema,
    Prettify,
    RemoveIndexSignature,
    SchemaTypes,
    User,
    Wrap,
} from "@aura-stack/react/types"

/** Public type surface for `@aura-stack/next` (re-exports React/auth types plus Next-specific helpers). */
export type * from "@/@types/core"
export type * from "@/@types/api"

export type NextPagesInstance<
    DefaultUser extends User = User,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> = AuthInstance<DefaultUser, SignUpSchema> & {
    toHandler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
}

export type NextAppInstance<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>> = {
    core: AuthInstance<DefaultUser, SignUpSchema>
    api: NextAPI<DefaultUser, SignUpSchema>
    handlers: Handlers
}

export type NextInstance<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>> =
    | NextAppInstance<DefaultUser, SignUpSchema>
    | NextPagesInstance<DefaultUser, SignUpSchema>

/**
 * Infers the sign-up data type from an {@link NextInstance} config's `signUp.schema`. It supports
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
export type InferSignUp<T extends NextInstance> =
    T extends NextAppInstance<any, infer SignUpSchema>
        ? Prettify<Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>
        : T extends NextPagesInstance<any, infer SignUpSchema>
          ? Prettify<Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>
          : never
