import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import { toHandler } from "@/pages/handler"
import type { zod } from "@/identity/zod"
import type { AuthConfig } from "@aura-stack/react"
import type { EditableShape, NextPagesInstance, ZodIdentitySchema } from "@/@types"
import type { FromShapeToObject, Identities, SchemaTypes } from "@aura-stack/react/identity"

export const createAuth = <
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
>(
    config: AuthConfig<Identity, SignUpSchema>
): NextPagesInstance<FromShapeToObject<Identity>, SignUpSchema> => {
    const auth = createAuthInstance<Identity, SignUpSchema>(config)

    return {
        ...auth,
        /**
         * The handlers object contains the HTTP request handlers.
         */
        toHandler: toHandler<FromShapeToObject<Identity>, SignUpSchema>(auth),
    }
}
