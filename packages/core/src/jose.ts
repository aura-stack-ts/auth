import "dotenv/config"
import { createJWT, createJWS, createDeriveKey } from "@aura-stack/jose"
export type { JWTPayload } from "@aura-stack/jose/jose"

const secretKey = process.env.AURA_AUTH_SECRET!

const { derivedKey: derivedSessionKey } = createDeriveKey(secretKey, "session")
const { derivedKey: derivedCsrfTokenKey } = createDeriveKey(secretKey, "csrfToken")

export const { decodeJWT, encodeJWT } = createJWT(derivedSessionKey)
export const { signJWS, verifyJWS } = createJWS(derivedCsrfTokenKey)
