import { createAuth as createAuthBasic, type AuthConfig } from "@aura-stack/auth"
import { toHandler } from "@/lib/handler"
import { withAuth } from "@/lib/with-auth"
import type { HonoInstance } from "@/@types/index"
import type { zod } from "@aura-stack/auth/identity/zod"
import type { EditableShape, ZodIdentitySchema } from "@aura-stack/auth/types"
import type { Identities, FromShapeToObject, SchemaTypes } from "@aura-stack/auth/identity"

export const createAuth = <
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
>(
    config: AuthConfig<Identity, SignUpSchema>
): HonoInstance<FromShapeToObject<Identity>, SignUpSchema> => {
    const auth = createAuthBasic<Identity, SignUpSchema>(config)

    return {
        ...auth,
        toHandler: toHandler(auth.handlers),
        withAuth: withAuth<FromShapeToObject<Identity>, SignUpSchema>(auth),
    }
}
