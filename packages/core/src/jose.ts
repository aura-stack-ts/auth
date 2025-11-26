import "dotenv/config"
import { createJWT, createJWS, createDeriveKey } from "@aura-stack/jose"
export type { JWTPayload } from "@aura-stack/jose/jose"

const secretKey = process.env.AURA_AUTH_SECRET!

let jwtInstance: ReturnType<typeof createJWT> | null = null
let jwsInstance: ReturnType<typeof createJWS> | null = null

/**
 * in ES2020 modules, is not allowed to have top-level await, so we create the instances lazily
 * and cache them for future use. as well, cmjs modules do not support top-level await either.
 */
const createJoseInstance = async () => {
    if (jwtInstance && jwsInstance) {
        return { jwtInstance, jwsInstance }
    }

    const { derivedKey: derivedSessionKey } = await createDeriveKey(secretKey, "session")
    const { derivedKey: derivedCsrfTokenKey } = await createDeriveKey(secretKey, "csrfToken")

    jwtInstance = createJWT(derivedSessionKey)
    jwsInstance = createJWS(derivedCsrfTokenKey)

    return { jwtInstance, jwsInstance }
}

export const encodeJWT = async (...args: Parameters<ReturnType<typeof createJWT>["encodeJWT"]>) => {
    const { jwtInstance } = await createJoseInstance()
    return jwtInstance.encodeJWT(...args)
}

export const decodeJWT = async (...args: Parameters<ReturnType<typeof createJWT>["decodeJWT"]>) => {
    const { jwtInstance } = await createJoseInstance()
    return jwtInstance.decodeJWT(...args)
}

export const signJWS = async (...args: Parameters<ReturnType<typeof createJWS>["signJWS"]>) => {
    const { jwsInstance } = await createJoseInstance()
    return jwsInstance.signJWS(...args)
}

export const verifyJWS = async (...args: Parameters<ReturnType<typeof createJWS>["verifyJWS"]>) => {
    const { jwsInstance } = await createJoseInstance()
    return jwsInstance.verifyJWS(...args)
}
