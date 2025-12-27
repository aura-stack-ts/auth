import crypto from "node:crypto"
import { EncryptJWT, jwtDecrypt } from "jose"
import { createSecret } from "@/secret.js"
import { isAuraJoseError, isFalsy } from "@/assert.js"
import { InvalidPayloadError, JWEDecryptionError } from "@/errors.js"
import type { SecretInput } from "@/index.js"

export interface EncryptedPayload {
    payload: string
}

/**
 * Encrypt a standard JWT token with the following claims:
 *  - alg: algorithm used to encrypt the JWT
 *  - enc: encryption method used
 *  - typ: type of the token
 *  - cty: content type of the token
 *
 * @param payload - Payload data information to encrypt the JWT
 * @param secret - Secret key to encrypt the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @returns Encrypted JWT string
 */
export const encryptJWE = async (payload: string, secret: SecretInput) => {
    try {
        if (isFalsy(payload)) {
            throw new InvalidPayloadError("The payload must be a non-empty string")
        }
        const secretKey = createSecret(secret)
        const jti = crypto.randomBytes(32).toString("base64")

        return new EncryptJWT({ payload })
            .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "JWT", cty: "JWT" })
            .setIssuedAt()
            .setNotBefore("0s")
            .setExpirationTime("15d")
            .setJti(jti)
            .encrypt(secretKey)
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWEDecryptionError("JWE encryption failed", { cause: error })
    }
}

/**
 * Decrypt a JWE token and return the payload if valid.
 *
 * @param token - Encrypted JWT string to decrypt
 * @param secret - Secret key to decrypt the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @returns Decrypted JWT payload string
 */
export const decryptJWE = async (token: string, secret: SecretInput) => {
    try {
        if (isFalsy(token)) {
            throw new InvalidPayloadError("The token must be a non-empty string")
        }
        const secretKey = createSecret(secret)
        const { payload } = await jwtDecrypt<EncryptedPayload>(token, secretKey)
        return payload.payload
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWEDecryptionError("JWE decryption verification failed", { cause: error })
    }
}

/**
 * Creates a `JWE (JSON Web Encryption)` encrypter and decrypter. It implements the `encryptJWE`
 * and `decryptJWE` functions of the module.
 *
 * @param secret - Secret key used for encrypting and decrypting the JWE
 * @returns encryptJWE and decryptJWE functions
 */
export const createJWE = (secret: SecretInput) => {
    return {
        encryptJWE: (payload: string) => encryptJWE(payload, secret),
        decryptJWE: (payload: string) => decryptJWE(payload, secret),
    }
}
