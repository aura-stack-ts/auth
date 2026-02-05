/**
 * @module @aura-stack/jose
 */
import { JWTPayload } from "jose"
import { createJWS } from "@/sign.js"
import { getSecrets } from "@/secret.js"
import { createJWE } from "@/encrypt.js"
import { isAuraJoseError } from "@/assert.js"
import { JWTDecodingError, JWTEncodingError } from "./errors.js"
import type { KeyObject } from "crypto"

export * from "@/sign.js"
export * from "@/encrypt.js"
export * from "@/deriveKey.js"
export * from "@/secret.js"

export type SecretInput = KeyObject | Uint8Array | string
export type DerivedKeyInput = { jws: SecretInput; jwe: SecretInput }

/**
 * Encode a JWT signed and encrypted token. The token first signed using JWS
 * and then encrypted using JWE to ensure both integrity and confidentiality.
 * It implements the `signJWS` and `encryptJWE` functions of the module.
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
export const encodeJWT = async (token: JWTPayload, secret: SecretInput | DerivedKeyInput) => {
    try {
        const { jweSecret, jwsSecret } = getSecrets(secret)
        const { signJWS } = createJWS(jwsSecret)
        const { encryptJWE } = createJWE(jweSecret)
        const signed = await signJWS(token)
        return await encryptJWE(signed)
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWTEncodingError("JWT encoding failed", { cause: error })
    }
}

/**
 * Decode a JWT signed and encrypted token. The token is first decrypted using JWE
 * and then verified using JWS to ensure both confidentiality and integrity. It
 * implements the `decryptJWE` and `verifyJWS` functions of the module.
 *
 * Based on the RFC 7519 standard
 * - Official RFC: https://datatracker.ietf.org/doc/html/rfc7519
 * - Validating a JWT: https://datatracker.ietf.org/doc/html/rfc7519#section-7.2
 * @param token
 * @param secret
 * @returns
 */
export const decodeJWT = async (token: string, secret: SecretInput | DerivedKeyInput) => {
    try {
        const { jweSecret, jwsSecret } = getSecrets(secret)
        const { verifyJWS } = createJWS(jwsSecret)
        const { decryptJWE } = createJWE(jweSecret)
        const decrypted = await decryptJWE(token)
        return await verifyJWS(decrypted)
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWTDecodingError("JWT decoding failed", { cause: error })
    }
}

/**
 * Create a JWT handler with encode and decode methods to `signJWS/encryptJWE` and `verifyJWS/decryptJWE`
 * JWT tokens. The JWTs are signed and verified using JWS and encrypted and decrypted using JWE. It
 * implements the `signJWS`, `verifyJWS`, `encryptJWE` and `decryptJWE` functions of the module.
 *
 * @param secret - Secret key used for signing, verifying, encrypting and decrypting the JWT
 * @returns JWT handler object with `signJWS/encryptJWE` and `verifyJWS/decryptJWE` methods
 */
export const createJWT = (secret: SecretInput | DerivedKeyInput) => {
    return {
        encodeJWT: async (payload: JWTPayload) => encodeJWT(payload, secret),
        decodeJWT: async (token: string) => decodeJWT(token, secret),
    }
}
