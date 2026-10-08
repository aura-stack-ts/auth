import { getEnv } from "@/shared/env.ts"
import { createDeriveKey } from "@aura-stack/jose"
import { importPEMKeyPair } from "@/shared/crypto.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { AsymmetricKeyPairFromEnv } from "@/@types/internal.ts"
import type { JWTKey, SessionConfig } from "@/@types/session.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import {
    isCryptoKey,
    isCryptoKeyPair,
    isCryptoSecret,
    isEncryptedMode,
    isJWTPEMFormattedKeyPair,
    isKeyPair,
    isPEMFormattedKeyPairFromEnv,
    isSealedMode,
    isSignedMode,
} from "@/shared/assert.ts"

export const getSecrets = async (secret: InternalSecret, salt: string, session?: SessionConfig) => {
    if (isJWTPEMFormattedKeyPair(secret)) {
        if (!isSealedMode(session)) {
            throw new AuraAuthError({ code: "INVALID_PEM_KEY_PAIR_MODE_MISMATCH" })
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
            throw new AuraAuthError({ code: "INVALID_PEM_KEY_PAIR_SINGLE_MISMATCH" })
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
    if (isCryptoKey(secret) || isCryptoKeyPair(secret) || isKeyPair(secret)) {
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
        createDeriveKey(secret, salt as string, "aura:signing"),
        createDeriveKey(secret, salt as string, "aura:encryption"),
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

export const getSecretKey = (secret?: JWTKey) => {
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
    throw new AuraAuthError({ code: "JOSE_INITIALIZATION_SECRET_MISSING" })
}

export const getSecretConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    return getSecretKey(config?.secret)
}

export type InternalSecret = ReturnType<typeof getSecretConfig>
