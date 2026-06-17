import { isJWTPayloadWithToken } from "@/shared/assert.ts"
import { equals, timingSafeEqual } from "@/shared/utils.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { exportJWK, generateKeyPair, importPKCS8, importSPKI, type GenerateKeyPairOptions } from "@aura-stack/jose/jose"
import { base64url, encoder, getRandomBytes, getSubtleCrypto } from "@/jose.ts"
import type { AsymmetricKeyPairFromEnv, AuthRuntimeConfig, JoseInstance, User } from "@/@types/index.ts"

export { generateKeyPair as createKeyPair } from "@aura-stack/jose/jose"

export const createSecretValue = (length: number = 32) => {
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
    const codeVerifier = verifier ?? createSecretValue(byteLength ?? 64)
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
        throw new AuraAuthError({ code: "PKCE_VERIFIER_INVALID" })
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
        if (csrfCookie) {
            await jose.verifyJWS(csrfCookie)
            return csrfCookie
        }
        const token = createSecretValue(32)
        return jose.signJWS({ token })
    } catch {
        const token = createSecretValue(32)
        return jose.signJWS({ token })
    }
}

export const verifyCSRF = async <DefaultUser extends User = User>(
    jose: JoseInstance<DefaultUser>,
    cookie: string,
    header: string
): Promise<boolean> => {
    try {
        const cookiePayload = await jose.verifyJWS(cookie)
        const headerPayload = await jose.verifyJWS(header)

        if (!isJWTPayloadWithToken(cookiePayload)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
        }
        if (!isJWTPayloadWithToken(headerPayload)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
        }

        if (!equals(cookiePayload.token.length, headerPayload.token.length)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISMATCH" })
        }
        if (!timingSafeEqual(cookiePayload.token, headerPayload.token)) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISMATCH" })
        }
        return true
    } catch (error) {
        if (isAuraAuthError(error)) {
            throw error
        }
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING", cause: error })
    }
}

/**
 * Hashes a password using PBKDF2 with SHA-256.
 * PBKDF2 is available in standard Web Crypto (SubtleCrypto).
 *
 * @param password - The password to hash.
 * @param salt - Optional salt (base64url encoded). If not provided, a random salt will be generated.
 * @param iterations - The number of PBKDF2 iterations. Default is 100,000.
 * @returns The hashed password in the format `iterations:salt:hash` (all segments base64url encoded).
 */
export const hashPassword = async (password: string, salt?: string, iterations = 100000) => {
    const subtle = getSubtleCrypto()
    const saltBuffer = (salt ? base64url.decode(salt) : getRandomBytes(16)) as Uint8Array<ArrayBuffer>
    const baseKey = await subtle.importKey("raw", encoder.encode(password) as Uint8Array<ArrayBuffer>, "PBKDF2", false, [
        "deriveBits",
    ])
    const derivedKey = await subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: saltBuffer,
            iterations,
            hash: "SHA-256",
        },
        baseKey,
        256
    )
    const hashValues = new Uint8Array(derivedKey)
    const hash = base64url.encode(hashValues)
    const saltStr = base64url.encode(saltBuffer)
    return `pbkdf2-sha256:${iterations}:${saltStr}:${hash}`
}

/**
 * Verifies a password against a hashed value.
 *
 * @param password - The password to verify.
 * @param hashedPassword - The hashed password to compare against.
 * @returns A promise that resolves to true if the password matches the hash, false otherwise.
 */
export const verifyPassword = async (password: string, hashedPassword: string) => {
    try {
        const segments = hashedPassword.split(":")
        if (segments.length !== 4) return false
        const [scheme, iterationsStr, saltStr] = segments
        if (scheme !== "pbkdf2-sha256") return false
        const iterations = parseInt(iterationsStr, 10)
        if (isNaN(iterations)) return false
        const newHashed = await hashPassword(password, saltStr, iterations)
        const [, , , hashA] = newHashed.split(":")
        const [, , , hashB] = hashedPassword.split(":")
        if (!hashA || !hashB) return false
        return timingSafeEqual(hashA, hashB)
    } catch {
        return false
    }
}

/**
 * Imports a PEM-formatted asymmetric key pair from strings.
 *
 * @param key - An object containing the public and private keys as PEM-formatted strings
 * @param algorithm - The intended algorithm for the keys (e.g. "RS256" for RSA signing, "RSA-OAEP" for RSA encryption)
 * @returns A Promise that resolves to a CryptoKeyPair with the imported keys
 */
export const importPEMKeyPair = async (key: AsymmetricKeyPairFromEnv, algorithm: string) => {
    const importedPrivateKey = await importPKCS8(key.privateKey, algorithm, { extractable: true })
    const importedPublicKey = await importSPKI(key.publicKey, algorithm, { extractable: true })
    return {
        publicKey: importedPublicKey,
        privateKey: importedPrivateKey,
    }
}

/**
 * Generates a new asymmetric key pair and exports it in JWK format.
 *
 * @param alg - The intended algorithm for the keys (e.g. "RS256" for RSA signing, "RSA-OAEP" for RSA encryption)
 * @param options - Optional parameters for key generation (e.g. modulusLength for RSA)
 * @returns A Promise that resolves to an object containing the public and private keys in JWK format
 */
export const exportJWKKeyPair = async (alg: string, options?: GenerateKeyPairOptions) => {
    const { publicKey, privateKey } = await generateKeyPair(alg, options)
    const jwkPublicKey = await exportJWK(publicKey)
    const jwkPrivateKey = await exportJWK(privateKey)
    return {
        publicKey: jwkPublicKey,
        privateKey: jwkPrivateKey,
    }
}
