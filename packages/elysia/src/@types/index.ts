import type { Identities } from "@/identity"
import type { zod } from "@/identity/zod"
import type { WithAuthContext } from "@/lib/with-auth"
import type {
    AuthInstance,
    EditableShape,
    FromShapeToObject,
    InferSchema,
    Prettify,
    RemoveIndexSignature,
    SchemaTypes,
    ZodIdentitySchema,
} from "@aura-stack/auth/types"
import type { Context } from "elysia"

export interface ElysiaInstance<
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
> extends AuthInstance<FromShapeToObject<Identity>, SignUpSchema> {
    toHandler: (context: Context) => Promise<Response>
    withAuth: (context: Context) => Promise<WithAuthContext<FromShapeToObject<Identity>>>
}

export type InferSignUp<T extends ElysiaInstance> =
    T extends ElysiaInstance<any, infer SignUpSchema> ? Prettify<RemoveIndexSignature<InferSchema<SignUpSchema>>> : never
