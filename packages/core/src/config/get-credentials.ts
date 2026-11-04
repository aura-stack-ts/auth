import { AuraAuthError } from "@/errors/aura-error.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

/**
 * @todo Add a type-safe way to validate the credentials hash and verify functions.
 * Currently, the type system does not enforce that both functions are provided together,
 * which can lead to runtime errors if only one is provided.
 */
export const getCredentialsConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    if (
        (config?.credentials?.hash && !config?.credentials?.verify) ||
        (!config?.credentials?.hash && config?.credentials?.verify)
    ) {
        throw new AuraAuthError({ code: "INVALID_CUSTOM_CREDENTIALS_HASH_OR_VERIFY_FUNCTION" })
    }
    return config?.credentials
}
