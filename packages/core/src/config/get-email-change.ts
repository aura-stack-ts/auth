import { AuraAuthError } from "@/errors/aura-error.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getEmailChangeConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    const expiresIn = config?.emailChange?.expiresIn
    if (expiresIn !== undefined && (!Number.isInteger(expiresIn) || expiresIn <= 0)) {
        throw new AuraAuthError({ code: "INVALID_EMAIL_CHANGE_EXPIRES_IN_VALUE" })
    }
    return config?.emailChange
}
