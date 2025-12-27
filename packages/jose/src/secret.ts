import { InvalidSecretError } from "@/errors.js"
import type { SecretInput } from "@/index.js"

/**
 * Create a secret in Uint8Array format
 *
 * @param secret - The secret as a string or Uint8Array
 * @returns The secret in Uint8Array format
 */
export const createSecret = (secret: SecretInput) => {
    if (secret === undefined) throw new Error("Secret is required")
    if (typeof secret === "string") {
        if (new TextEncoder().encode(secret).byteLength < 32) {
            throw new InvalidSecretError("Secret string must be at least 32 characters long")
        }
        return new Uint8Array(Buffer.from(secret, "utf-8"))
    }
    return secret
}
