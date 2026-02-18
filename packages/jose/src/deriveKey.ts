import { createSecret } from "@/secret.js"
import { KeyDerivationError } from "@/errors.js"
import { encoder, getSubtleCrypto } from "@/crypto.js"
import type { SecretInput } from "@/index.js"

/**
 * Generate a derived key using HKDF (HMAC-based Extract-and-Expand Key Derivation Function)
 * Uses the Web Crypto API for cross-runtime compatibility (Node.js, Deno, Bun, Browsers)
 *
 * @param secret Value used as the input keying material
 * @param salt Cryptographic salt
 * @param info Context and application specific information
 * @param length Size of the derived key in bytes (default is 32 bytes)
 * @returns Derived key as Uint8Array
 */
export const deriveKey = async (
    secret: Uint8Array,
    salt: string | Uint8Array,
    info: string | Uint8Array,
    length: number = 32
): Promise<Uint8Array> => {
    try {
        const subtle = getSubtleCrypto()
        const secretBuffer = secret.buffer.slice(secret.byteOffset, secret.byteOffset + secret.byteLength)
        const baseKey = await subtle.importKey("raw", secretBuffer as BufferSource, "HKDF", false, ["deriveBits"])

        const saltBuffer = typeof salt === "string" ? encoder.encode(salt) : salt
        const infoBuffer = typeof info === "string" ? encoder.encode(info) : info
        const derivedBits = await subtle.deriveBits(
            {
                name: "HKDF",
                hash: "SHA-256",
                salt: saltBuffer as BufferSource,
                info: infoBuffer as BufferSource,
            },
            baseKey,
            length << 3
        )
        return new Uint8Array(derivedBits)
    } catch (error) {
        throw new KeyDerivationError("Failed to create a derived key (HKDF)", { cause: error })
    }
}

/**
 * Create a derived key from a given secret.
 * This is an async function that works across all modern JavaScript runtimes.
 *
 * > [!NOTE]
 * > If the secret is a CryptoKey, this function cannot derive keys from it.
 *
 * @param secret - The secret as a string or Uint8Array
 * @param salt - Optional cryptographic salt (defaults to "Aura Jose secret salt")
 * @param info - Optional context information (defaults to "Aura Jose secret derivation")
 * @param length - Size of the derived key in bytes (default is 32 bytes)
 * @returns Promise resolving to the derived key as a Uint8Array
 */
export const createDeriveKey = async (
    secret: SecretInput,
    salt?: string | Uint8Array,
    info?: string | Uint8Array,
    length: number = 32
) => {
    const secretKey = createSecret(secret)
    if (secretKey instanceof CryptoKey) {
        throw new KeyDerivationError("Cannot derive key from CryptoKey. Use Uint8Array or string secret instead.")
    }
    const key = await deriveKey(secretKey, salt ?? "Aura Jose secret salt", info ?? "Aura Jose secret derivation", length)
    return key
}
