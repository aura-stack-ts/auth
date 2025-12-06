import { hkdfSync, randomBytes, type BinaryLike, type KeyObject } from "node:crypto"
import { createSecret } from "@/secret.js"

/**
 * Generate a derived key using HKDF (HMAC-based Extract-and-Expand Key Derivation Function)
 *
 * @param secret Value used as the input keying material
 * @param info Context and application specific information
 * @param length Size of the derived key in bytes (default is 32 bytes)
 * @returns Derived key as Uint8Array and base64 encoded string
 */
export const deriveKey = (secret: BinaryLike | KeyObject | string, info: string, length: number = 32) => {
    try {
        const salt = randomBytes(length)
        const key = hkdfSync("SHA256", secret, salt, info, length)
        const derivedKey = Buffer.from(key)
        return {
            key,
            derivedKey,
        }
    } catch (error) {
        // @ts-ignore
        throw new Error("Failed to create a derived key (HKDF)", { cause: error })
    }
}

/**
 * Create a derived key from a given secret.
 *
 * @param secret - The secret as a string or Uint8Array
 * @returns The secret in Uint8Array format
 */
export const createDeriveKey = (secret: BinaryLike | KeyObject | string, info?: string, length: number = 32) => {
    const secretKey = createSecret(secret as Uint8Array)
    return deriveKey(secretKey, info ?? "Aura Jose secret derivation", length)
}
