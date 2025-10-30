import crypto from "node:crypto"
import { jwtVerify, SignJWT, type JWTPayload, type KeyObject, type CryptoKey } from "jose"

/**
 * Sign a standard JWT token with the following claims:
 *  - alg: algorithm used to sign the JWT
 *  - typ: type of the token
 *  - iat: time at which the JWT was issued
 *  - nbf: not before time of the JWT
 *  - exp: expiration time of the JWT
 *  - jti: unique identifier to avoid collisions
 *
 * @todo Check if the cty (content type) header is needed or useful in the JWE context.
 *
 * @param payload - Payload data information to sign the JWT
 * @param secret - Secret key to sign the JWT (CryptoKey or KeyObject)
 * @returns Promise<string> resolving to the signed JWT
 */
const sign = async (payload: JWTPayload, secret: CryptoKey | KeyObject): Promise<string> => {
    const jti = crypto.randomBytes(32).toString("base64")

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setNotBefore(Date.now())
        .setExpirationTime("15d")
        .setJti(jti)
        .sign(secret)
}

/**
 * Verify the integrity of a JWT token and return the payload if valid, rejecting
 * tokens that use the "none" algorithm to prevent unsecured tokens.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7519#section-6 Unsecured JWTs
 * @param token - JWT string to verify
 * @param secret - CryptoKey or KeyObject used to verify the JWT
 * @returns Promise resolving to the decoded JWT payload
 */
const verify = async (token: string, secret: CryptoKey | KeyObject): Promise<JWTPayload> => {
    try {
        const { payload, protectedHeader } = await jwtVerify(token, secret)
        if (protectedHeader.alg === "none") {
            throw new Error("Invalid JWT")
        }
        return payload
    } catch {
        throw new Error("Invalid JWT")
    }
}

export const createJWS = (secret: string) => {
    const secretKey = crypto.createSecretKey(Buffer.from(secret, "utf-8"))

    return {
        signJWS: (payload: JWTPayload) => sign(payload, secretKey),
        verifyJWS: (payload: string) => verify(payload, secretKey),
    }
}
