import { AuthInvalidConfigurationError } from "@/errors.ts"
import type { TypedJWTPayload } from "@aura-stack/jose"
import type { JoseInstance, User, JWTConfig } from "@/@types/index.ts"

export type JWTManager = {
    createToken(user: TypedJWTPayload<Partial<User>>): Promise<string>
    verifyToken(token: string): Promise<TypedJWTPayload<User>>
}

export const createJWTManager = (config: JWTConfig | undefined, jose: JoseInstance): JWTManager => {
    const mode = config?.mode ?? "sealed"

    if(!["sealed", "signed", "encrypted"].includes(mode)) {
        throw new AuthInvalidConfigurationError(`[auth] invalid JWT mode "${mode}". Valid options are: "sealed", "signed", "encrypted".`)
    }

    return {
        createToken: mode === "sealed" ? jose.encodeJWT : mode === "signed" ? jose.signJWS : jose.encryptJWE,
        verifyToken: mode === "sealed" ? jose.decodeJWT : mode === "signed" ? jose.verifyJWS : jose.decryptJWE,
    }
}
