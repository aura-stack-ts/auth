/**
 * Generate random bytes using the Web Crypto API
 * Works in Node.js 15+, Deno, Bun, and browsers
 *
 * @param size - Number of random bytes to generate
 * @returns Uint8Array containing random bytes
 */
export const getRandomBytes = (size: number): Uint8Array => {
    return globalThis.crypto.getRandomValues(new Uint8Array(size))
}

/**
 * Encode a string to UTF-8 bytes
 * Uses the standard TextEncoder API
 *
 * @param input - String to encode
 * @returns Uint8Array containing UTF-8 encoded bytes
 */
export const encodeString = (input: string): Uint8Array => {
    return new TextEncoder().encode(input)
}

/**
 * Decode UTF-8 bytes to a string
 * Uses the standard TextDecoder API
 *
 * @param bytes - Uint8Array containing UTF-8 encoded bytes
 * @returns Decoded string
 */
export const decodeString = (bytes: Uint8Array): string => {
    return new TextDecoder().decode(bytes)
}

/**
 * Get a unified source of entropy - prefers crypto.subtle but falls back if needed
 * All modern runtimes support globalThis.crypto.subtle
 *
 * @returns SubtleCrypto interface for cryptographic operations
 */
export const getSubtleCrypto = (): SubtleCrypto => {
    if (globalThis.crypto?.subtle) {
        return globalThis.crypto.subtle
    }
    throw new Error("SubtleCrypto is not available in this runtime")
}
