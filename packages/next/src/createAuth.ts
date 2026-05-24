import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import type { AuthConfig, AuthInstance } from "@aura-stack/react"
import type { FromShapeToObject } from "@aura-stack/react/types"
import type { Identities } from "@aura-stack/react/identity"
import { api } from "@/lib/api"

export const createAuth = <Identity extends Identities>(config: AuthConfig<Identity>) => {
    const auth = createAuthInstance<Identity>(config)

    //const apiInstance = () => {
    //    /**
    //     * Pages Router can't use "next/headers", so we need to check if we're in a Pages Router
    //     * environment before trying to import the API functions.
    //     */
    //    if (!isPagesRouter()) {
    //        return (async () => {
    //            const api = await import("@/lib/api")
    //            return api.api<FromShapeToObject<Identity>>(auth)
    //        })()
    //    }
    //    return auth.api
    //}

    return {
        /**
         * The core auth instance. It can be used to advanced use cases, such as creating custom behaviors.
         * For most use cases, the `api` property should be sufficient, as it provides a higher-level API for common authentication tasks.
         */
        core: auth,
        /**
         * Built-in API functions for server-side operations related to the auth flows.
         */
        api: api<FromShapeToObject<Identity>>(auth),
        /**
         * The handlers object contains the HTTP request handlers.
         */
        handlers: auth.handlers,
    }
}
