import {
    base64url,
    EncryptJWT,
    jwtDecrypt,
    JWTPayload,
    compactDecrypt,
    CompactEncrypt,
    type JWEHeaderParameters,
    type JWTDecryptOptions,
    type DecryptOptions,
} from "jose"
import { createSecret } from "@/secret.ts"
import { decoder, encoder, getRandomBytes } from "@/crypto.ts"
import { isAuraJoseError, isCryptoKeyPair, isFalsy } from "@/assert.ts"
import { InvalidPayloadError, JWEDecryptionError, JWEEncryptionError } from "@/errors.ts"
import type { SecretInput, TypedJWTPayload } from "@/index.ts"

export type { JWTDecryptOptions, JWEHeaderParameters, DecryptOptions } from "jose"

/**
 * Encrypt a standard JWT token with the following claims:
 *  - alg: algorithm used to encrypt the JWT
 *  - enc: encryption method used
 *  - typ: type of the token
 *  - cty: content type of the token
 *
 * @param payload - Payload data information to encrypt the JWT
 * @param secret - Secret key to encrypt the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @param options - Optional encryption options (e.g. algorithm, encryption method)
 * @returns Encrypted JWT string
 */
export const encryptJWE = async <Payload extends JWTPayload>(
    payload: TypedJWTPayload<Partial<Payload>>,
    secret: SecretInput,
    options?: JWEHeaderParameters
): Promise<string> => {
    try {
        if (isFalsy(payload)) {
            throw new InvalidPayloadError("The payload must be a non-empty string")
        }
        const secretKey = createSecret(secret)
        const jti = base64url.encode(getRandomBytes(32))

        return await new EncryptJWT(payload)
            .setProtectedHeader({ alg: "dir", enc: "A256GCM", cty: "JWT", typ: "JWT", ...options })
            .setIssuedAt()
            .setNotBefore(payload?.nbf ?? "0s")
            .setExpirationTime(payload?.exp ?? "15d")
            .setJti(jti)
            .encrypt(secretKey)
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWEEncryptionError("JWE encryption failed", { cause: error })
    }
}

/**
 * Encrypt a standard JWT token using compact serialization.
 * @param payload - Payload data information to encrypt the JWT
 * @param secret - Secret key to encrypt the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @param options - Optional encryption options (e.g. algorithm, encryption method)
 * @returns Encrypted JWT string in compact serialization format
 */
export const compactEncryptJWE = async (payload: string, secret: SecretInput, options?: JWEHeaderParameters) => {
    try {
        if (isFalsy(payload)) {
            throw new InvalidPayloadError("The payload must be a non-empty string")
        }
        const secretKey = createSecret(secret)
        return await new CompactEncrypt(encoder.encode(payload))
            .setProtectedHeader({ alg: "dir", enc: "A256GCM", cty: "JWT", typ: "JWT", ...options })
            .encrypt(secretKey)
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWEEncryptionError("JWE encryption failed", { cause: error })
    }
}

/**
 * Decrypt a JWE token and return the payload if valid.
 *
 * @param token - Encrypted JWT string to decrypt
 * @param secret - Secret key to decrypt the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @param options - Additional JWT decryption options
 * @returns Decrypted JWT payload string
 */
export const decryptJWE = async <Payload extends JWTPayload>(
    token: string,
    secret: SecretInput,
    options?: JWTDecryptOptions
): Promise<TypedJWTPayload<Payload>> => {
    try {
        if (isFalsy(token)) {
            throw new InvalidPayloadError("The token must be a non-empty string")
        }
        const secretKey = createSecret(secret)
        const { payload } = await jwtDecrypt(token, secretKey, {
            keyManagementAlgorithms: ["dir"],
            contentEncryptionAlgorithms: ["A256GCM"],
            ...options,
        })
        return payload as TypedJWTPayload<Payload>
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWEDecryptionError("JWE decryption verification failed", { cause: error })
    }
}

/**
 * Decrypt a JWE token in compact serialization format and return the payload if valid.
 *
 * @param token - Encrypted JWT string in compact serialization format to decrypt
 * @param secret  - Secret key to decrypt the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @param options - Additional JWT decryption options
 * @returns Decrypted JWT payload string
 */
export const decryptCompactJWE = async (token: string, secret: SecretInput, options?: DecryptOptions) => {
    try {
        if (isFalsy(token)) {
            throw new InvalidPayloadError("The token must be a non-empty string")
        }
        const secretKey = createSecret(secret)

        const { plaintext } = await compactDecrypt(token, secretKey, {
            keyManagementAlgorithms: ["dir"],
            contentEncryptionAlgorithms: ["A256GCM"],
            ...options,
        })
        return decoder.decode(plaintext)
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
export const createJWE = <Payload extends JWTPayload>(secret: SecretInput | CryptoKeyPair) => {
    const encryptSecret = isCryptoKeyPair(secret) ? secret.privateKey : secret
    const decryptSecret = isCryptoKeyPair(secret) ? secret.publicKey : secret

    return {
        encryptJWE: <Encrypted extends JWTPayload = Payload>(
            payload: TypedJWTPayload<Partial<Encrypted>>,
            options?: JWEHeaderParameters
        ) => encryptJWE<Encrypted>(payload, encryptSecret, options),
        decryptJWE: <Decrypted extends JWTPayload = Payload>(payload: string, options?: JWTDecryptOptions) =>
            decryptJWE<Decrypted>(payload, decryptSecret, options),
    }
}

/**
 * Creates a `Compact JWE (JSON Web Encryption)` encrypter and decrypter using compact serialization. It implements the
 * `compactEncryptJWE` and `decryptCompactJWE` functions.
 * @param secret - Secret key used for encrypting and decrypting the JWE
 * @returns compactEncryptJWE and decryptCompactJWE functions
 */
export const createCompactJWE = (secret: SecretInput | CryptoKeyPair) => {
    const encryptSecret = isCryptoKeyPair(secret) ? secret.privateKey : secret
    const decryptSecret = isCryptoKeyPair(secret) ? secret.publicKey : secret

    return {
        compactEncryptJWE: (payload: string, options?: JWEHeaderParameters) => compactEncryptJWE(payload, encryptSecret, options),
        decryptCompactJWE: (payload: string, options?: DecryptOptions) => decryptCompactJWE(payload, decryptSecret, options),
    }
}
