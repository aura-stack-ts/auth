import "dotenv/config"
import { createJWT } from "@aura-stack/jose"
export type { JWTPayload } from "@aura-stack/jose/jose"

export const { encodeJWT, decodeJWT } = createJWT(process.env.AURA_AUTH_SECRET!)
