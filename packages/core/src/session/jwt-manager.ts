import type { TypedJWTPayload } from "@aura-stack/jose"
import type { JoseInstance, User, JWTConfig } from "@/@types/index.ts"

export type JwtManager = {
    createToken(user: TypedJWTPayload<Partial<User>>): Promise<string>
    verifyToken(token: string): Promise<TypedJWTPayload<User>>
}

export const createJWTManager = (config: JWTConfig, jose: JoseInstance): JwtManager => {
    const mode = config?.mode ?? "sealed"

    return {
        createToken: mode === "sealed" ? jose.encodeJWT : mode === "signed" ? jose.signJWS : jose.encryptJWE,
        verifyToken: mode === "sealed" ? jose.decodeJWT : mode === "signed" ? jose.verifyJWS : jose.decryptJWE,
    }
}
