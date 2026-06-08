import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import { toHandler } from "@/pages/handler"
import type { AuthConfig } from "@aura-stack/react"
import type { Identities } from "@aura-stack/react/identity"

export const createAuth = <Identity extends Identities>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)

    return {
        ...auth,
        /**
         * The handlers object contains the HTTP request handlers.
         */
        toHandler: toHandler(auth.handlers),
    }
}
