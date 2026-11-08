import { AuraAuthError } from "@/errors/aura-error.ts"
import type { JoseManager } from "@/@types/internal.ts"
import type { JoseInstance, User, JWTConfig } from "@/@types/index.ts"

export const createJoseManager = <DefaultUser extends User = User>(
    config: JWTConfig | undefined,
    jose: JoseInstance<DefaultUser>
): JoseManager<DefaultUser> => {
    const mode = config?.mode ?? "sealed"

    if (!["sealed", "signed", "encrypted"].includes(mode)) {
        throw new AuraAuthError({ code: "JWT_INVALID_MODE" })
    }

    return {
        createToken: mode === "sealed" ? jose.encodeJWT : mode === "signed" ? jose.signJWS : jose.encryptJWE,
        verifyToken: mode === "sealed" ? jose.decodeJWT : mode === "signed" ? jose.verifyJWS : jose.decryptJWE,
    }
}
