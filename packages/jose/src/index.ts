/**
 * @module @aura-stack/jose
 */
import type { JWEHeaderParameters, JWTDecryptOptions, JWTHeaderParameters, JWTPayload, JWTVerifyOptions } from "jose"
import { getSecrets } from "@/secret.ts"
import { signJWS, verifyJWS } from "@/sign.ts"
import { isAuraJoseError } from "@/assert.ts"
import { JWTDecodingError, JWTEncodingError } from "@/errors.ts"
import { compactEncryptJWE, decryptCompactJWE } from "@/encrypt.ts"

export * from "@/sign.ts"
export * from "@/encrypt.ts"
export * from "@/deriveKey.ts"
export * from "@/secret.ts"
export * from "@/crypto.ts"

/**
 * Secret input can be:
 * - CryptoKey: W3C standard key object (works across all runtimes)
 * - Uint8Array: Raw bytes
 * - string: String that will be encoded to UTF-8
 */
export type SecretInput = Uint8Array | string | CryptoKey
export type DerivedKeyInput = { sign: SecretInput; encrypt: SecretInput }
export type Prettify<T> = { [K in keyof T]: T[K] } & {}
export type TypedJWTPayload<Payload extends JWTPayload> = JWTPayload & Payload

/**
 * JWT options for signin and encryption.
 */
export interface EncodeJWTOptions {
    sign?: JWTHeaderParameters
    encrypt?: JWEHeaderParameters
}

/**
 * Decoded JWT payload options for verification and decryption.
 */
export interface DecodeJWTOptions {
    verify: JWTVerifyOptions
    decrypt: JWTDecryptOptions
}

export interface CreateJWTOptions {
    encode: EncodeJWTOptions
    decode: DecodeJWTOptions
}

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
 * @param options - Optional algorithm configuration for signing and encryption
 * @returns Promise resolving to the signed and encrypted JWT string
 */
export const encodeJWT = async <Payload extends JWTPayload>(
    token: TypedJWTPayload<Partial<Payload>>,
    secret: SecretInput | DerivedKeyInput,
    options?: EncodeJWTOptions
) => {
    try {
        const { jweSecret, jwsSecret } = getSecrets(secret)
        const signed = await signJWS(token, jwsSecret, options?.sign)
        return await compactEncryptJWE(signed, jweSecret, options?.encrypt)
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
 * @param token - JWT string to decode
 * @param secret - Secret key used for both decrypting and verifying the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @param options - Optional algorithm configuration for decryption and verification
 */
export const decodeJWT = async <Payload extends JWTPayload>(
    token: string,
    secret: SecretInput | DerivedKeyInput,
    options?: DecodeJWTOptions
): Promise<TypedJWTPayload<Payload>> => {
    try {
        const { jweSecret, jwsSecret } = getSecrets(secret)
        const decrypted = await decryptCompactJWE(token, jweSecret, options?.decrypt)
        return await verifyJWS(decrypted, jwsSecret, options?.verify)
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
 * @param options - Optional algorithm configuration for signing and encryption
 * @returns JWT handler object with `signJWS/encryptJWE` and `verifyJWS/decryptJWE` methods
 */
export const createJWT = <Payload extends JWTPayload>(secret: SecretInput | DerivedKeyInput) => {
    return {
        encodeJWT: async <EncodePayload extends JWTPayload = Payload>(
            payload: TypedJWTPayload<Partial<EncodePayload>>,
            options?: EncodeJWTOptions
        ) => await encodeJWT<EncodePayload>(payload, secret, options),
        decodeJWT: async <DecodePayload extends JWTPayload = Payload>(token: string, options?: DecodeJWTOptions) =>
            await decodeJWT<DecodePayload>(token, secret, options),
    }
}
