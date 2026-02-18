import { isObject } from "@/assert.js"
import { InvalidSecretError } from "@/errors.js"
import { encoder } from "@/crypto.js"
import type { DerivedKeyInput, SecretInput } from "@/index.js"

export const MIN_SECRET_ENTROPY_BITS = 4.5

export const getEntropy = (secret: string): number => {
    const charFreq = new Map<string, number>()
    for (const char of secret) {
        if (!charFreq.has(char)) {
            charFreq.set(char, 0)
        }
        charFreq.set(char, charFreq.get(char)! + 1)
    }
    let entropy = 0
    const length = secret.length
    for (const freq of charFreq.values()) {
        const p = freq / length
        entropy -= p * Math.log2(p)
    }
    return entropy
}

/**
 * Create a secret in Uint8Array format
 * Uses the standard TextEncoder API for cross-runtime compatibility
 *
 * @param secret - The secret as a string or Uint8Array
 * @returns The secret in Uint8Array format
 */
export const createSecret = (secret: SecretInput, length: number = 32) => {
    if (!Boolean(secret)) throw new InvalidSecretError("Secret is required")
    if (typeof secret === "string") {
        const encoded = encoder.encode(secret)
        const byteLength = encoded.byteLength
        if (byteLength < length) {
            throw new InvalidSecretError(`Secret string must be at least ${length} bytes long`)
        }
        const entropy = getEntropy(secret)
        if (entropy < MIN_SECRET_ENTROPY_BITS) {
            throw new InvalidSecretError(
                `Secret string must have an entropy of at least ${MIN_SECRET_ENTROPY_BITS} bits per character`
            )
        }
        return encoded
    }
    if (secret instanceof CryptoKey || secret instanceof Uint8Array) {
        if (secret instanceof Uint8Array && secret.byteLength < length) {
            throw new InvalidSecretError(`Secret must be at least ${length} bytes long`)
        }
        return secret
    }
    throw new InvalidSecretError("Secret must be a string, Uint8Array, or CryptoKey")
}

export const getSecrets = (secret: SecretInput | DerivedKeyInput) => {
    const jwsSecret = isObject(secret) && "jws" in secret ? secret.jws : secret
    const jweSecret = isObject(secret) && "jwe" in secret ? secret.jwe : secret
    return {
        jwsSecret,
        jweSecret,
    }
}
