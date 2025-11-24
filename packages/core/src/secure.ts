import crypto from "node:crypto"
import { equals } from "./utils.js"

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
 * Creates a CSRF token to be used in OAuth flows to prevent cross-site request forgery attacks.
 *   - token: A cryptographically random string that serves as the CSRF token.
 *   - hash: A hashed version of the token, using SHA-256, to be stored in a cookie.
 *
 * @returns
 */
export const createCSRF = async (csrfCookie?: string) => {
    if (csrfCookie) {
        const [token, hash] = csrfCookie.split(":")
        if (verifyCSRF(token, hash)) {
            return { token, hash: csrfCookie }
        }
    }
    const token = generateSecure(48)
    const hash = createHash(token, "hex")
    return { token, hash: `${token}:${hash}` }
}

export const verifyCSRF = (token: string, hash: string) => {
    const tokenHash = createHash(token, "hex")
    return equals(tokenHash, hash)
}
