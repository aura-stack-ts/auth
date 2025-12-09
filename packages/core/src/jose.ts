import "dotenv/config"
import { createJWT, createJWS, createDeriveKey } from "@aura-stack/jose"
export type { JWTPayload } from "@aura-stack/jose/jose"

export const createJoseInstance = (secret?: string) => {
    secret ??= process.env.AURA_AUTH_SECRET!
    const { derivedKey: derivedSessionKey } = createDeriveKey(secret, "session")
    const { derivedKey: derivedCsrfTokenKey } = createDeriveKey(secret, "csrfToken")

    const { decodeJWT, encodeJWT } = createJWT(derivedSessionKey)
    const { signJWS, verifyJWS } = createJWS(derivedCsrfTokenKey)

    return {
        decodeJWT,
        encodeJWT,
        signJWS,
        verifyJWS,
    }
}
