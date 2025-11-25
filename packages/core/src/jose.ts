import "dotenv/config"
import { createJWT, createJWS } from "@aura-stack/jose"
export type { JWTPayload } from "@aura-stack/jose/jose"

const secretKey = process.env.AURA_AUTH_SECRET!

export const { encodeJWT, decodeJWT } = createJWT(secretKey)

export const { signJWS, verifyJWS } = createJWS(secretKey)
