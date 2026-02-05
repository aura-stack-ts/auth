import { InvalidSecretError } from "@/errors.js"
import { isObject } from "@/assert.js"
import type { DerivedKeyInput, SecretInput } from "@/index.js"

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
 *
 * @param secret - The secret as a string or Uint8Array
 * @returns The secret in Uint8Array format
 */
export const createSecret = (secret: SecretInput) => {
    if (!Boolean(secret)) throw new InvalidSecretError("Secret is required")
    if (typeof secret === "string") {
        const byteLength = new TextEncoder().encode(secret).byteLength
        if (byteLength < 32) {
            throw new InvalidSecretError("Secret string must be at least 32 characters long")
        }
        const entropy = getEntropy(secret)
        if (entropy < 4) {
            throw new InvalidSecretError("Secret string must have an entropy of at least 6 bits per character")
        }
        return new Uint8Array(Buffer.from(secret, "utf-8"))
    }
    return secret
}

export const getSecrets = (secret: SecretInput | DerivedKeyInput) => {
    const jwsSecret = isObject(secret) && "jws" in secret ? secret.jws : secret
    const jweSecret = isObject(secret) && "jwe" in secret ? secret.jwe : secret
    return {
        jwsSecret,
        jweSecret,
    }
}
