/**
 * @aura-stack/session
 */
import { JWTPayload, CryptoKey, KeyObject } from "jose"
import { createJWE } from "./encrypt.js"
import { createJWS } from "./sign.js"

export * from "@/sign.js"
export * from "@/encrypt.js"

export type SecretInput = CryptoKey | KeyObject | string | Uint8Array

/**
 * Encode a JWT signed and encrypted token. The token first signed using JWS
 * and then encrypted using JWE to ensure both integrity and confidentiality.
 *
 * Based on the RFC 7519 standard
 * - Official RFC: https://datatracker.ietf.org/doc/html/rfc7519
 * - Nested JWTs should be signed and then encrypted: https://datatracker.ietf.org/doc/html/rfc7519#section-5.2
 * - Ensuring the integrity and confidentiality of the claims: https://datatracker.ietf.org/doc/html/rfc7519#section-11.2
 *
 * @param token - Payload data to encode in the JWT
 * @param secret - Secret key used for both signing and encrypting the JWT
 * @returns Promise resolving to the signed and encrypted JWT string
 */
export const encode = async (token: JWTPayload, secret: SecretInput) => {
    try {
        const { signJWS } = createJWS(secret)
        const { encryptJWE } = createJWE(secret)
        const signed = await signJWS(token)
        return await encryptJWE(signed)
    } catch (error) {
        throw new Error("Failed to encode JWT")
    }
}

/**
 * Decode a JWT signed and encrypted token. The token is first decrypted using JWE
 * and then verified using JWS to ensure both confidentiality and integrity.
 * Based on the RFC 7519 standard
 * - Official RFC: https://datatracker.ietf.org/doc/html/rfc7519
 * - Validating a JWT: https://datatracker.ietf.org/doc/html/rfc7519#section-7.2
 * @param token
 * @param secret
 * @returns
 */
export const decode = async (token: string, secret: SecretInput) => {
    try {
        const { verifyJWS } = createJWS(secret)
        const { decryptJWE } = createJWE(secret)
        const decrypted = await decryptJWE(token)
        return await verifyJWS(decrypted)
    } catch {
        throw new Error("Failed to decode JWT")
    }
}

export const createJWT = async (secret: SecretInput) => {
    return {
        encode: async (payload: JWTPayload) => encode(payload, secret),
        decode: async (token: string) => decode(token, secret),
    }
}
