import crypto from "node:crypto"
import { EncryptJWT, jwtDecrypt } from "jose"
import { createSecret } from "@/secret.js"
import type { SecretInput } from "@/index.js"

export interface EncryptedPayload {
    token: string
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
    const secretKey = createSecret(secret)
    const jti = crypto.randomBytes(32).toString("base64")

    return new EncryptJWT({ token: payload })
        .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "JWT", cty: "JWT" })
        .setIssuedAt()
        .setNotBefore("0s")
        .setExpirationTime("15h")
        .setJti(jti)
        .encrypt(secretKey)
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
        const secretKey = createSecret(secret)
        const { payload } = await jwtDecrypt<EncryptedPayload>(token, secretKey)
        return payload.token
    } catch {
        throw new Error("Invalid JWE")
    }
}

/**
 * Creates a JWE (JSON Web Encryption) encrypter and decrypter. It implements the encryptJWE
 * and decryptJWE functions of the module.
 *
 * @param secret - Secret key used for encrypting and decrypting the JWE
 * @returns - encryptJWE and decryptJWE functions
 */
export const createJWE = (secret: SecretInput) => {
    const secretKey = createSecret(secret)

    return {
        encryptJWE: (payload: string) => encryptJWE(payload, secretKey),
        decryptJWE: (payload: string) => decryptJWE(payload, secretKey),
    }
}
