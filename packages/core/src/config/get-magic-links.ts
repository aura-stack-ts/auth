import { AuraAuthError } from "@/errors/aura-error.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getMagicLinkConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    const expiresIn = config?.magicLinks?.expiresIn
    if (expiresIn && (expiresIn < 0 || !Number.isFinite(expiresIn))) {
        throw new AuraAuthError({ code: "INVALID_MAGIC_LINK_EXPIRES_IN_VALUE" })
    }
    return config?.magicLinks
}
