import crypto from "node:crypto"
import { signJWS, verifyJWS } from "@/jose.js"

export const generateSecure = (length: number = 32) => {
    return crypto.randomBytes(length).toString("base64url")
}

export const createHash = (data: string, base: "hex" | "base64" | "base64url" = "hex") => {
    return crypto.createHash("sha256").update(data).digest().toString(base)
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
    const codeVerifier = verifier ?? generateSecure(86)
    const codeChallenge = createHash(codeVerifier, "base64url")
    return { codeVerifier, codeChallenge, method: "S256" }
}

/**
 * Signs and verifies a CSRF token using JWS. If a valid CSRF cookie is provided, it verifies and returns it.
 *
 * @param csrfCookie If provided, the function will verify this existing CSRF token.
 * @returns the signed CSRF token.
 */
export const createCSRF = async (csrfCookie?: string) => {
    try {
        const token = generateSecure(32)
        if (csrfCookie) {
            await verifyJWS(csrfCookie)
            return csrfCookie
        }
        return signJWS({ token })
    } catch {
        const token = generateSecure(32)
        return signJWS({ token })
    }
}
export const verifyCSRF = async (csrfToken: string): Promise<boolean> => {
    try {
        await verifyJWS(csrfToken)
        return true
    } catch {
        return false
    }
}
