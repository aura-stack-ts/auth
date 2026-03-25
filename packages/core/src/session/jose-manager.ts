import { AuthInvalidConfigurationError } from "@/shared/errors.ts"
import type { JoseInstance, User, JWTConfig, JWTManager } from "@/@types/index.ts"

export const createJoseManager = <DefaultUser extends User = User>(
    config: JWTConfig | undefined,
    jose: JoseInstance<DefaultUser>
): JWTManager<DefaultUser> => {
    const mode = config?.mode ?? "sealed"

    if (!["sealed", "signed", "encrypted"].includes(mode)) {
        throw new AuthInvalidConfigurationError(
            `[auth] invalid JWT mode "${mode}". Valid options are: "sealed", "signed", "encrypted".`
        )
    }

    return {
        createToken: mode === "sealed" ? jose.encodeJWT : mode === "signed" ? jose.signJWS : jose.encryptJWE,
        verifyToken: mode === "sealed" ? jose.decodeJWT : mode === "signed" ? jose.verifyJWS : jose.decryptJWE,
    }
}
