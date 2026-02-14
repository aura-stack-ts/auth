import "dotenv/config"
import { createJWT, createJWS, createJWE, createDeriveKey, createSecret, JWTVerifyOptions, DecodeJWTOptions } from "@aura-stack/jose"
import { AuthInternalError } from "@/errors.js"
export type { JWTPayload } from "@aura-stack/jose/jose"

/**
 * Creates the JOSE instance used for signing and verifying tokens. It derives keys
 * for session tokens and CSRF tokens. For security and determinism, it's required
 * to set a salt value in `AURA_AUTH_SALT` or `AUTH_SALT` env.
 *
 * @param secret the base secret for key derivation
 * @returns jose instance with methods for encoding/decoding JWTs and signing/verifying JWSs
 */
export const createJoseInstance = (secret?: string) => {
    const env = process.env
    secret ??= env.AURA_AUTH_SECRET! ?? env.AUTH_SECRET!
    if (!secret) {
        throw new AuthInternalError(
            "JOSE_INITIALIZATION_FAILED",
            "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
        )
    }

    const salt = env.AURA_AUTH_SALT ?? env.AUTH_SALT
    try {
        createSecret(salt!)
    } catch (error) {
        throw new AuthInternalError(
            "INVALID_SALT_SECRET_VALUE",
            "AURA_AUTH_SALT environment variable is invalid. It must be at least 32 bits long.",
            { cause: error }
        )
    }
    const { derivedKey: derivedSigningKey } = createDeriveKey(secret, salt, "signing")
    const { derivedKey: derivedEncryptionKey } = createDeriveKey(secret, salt, "encryption")
    const { derivedKey: derivedCsrfTokenKey } = createDeriveKey(secret, salt, "csrfToken")

    const { decodeJWT, encodeJWT } = createJWT({ jws: derivedSigningKey, jwe: derivedEncryptionKey })
    const { signJWS, verifyJWS } = createJWS(derivedCsrfTokenKey)
    const { encryptJWE, decryptJWE } = createJWE(derivedEncryptionKey)

    return {
        decodeJWT,
        encodeJWT,
        signJWS,
        verifyJWS,
        encryptJWE,
        decryptJWE,
    }
}

export const jwtVerificationOptions: JWTVerifyOptions = {
    algorithms: ["HS256"],
    typ: "JWT"
}

export const decodeJWTOptions: DecodeJWTOptions = {
    jws: jwtVerificationOptions,
    jwt: {
        typ: "JWT"
    }
}