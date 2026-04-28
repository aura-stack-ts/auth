import { getEnv } from "@/shared/env.ts"
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
export { base64url, type JWTPayload } from "@aura-stack/jose/jose"
import { AuthInternalError, AuthJoseInitializationError, AuthSecurityError } from "@/shared/errors.ts"
import {
    isCryptoKey,
    isCryptoKeyPair,
    isCryptoSecret,
    isEncryptedMode,
    isJWTPEMFormattedKeyPair,
    isPEMFormattedKeyPairFromEnv,
    isSealedMode,
    isSignedMode,
} from "@/shared/assert.ts"
export { encoder, getRandomBytes, getSubtleCrypto } from "@aura-stack/jose/crypto"
import type { User, SessionConfig, JWTKey, AsymmetricKeyPairFromEnv } from "@/@types/index.ts"
import { importPEMKeyPair } from "./shared/crypto.ts"

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
    const now = Math.floor(Date.now() / 1000)
    if (jwt?.maxAge) {
        claims.exp = now + jwt.maxAge
    }
    if (jwt?.maxExpiration) {
        claims.mexp = now + jwt.maxExpiration
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

export const getVerifyOptions = (config?: SessionConfig, options?: JWTVerifyOptions): JWTVerifyOptions => {
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

export const verifyMaxExpiration = (payload: TypedJWTPayload<Partial<User>>) => {
    const now = Math.floor(Date.now() / 1000)
    if (payload.mexp && typeof payload.mexp === "number" && now > payload.mexp) {
        throw new AuthSecurityError("TOKEN_EXPIRED", "The token has expired based on its maxExpiration (mexp) claim.")
    }
}

const getSecrets = async (
    secret: JWTKey | AsymmetricKeyPairFromEnv | { sign: AsymmetricKeyPairFromEnv; encrypt: AsymmetricKeyPairFromEnv },
    salt: string,
    session?: SessionConfig
) => {
    if (isJWTPEMFormattedKeyPair(secret)) {
        if (!isSealedMode(session)) {
            throw new AuthJoseInitializationError(
                "INVALID_PEM_KEY_PAIR",
                "Multiples PEM Key Pairs from environment variables require 'sealed' JWT mode. For 'signed' or 'encrypted' modes, provide a single PEM key pair or a combined key object."
            )
        }

        const { sign, encrypt } = secret
        const signingAlg = getEnv("SIGNING_ALG") || getEnv("SIGNING_ALGORITHM") || session?.jwt.signingAlgorithm || "RS256"
        const encryptionAlg =
            getEnv("ENCRYPTION_ALG") || getEnv("ENCRYPTION_ALGORITHM") || session?.jwt.keyAlgorithm || "RSA-OAEP-256"
        const importedSign = await importPEMKeyPair(sign, signingAlg)
        const importedEncrypt = await importPEMKeyPair(encrypt, encryptionAlg)

        return {
            jwsSecret: importedSign,
            jweSecret: importedEncrypt,
            jwtSecret: {
                sign: importedSign,
                encrypt: importedEncrypt,
            },
        }
    }
    if (isPEMFormattedKeyPairFromEnv(secret)) {
        if (isSealedMode(session)) {
            throw new AuthJoseInitializationError(
                "INVALID_PEM_KEY_PAIR",
                "Single PEM key pairs from environment variables require 'signed' or 'encrypted' JWT mode. For 'sealed' mode, provide separate signing and encryption keys or a combined key object."
            )
        }
        const algorithm =
            getEnv("ALGORITHM") ||
            getEnv("ALG") ||
            (isSignedMode(session) ? session?.jwt?.signingAlgorithm : undefined) ||
            (isEncryptedMode(session) ? session?.jwt?.keyAlgorithm : undefined) ||
            "RS256"
        const { publicKey, privateKey } = await importPEMKeyPair(secret, algorithm)
        return {
            jwsSecret: {
                publicKey,
                privateKey,
            },
            jweSecret: {
                publicKey,
                privateKey,
            },
            jwtSecret: {
                sign: {
                    publicKey,
                    privateKey,
                },
                encrypt: {
                    publicKey,
                    privateKey,
                },
            },
        }
    }

    if (isCryptoSecret(secret)) {
        return {
            jwsSecret: secret.sign,
            jweSecret: secret.encrypt,
            jwtSecret: {
                sign: secret.sign,
                encrypt: secret.encrypt,
            },
        }
    }
    if (isCryptoKey(secret) || isCryptoKeyPair(secret)) {
        return {
            jwsSecret: secret,
            jweSecret: secret,
            jwtSecret: {
                sign: secret,
                encrypt: secret,
            },
        }
    }

    const [derivedSigningKey, derivedEncryptionKey] = await Promise.all([
        createDeriveKey(secret, salt, "aura:signing"),
        createDeriveKey(secret, salt, "aura:encryption"),
    ])
    return {
        jwsSecret: derivedSigningKey,
        jweSecret: derivedEncryptionKey,
        jwtSecret: {
            sign: derivedSigningKey,
            encrypt: derivedEncryptionKey,
        },
    }
}

const getPEMKeyFromEnv = (prefix: string): AsymmetricKeyPairFromEnv | null => {
    const publicKey = getEnv(`${prefix}${prefix && "_"}PUBLIC_KEY`)
    const privateKey = getEnv(`${prefix}${prefix && "_"}PRIVATE_KEY`)
    if (publicKey && privateKey) {
        return { publicKey, privateKey }
    }
    return null
}

const getSecretKey = (secret?: JWTKey) => {
    secret ??= getEnv("SECRET")
    if (secret) return secret
    const pem = getPEMKeyFromEnv("")
    if (pem) {
        return pem
    }
    const signing = getPEMKeyFromEnv("SIGNING")
    const encryption = getPEMKeyFromEnv("ENCRYPTION")
    if (signing && encryption) {
        return {
            sign: signing,
            encrypt: encryption,
        }
    }
    throw new AuthInternalError(
        "JOSE_INITIALIZATION_FAILED",
        "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
    )
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
export const createJoseInstance = <DefaultUser extends User = User>(secret?: JWTKey, session?: SessionConfig) => {
    const secretKey = getSecretKey(secret)
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
        const { jwsSecret, jweSecret, jwtSecret } = await getSecrets(secretKey, salt, session)

        return {
            jwt: createJWT<DefaultUser>(jwtSecret),
            jws: createJWS<DefaultUser>(jwsSecret),
            jwe: createJWE<DefaultUser>(jweSecret),
        }
    })()
    jose.catch(() => {})

    return {
        signJWS: async (payload: TypedJWTPayload<Partial<DefaultUser>>, options?: JWTHeaderParameters) => {
            const { jws } = await jose
            return jws.signJWS(getPayloadClaims(payload, session), getSignOptions(session, options))
        },
        verifyJWS: async (token: string, options?: JWTVerifyOptions) => {
            const { jws } = await jose
            const payload = await jws.verifyJWS(token, getVerifyOptions(session, options))
            verifyMaxExpiration(payload)
            return payload
        },
        encryptJWE: async (payload: TypedJWTPayload<Partial<DefaultUser>>, options?: JWEHeaderParameters) => {
            const { jwe } = await jose
            return jwe.encryptJWE(getPayloadClaims(payload, session), getEncryptOptions(session, options))
        },
        decryptJWE: async (token: string, options?: JWTDecryptOptions) => {
            const { jwe } = await jose
            const payload = await jwe.decryptJWE(token, getDecryptOptions(session, options))
            verifyMaxExpiration(payload)
            return payload
        },
        encodeJWT: async (payload: TypedJWTPayload<Partial<DefaultUser>>, options?: EncodeJWTOptions) => {
            const { jwt } = await jose
            return await jwt.encodeJWT(getPayloadClaims(payload, session), {
                sign: getSignOptions(session, options?.sign),
                encrypt: getEncryptOptions(session, options?.encrypt),
            })
        },
        decodeJWT: async (token: string, options?: DecodeJWTOptions) => {
            const { jwt } = await jose
            const payload = await jwt.decodeJWT(token, {
                verify: getVerifyOptions(session, options?.verify),
                decrypt: getDecryptOptions(session, options?.decrypt),
            })
            verifyMaxExpiration(payload)
            return payload
        },
    }
}
