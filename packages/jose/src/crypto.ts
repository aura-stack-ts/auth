export const encoder = new TextEncoder()
export const decoder = new TextDecoder()

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
