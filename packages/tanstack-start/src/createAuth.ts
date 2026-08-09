import { api } from "@/lib/api.functions"
import { createAuth as createAuthInstance } from "@aura-stack/react/server"
import type { AuthConfig } from "@aura-stack/react/types"
import type { zod } from "@aura-stack/react/identity/zod"
import type { TanstackStartInstance } from "@/@types/index"
import type { FromShapeToObject, Identities, SchemaTypes } from "@aura-stack/react/identity"
import { createServerFn } from "@tanstack/react-start"

/**
 * Create an auth instance built on top of the Aura Stack Auth library,
 * providing a higher-level API for common authentication tasks.
 *
 * @param config - The auth configuration including OAuth providers, credentials, and session strategy.
 * @returns An auth instance with a higher-level API for common authentication tasks.
 *
 * @example
 * import { createAuth } from "@aura-stack/tanstack-start"
 *
 * const auth = createAuth({
 *   oauth: ["github", "google"],
 *   credentials: {
 *     authorize: async (credentials) => {
 *       // Custom authorization logic
 *     }
 *   }
 * })
 */
export const createAuth = <Identity extends Identities, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>(
    config: AuthConfig<Identity, SignUpSchema>
): TanstackStartInstance<Identity, SignUpSchema> => {
    const auth = createAuthInstance<Identity, SignUpSchema>(config)

    const __unstable_fn = createServerFn({ method: "GET" }).handler(async () => {
        console.log("[server] __unstable_fn called")
        return "This is an unstable function. It is not intended for production use and may be removed or changed in future versions."
    })

    return {
        __unstable_fn,
        /**
         * The core auth instance. It can be used to advanced use cases, such as creating custom behaviors.
         * For most use cases, the `api` property should be sufficient, as it provides a higher-level API for common authentication tasks.
         */
        core: auth,
        /**
         * Built-in API functions for server-side operations related to the auth flows.
         * These functions can be used in server functions to handle authentication requests.
         * They automatically handle request headers and provide a simplified interface for common auth operations.
         */
        api: api<FromShapeToObject<Identity>, SignUpSchema>(auth),
        /**
         * The handlers object contains the HTTP request handlers.
         */
        handlers: auth.handlers,
    }
}
