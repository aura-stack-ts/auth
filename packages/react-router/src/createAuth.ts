import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import { api } from "@/lib/api"
import type { zod } from "@aura-stack/react/identity/zod"
import type { AuthConfig } from "@aura-stack/react"
import type { EditableShape, ReactRouterInstance, ZodIdentitySchema } from "@/@types/index"
import type { FromShapeToObject, Identities, SchemaTypes } from "@aura-stack/react/identity"

export const createAuth = <
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = zod.ZodObject<any>,
>(
    config: AuthConfig<Identity, SignUpSchema>
): ReactRouterInstance<FromShapeToObject<Identity>, SignUpSchema> => {
    const auth = createAuthInstance<Identity, SignUpSchema>(config)
    return {
        /**
         * The core auth instance. It can be used to advanced use cases, such as creating custom behaviors.
         * For most use cases, the `api` property should be sufficient, as it provides a higher-level API for common authentication tasks.
         */
        core: auth,
        /**
         * Built-in API functions for server-side operations related to the auth flows.
         */
        api: api<FromShapeToObject<Identity>, SignUpSchema>(auth),
        /**
         * The handlers object contains the HTTP request handlers.
         */
        handlers: auth.handlers,
    }
}
