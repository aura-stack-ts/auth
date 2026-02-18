import { equals } from "@/utils.js"
import { AuthSecurityError } from "@/errors.js"
import { isJWTPayloadWithToken, safeEquals } from "@/assert.js"
import { jwtVerificationOptions, base64url, encoder, getRandomBytes, getSubtleCrypto } from "@/jose.js"
import type { AuthRuntimeConfig } from "@/@types/index.js"

export const generateSecure = (length: number = 32) => {
    return base64url.encode(getRandomBytes(length))
}

export const createHash = async (data: string) => {
    const subtle = getSubtleCrypto()
    const digest = await subtle.digest("SHA-256", encoder.encode(data))
    return base64url.encode(new Uint8Array(digest))
}

/**
 * Creates the code challenge flow for PKCE OAuth flow. It generates a code verifier and its corresponding
 * code challenge using SHA-256 hashing.
 *   - code_verifier: A cryptographically random string used to mitigate authorization code interception attacks.
 *   - code_challenge: A hashed version of the code_verifier sent in the authorization request.
 *   - method: The method used to generate the code challenge, typically "S256" for SHA-256.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
 */
export const createPKCE = async (verifier?: string) => {
    // Base64url: n bytes → ceil(n * 4/3) chars. For 43-128 chars, need 32-96 bytes.
    const byteLength = verifier ? undefined : Math.floor(Math.random() * (96 - 32 + 1) + 32)
    const codeVerifier = verifier ?? generateSecure(byteLength ?? 64)
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
        throw new AuthSecurityError("PKCE_VERIFIER_INVALID", "The code verifier must be between 43 and 128 characters in length.")
    }
    const codeChallenge = await createHash(codeVerifier)
    return { codeVerifier, codeChallenge, method: "S256" }
}

/**
 * Creates a CSRF token to be used in OAuth flows to prevent cross-site request forgery attacks.
 *
 * @param csrfCookie - Optional existing CSRF cookie to verify and reuse
 * @returns Signed CSRF token
 */
export const createCSRF = async (jose: AuthRuntimeConfig["jose"], csrfCookie?: string) => {
    try {
        const token = generateSecure(32)
        if (csrfCookie) {
            await jose.verifyJWS(csrfCookie, jwtVerificationOptions)
            return csrfCookie
        }
        return jose.signJWS({ token })
    } catch {
        const token = generateSecure(32)
        return jose.signJWS({ token })
    }
}

export const verifyCSRF = async (jose: AuthRuntimeConfig["jose"], cookie: string, header: string): Promise<boolean> => {
    try {
        const cookiePayload = await jose.verifyJWS(cookie, jwtVerificationOptions)
        const headerPayload = await jose.verifyJWS(header, jwtVerificationOptions)

        if (!isJWTPayloadWithToken(cookiePayload)) {
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "Cookie payload missing token field.")
        }
        if (!isJWTPayloadWithToken(headerPayload)) {
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "Header payload missing token field.")
        }

        if (!equals(cookiePayload.token.length, headerPayload.token.length)) {
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "The CSRF tokens do not match.")
        }
        if (!safeEquals(cookiePayload.token, headerPayload.token)) {
            throw new AuthSecurityError("CSRF_TOKEN_INVALID", "The CSRF tokens do not match.")
        }
        return true
    } catch {
        throw new AuthSecurityError("CSRF_TOKEN_INVALID", "The CSRF tokens do not match.")
    }
}
