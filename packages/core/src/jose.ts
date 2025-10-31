import { createJWT } from "@aura-stack/jose"
export type { JWTPayload } from "@aura-stack/jose/jose"

export const { encodeJWT, decodeJWT } = await createJWT(process.env.AURA_AUTH_SECRET!)
