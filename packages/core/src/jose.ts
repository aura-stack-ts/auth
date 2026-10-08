import {
    createJWT,
    createJWS,
    createJWE,
    type JWTVerifyOptions,
    type DecodeJWTOptions,
    type TypedJWTPayload,
    type EncodeJWTOptions,
    type JWTHeaderParameters,
    type JWEHeaderParameters,
    type JWTDecryptOptions,
} from "@aura-stack/jose"
import { AuraAuthError } from "@/errors/aura-error.ts"
export { base64url, type JWTPayload } from "@aura-stack/jose/jose"
import { getSecrets, type InternalSecret } from "@/config/get-secret.ts"
export { encoder, getRandomBytes, getSubtleCrypto } from "@aura-stack/jose/crypto"
import { isEncryptedMode, isSealedMode, isSignedMode, isStatelessStrategy } from "@/shared/assert.ts"
import type { User, SessionConfig } from "@/@types/index.ts"

const getJWTConfig = (config?: SessionConfig) => {
    return isStatelessStrategy(config) ? config?.jwt : {}
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
    if (config?.maxAge) {
        claims.exp = now + config.maxAge
    } else if (jwt?.maxAge) {
        claims.exp = now + jwt.maxAge
    }
    if (config?.maxDuration) {
        claims.mexp = now + config.maxDuration
    } else if (jwt?.maxExpiration) {
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
        throw new AuraAuthError({ code: "JWT_EXPIRED" })
    }
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
export const createJoseInstance = <DefaultUser extends User = User>(
    secret: InternalSecret,
    salt: string,
    session?: SessionConfig
) => {
    const jose = (async () => {
        const { jwsSecret, jweSecret, jwtSecret } = await getSecrets(secret, salt, session)

        return {
            jwt: createJWT<DefaultUser>(jwtSecret),
            jws: createJWS<DefaultUser>(jwsSecret),
            jwe: createJWE<DefaultUser>(jweSecret),
        }
    })()

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
