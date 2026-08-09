import type { zod } from "@/identity/zod"
import type { EnvWithSession } from "@/lib/with-auth"
import type {
    EditableShape,
    ZodIdentitySchema,
    Identities,
    SchemaTypes,
    AuthInstance,
    FromShapeToObject,
    RemoveIndexSignature,
    InferSchema,
} from "@aura-stack/auth/types"
import type { Prettify } from "@aura-stack/jose"
import type { Context, MiddlewareHandler } from "hono"

export interface HonoInstance<
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<FromShapeToObject<Identity>, SignUpSchema> {
    toHandler: (ctx: Context) => Promise<any>
    withAuth: MiddlewareHandler<
        {
            Variables: EnvWithSession<FromShapeToObject<Identity>>
        },
        string,
        {},
        /**
         * @todo fix types type
         */
        any
    >
}

export type InferSignUp<T> =
    T extends HonoInstance<any, infer SignUpSchema> ? Prettify<RemoveIndexSignature<InferSchema<SignUpSchema>>> : never
