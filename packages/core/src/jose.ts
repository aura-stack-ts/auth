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
import type { User, SessionConfig, JWTMode, JWTConfig } from "@/@types/index.ts"

export const isSignedMode = (config?: SessionConfig): config is { jwt: Extract<JWTConfig, { mode: "signed" }> } =>
    getJWTMode(config) === "signed"

export const isEncryptedMode = (config?: SessionConfig): config is { jwt: Extract<JWTConfig, { mode: "encrypted" }> } =>
    getJWTMode(config) === "encrypted"

export const isSealedMode = (config?: SessionConfig): config is { jwt: Extract<JWTConfig, { mode: "sealed" }> } =>
    getJWTMode(config) === "sealed"

/**
 * Extracts the JWT mode from a SessionConfig.
 * Defaults to "sealed" when no mode is specified.
 */
const getJWTMode = (config?: SessionConfig): JWTMode => {
    return config?.jwt?.mode ?? "sealed"
}

const getJWTConfig = (config?: SessionConfig) => {
    return config?.jwt
}

export const getJWTClaims = (config?: SessionConfig) => {
    const jwt = getJWTConfig(config)
    const claims: Record<string, unknown> = {}
    if (jwt?.audience) {
        claims.aud = jwt.audience
    }
    if (jwt?.issuer) {
        claims.iss = jwt.issuer
    }
    return claims
}

export const getPayloadClaims = (payload: TypedJWTPayload<Partial<User>>, config?: SessionConfig) => {
    const claims = getJWTClaims(config)
    return { ...claims, ...payload }
}

export const getSignOptions = (config?: SessionConfig, options?: JWTHeaderParameters) => {
    const signOptions = {} as JWTHeaderParameters
    if ((isSignedMode(config) || isSealedMode(config)) && config?.jwt?.signingAlgorithm) {
        signOptions.alg = config.jwt.signingAlgorithm
    }
    return { ...signOptions, ...options }
}

export const getEncryptOptions = (config?: SessionConfig, options?: JWEHeaderParameters) => {
    const encryptOptions: JWEHeaderParameters = {}
    if (isEncryptedMode(config) || isSealedMode(config)) {
        if (config?.jwt?.keyAlgorithm) {
            encryptOptions.alg = config.jwt.keyAlgorithm
        }
        if (config?.jwt?.encryptionAlgorithm) {
            encryptOptions.enc = config.jwt.encryptionAlgorithm
        }
    }
    return { ...encryptOptions, ...options }
}

export const getVerifyOptions = (config?: SessionConfig, options?: JWTVerifyOptions) => {
    const verifyOptions: JWTVerifyOptions = {}
    if (isSignedMode(config) || isSealedMode(config)) {
        if (config?.jwt?.signingAlgorithm) {
            verifyOptions.algorithms = [config.jwt.signingAlgorithm]
        }
        verifyOptions.issuer = config?.jwt?.issuer
        verifyOptions.audience = config?.jwt?.audience
    }
    return { ...verifyOptions, ...options }
}

export const getDecryptOptions = (config?: SessionConfig, options?: JWTDecryptOptions) => {
    const decryptOptions: JWTDecryptOptions = {}
    if (isEncryptedMode(config) || isSealedMode(config)) {
        if (config?.jwt?.keyAlgorithm) {
            decryptOptions.keyManagementAlgorithms = [config.jwt.keyAlgorithm]
        }
        if (config?.jwt?.encryptionAlgorithm) {
            decryptOptions.contentEncryptionAlgorithms = [config.jwt.encryptionAlgorithm]
        }
        decryptOptions.issuer = config?.jwt?.issuer
        decryptOptions.audience = config?.jwt?.audience
    }
    return { ...decryptOptions, ...options }
}

/**
 * Creates the JOSE instance used for signing and verifying tokens. It derives keys
 * for session tokens and CSRF tokens. For security and determinism, it's required
 * to set a salt value in `AURA_AUTH_SALT` or `AUTH_SALT` env.
 *
 * The instance respects the `SessionConfig` to determine:
 * - **mode**: `signed` (JWS only), `encrypted` (JWE only), or `sealed` (JWS + JWE)
 * - **algorithms**: signing, key-wrapping, and content-encryption algorithms
 * - **claims**: audience, issuer, maxAge
 *
 * @param secret the base secret for key derivation
 * @param session the session configuration that drives algorithm and mode selection
 * @returns jose instance with methods for encoding/decoding JWTs and signing/verifying JWSs
 */
export const createJoseInstance = (secret?: string, session?: SessionConfig) => {
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
        signJWS: async (payload: TypedJWTPayload<Partial<User>>, options?: JWTHeaderParameters) => {
            const { jws } = await jose
            return jws.signJWS(getPayloadClaims(payload, session), getSignOptions(session, options))
        },
        verifyJWS: async (token: string, options?: JWTVerifyOptions) => {
            const { jws } = await jose
            return jws.verifyJWS(token, getVerifyOptions(session, options))
        },
        encryptJWE: async (payload: TypedJWTPayload<Partial<User>>, options?: JWEHeaderParameters) => {
            const { jwe } = await jose
            return jwe.encryptJWE(getPayloadClaims(payload, session), getEncryptOptions(session, options))
        },
        decryptJWE: async (token: string, options?: JWTDecryptOptions) => {
            const { jwe } = await jose
            return jwe.decryptJWE(token, getDecryptOptions(session, options))
        },
        encodeJWT: async (payload: TypedJWTPayload<Partial<User>>, options?: EncodeJWTOptions) => {
            const { jwt } = await jose
            return jwt.encodeJWT(getPayloadClaims(payload, session), {
                sign: getSignOptions(session, options?.sign),
                encrypt: getEncryptOptions(session, options?.encrypt),
            })
        },
        decodeJWT: async (token: string, options?: DecodeJWTOptions) => {
            const { jwt } = await jose
            return jwt.decodeJWT(token, {
                verify: getVerifyOptions(session, options?.verify),
                decrypt: getDecryptOptions(session, options?.decrypt),
            })
        },
    }
}
