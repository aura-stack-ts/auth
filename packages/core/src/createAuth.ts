import { createAuthInstance } from "@/router/router.ts"
import type { ZodObject } from "zod"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { AuthConfig, AuthInstance, FromShapeToObject, EditableShape, ZodIdentitySchema } from "@/@types/index.ts"

/**
 * Creates the authentication instance with the configuration provided for OAuth provider.
 * > NOTE: The handlers returned by this function should be used in the server to handle the authentication routes
 * and within the `/auth` base path
 *
 * @param config - Authentication configuration including OAuth provider
 * @returns Authentication instance with handlers to be used in the server
 * @example
 * const auth = createAuth({
 *   oauth: ["github"],
 *   session: {
 *     strategy: "jwt",
 *   }
 * })
 */

export const createAuth = <
    Identity extends Identities = EditableShape<ZodIdentitySchema>,
    SignUpSchema extends SchemaTypes = ZodObject<any>,
>(
    config: AuthConfig<Identity, SignUpSchema>
) => {
    const auth = createAuthInstance<Identity, SignUpSchema>(config) as unknown as AuthInstance<
        FromShapeToObject<Identity>,
        SignUpSchema
    >
    auth.handlers.ALL = auth.handlers.handle
    return auth
}
