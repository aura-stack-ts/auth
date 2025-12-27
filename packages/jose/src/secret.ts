import { InvalidSecretError } from "@/errors.js"
import { isObject } from "@/assert.js"
import type { DerivedKeyInput, SecretInput } from "@/index.js"

/**
 * Create a secret in Uint8Array format
 *
 * @param secret - The secret as a string or Uint8Array
 * @returns The secret in Uint8Array format
 */
export const createSecret = (secret: SecretInput) => {
    if (secret === undefined) throw new InvalidSecretError("Secret is required")
    if (typeof secret === "string") {
        if (new TextEncoder().encode(secret).byteLength < 32) {
            throw new InvalidSecretError("Secret string must be at least 32 characters long")
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
