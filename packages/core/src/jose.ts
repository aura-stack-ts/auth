import { getEnv } from "@/env.ts"
import {
    createJWT,
    createJWS,
    createJWE,
    createDeriveKey,
    createSecret,
    type JWTVerifyOptions,
    type DecodeJWTOptions,
    type TypedJWTPayload,
    type EncodeJWTOptions,
    type JWTHeaderParameters,
    type JWEHeaderParameters,
    type JWTDecryptOptions,
} from "@aura-stack/jose"
import { AuthInternalError } from "@/errors.ts"
export { base64url, type JWTPayload } from "@aura-stack/jose/jose"
export { encoder, getRandomBytes, getSubtleCrypto } from "@aura-stack/jose/crypto"
import type { User } from "@/@types/index.ts"

/**
 * Creates the JOSE instance used for signing and verifying tokens. It derives keys
 * for session tokens and CSRF tokens. For security and determinism, it's required
 * to set a salt value in `AURA_AUTH_SALT` or `AUTH_SALT` env.
 *
 * @param secret the base secret for key derivation
 * @returns jose instance with methods for encoding/decoding JWTs and signing/verifying JWSs
 */
export const createJoseInstance = (secret?: string) => {
    secret ??= getEnv("SECRET")
    if (!secret) {
        throw new AuthInternalError(
            "JOSE_INITIALIZATION_FAILED",
            "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
        )
    }

    const salt = getEnv("SALT")
    if (!salt) {
        throw new AuthInternalError(
            "JOSE_INITIALIZATION_FAILED",
            "AURA_AUTH_SALT or AUTH_SALT environment variable is not set. A salt value is required for key derivation."
        )
    }
    try {
        createSecret(salt)
    } catch (error) {
        throw new AuthInternalError(
            "INVALID_SALT_SECRET_VALUE",
            "AURA_AUTH_SALT/AUTH_SALT is invalid. It must be at least 32 bytes long and meet entropy requirements.",
            { cause: error }
        )
    }

    const jose = (async () => {
        const [derivedSigningKey, derivedEncryptionKey, derivedCsrfTokenKey] = await Promise.all([
            createDeriveKey(secret, salt, "signing"),
            createDeriveKey(secret, salt, "encryption"),
            createDeriveKey(secret, salt, "csrfToken"),
        ])

        return {
            jwt: createJWT<User>({ sign: derivedSigningKey, encrypt: derivedEncryptionKey }),
            jws: createJWS<User>(derivedCsrfTokenKey),
            jwe: createJWE<User>(derivedEncryptionKey),
        }
    })()
    jose.catch(() => {})

    return {
        encodeJWT: async (payload: TypedJWTPayload<Partial<User>>, options?: EncodeJWTOptions) => {
            const { jwt } = await jose
            return jwt.encodeJWT(payload, options)
        },
        decodeJWT: async (token: string, options?: DecodeJWTOptions) => {
            const { jwt } = await jose
            return jwt.decodeJWT(token, options)
        },
        signJWS: async (payload: TypedJWTPayload<Partial<User>>, options?: JWTHeaderParameters) => {
            const { jws } = await jose
            return jws.signJWS(payload, options)
        },
        verifyJWS: async (token: string, options?: JWTVerifyOptions) => {
            const { jws } = await jose
            return jws.verifyJWS(token, options)
        },
        encryptJWE: async (payload: TypedJWTPayload<Partial<User>>, options?: JWEHeaderParameters) => {
            const { jwe } = await jose
            return jwe.encryptJWE(payload, options)
        },
        decryptJWE: async (token: string, options?: JWTDecryptOptions) => {
            const { jwe } = await jose
            return jwe.decryptJWE(token, options)
        },
    }
}
