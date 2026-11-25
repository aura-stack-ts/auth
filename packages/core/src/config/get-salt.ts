import { getEnv } from "@/shared/utils/get-env.ts"
import { createSecret } from "@aura-stack/jose"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"

export const getSaltConfig = () => {
    const salt = getEnv("SALT")
    if (!salt) {
        throw new AuraAuthError({ code: "JOSE_INITIALIZATION_SALT_MISSING" })
    }
    try {
        createSecret(salt)
    } catch (cause) {
        throw new AuraAuthError({ code: "INVALID_SALT_SECRET_VALUE", cause })
    }
    return salt
}
