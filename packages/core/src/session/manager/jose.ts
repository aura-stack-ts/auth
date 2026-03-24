import { AuthInvalidConfigurationError } from "@/errors.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { JoseInstance, User, JWTConfig } from "@/@types/index.ts"

export type JWTManager<DefaultUser extends User = User> = {
    createToken(user: TypedJWTPayload<Partial<DefaultUser>>): Promise<string>
    verifyToken(token: string): Promise<TypedJWTPayload<DefaultUser>>
}

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
