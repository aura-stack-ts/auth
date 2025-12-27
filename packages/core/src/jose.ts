import "dotenv/config"
import { createJWT, createJWS, createJWE, createDeriveKey } from "@aura-stack/jose"
import { createDerivedSalt } from "@/secure.js"
import { AuthInternalError } from "@/errors.js"
export type { JWTPayload } from "@aura-stack/jose/jose"

/**
 * Creates the JOSE instance used for signing and verifying tokens. It derives keys
 * for session tokens and CSRF tokens. For security and determinism, it uses the
 * `AURA_AUTH_SALT` environment variable if available; otherwise,it uses a derived
 * salt based on the provided secret.
 *
 * @param secret the base secret for key derivation
 * @returns jose instance with methods for encoding/decoding JWTs and signing/verifying JWSs
 */
export const createJoseInstance = (secret?: string) => {
    secret ??= process.env.AURA_AUTH_SECRET!
    if (!secret) {
        throw new AuthInternalError(
            "JOSE_INITIALIZATION_FAILED",
            "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
        )
    }

    const salt = process.env.AURA_AUTH_SALT ?? createDerivedSalt(secret)
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
