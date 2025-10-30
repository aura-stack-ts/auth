import type { SecretInput } from "@/index.js"

/**
 * Create a secret in Uint8Array format
 *
 * @param secret - The secret as a string or Uint8Array
 * @returns The secret in Uint8Array format
 */
export const createSecret = (secret: SecretInput) => {
    if (typeof secret === "string") {
        return new Uint8Array(Buffer.from(secret, "utf-8"))
    }
    return secret
}
