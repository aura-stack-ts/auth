/**
 * @aura-stack/session
 */
import { JWTPayload } from "jose"
import { decrypt, encrypt } from "./encrypt.js"
import { sign, verify } from "./sign.js"
import { setCookie, getCookie, type CookieName, type LiteralUnion } from "./cookie.js"

/**
 * Sign a JWT using the RS-256 algorithm. It creates a representation as a
 * sequence of URL-Safe parts separated by dots between the JWT parts. The
 * sections are enconded in base64-url encoded format.
 *
 * Future:
 * - Verify that can't create JWTs with duplicated claims
 * - Validate the iss was created by the oauth service
 *
 * Notes:
 * - iss: tells who creates the JWT
 * - aud: set the reason of the creation of the JWT
 * - exp: valid time of the JWT
 * - iat: define the time which was created the JWT
 * - jti (RECOMMENDED): define a name to avoid collisions -> RANDOMIZED
 * - sub: user id or a unique Id to identify the user
 *
 * Jose Headers
 * - cty: used to define that is a nested JWT as encrypted or signed
 *
 * Public Claims
 * - contains additional information about user
 * - name, email, roles, id
 *
 * Private Claims
 * - contains additional information about user or the session
 * - id, configs
 * - it's recommended sign this claims to ensure future alterations
 *
 *
 * Based on the RFC 7519 standard
 * https://datatracker.ietf.org/doc/html/rfc7519
 * the nested JWTs should be signed and then encrypted
 * https://datatracker.ietf.org/doc/html/rfc7519#section-5.2
 * order to ensure the integrity and confidentiality of the claims
 * https://datatracker.ietf.org/doc/html/rfc7519#section-11.2
 */
export const encode = async (cookieName: LiteralUnion<CookieName>, token: JWTPayload) => {
    try {
        const signed = await sign(token)
        const encrypted = await encrypt(signed)
        return setCookie(cookieName, encrypted)
    } catch {
        throw new Error("Failed to encode JWT")
    }
}

export const decode = async (token: string) => {
    try {
        const decrypted = await decrypt(token)
        const verified = await verify(decrypted)
        return verified
    } catch {
        throw new Error("Failed to decode JWT")
    }
}
