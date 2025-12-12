import crypto from "node:crypto"
import { equals } from "./utils.js"
import { InvalidCsrfTokenError } from "./error.js"
import { AuthConfigInternal } from "./@types/index.js"

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
 *
 * @param csrfCookie - Optional existing CSRF cookie to verify and reuse
 * @returns Signed CSRF token
 */
export const createCSRF = async (jose: AuthConfigInternal["jose"], csrfCookie?: string) => {
    try {
        const token = generateSecure(32)
        if (csrfCookie) {
            await jose.verifyJWS(csrfCookie)
            return csrfCookie
        }
        return jose.signJWS({ token })
    } catch {
        const token = generateSecure(32)
        return jose.signJWS({ token })
    }
}

export const verifyCSRF = async (jose: AuthConfigInternal["jose"], cookie: string, header: string): Promise<boolean> => {
    try {
        const { token: cookieToken } = await jose.verifyJWS(cookie)
        const { token: headerToken } = await jose.verifyJWS(header)
        const cookieBuffer = Buffer.from(cookieToken as string)
        const headerBuffer = Buffer.from(headerToken as string)
        if (!equals(headerBuffer.length, cookieBuffer.length)) {
            throw new InvalidCsrfTokenError()
        }
        if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
            throw new InvalidCsrfTokenError()
        }
        return true
    } catch {
        throw new InvalidCsrfTokenError()
    }
}

/**
 * Creates a deterministic derived salt from the provided secret.
 *
 * @param secret the base secret to derive the salt from
 * @returns the derived salt as a hexadecimal string
 */
export const createDerivedSalt = (secret: string) => {
    return crypto.createHash("sha256").update(secret).update("aura-auth-salt").digest("hex")
}
