import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import { toHandler } from "@/pages/handler"
import type { AuthConfig } from "@aura-stack/react"
import type { Identities, SchemaTypes } from "@aura-stack/react/identity"

export const createAuth = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema>
) => {
    const auth = createAuthInstance<Identity, SignUpSchema>(config)

    return {
        ...auth,
        /**
         * The handlers object contains the HTTP request handlers.
         */
        toHandler: toHandler(auth.handlers),
    }
}
