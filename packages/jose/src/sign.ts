import crypto from "node:crypto"
import { jwtVerify, SignJWT, type JWTPayload } from "jose"
import type { SecretInput } from "@/index.js"
import { createSecret } from "@/secret.js"

/**
 * Sign a standard JWT token with the following claims:
 *  - alg: algorithm used to sign the JWT
 *  - typ: type of the token
 *  - iat: time at which the JWT was issued
 *  - nbf: not before time of the JWT
 *  - exp: expiration time of the JWT
 *  - jti: unique identifier to avoid collisions
 *
 * @param payload - Payload data information to sign the JWT
 * @param secret - Secret key to sign the JWT (CryptoKey, KeyObject, string or Uint8Array)
 * @returns Signed JWT string
 */
export const signJWS = async (payload: JWTPayload, secret: SecretInput): Promise<string> => {
    const secretKey = createSecret(secret)
    const jti = crypto.randomBytes(32).toString("base64")

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setNotBefore("0s")
        .setExpirationTime("15d")
        .setJti(jti)
        .sign(secretKey)
}

/**
 * Verify the integrity of a JWT token and return the payload if valid, rejecting
 * tokens that use the "none" algorithm to prevent unsecured tokens.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7519#section-6 Unsecured JWTs
 * @param token - JWT string to verify
 * @param secret - CryptoKey or KeyObject used to verify the JWT
 * @returns verify and return the payload of the JWT
 */
export const verifyJWS = async (token: string, secret: SecretInput): Promise<JWTPayload> => {
    try {
        const secretKey = createSecret(secret)
        const { payload } = await jwtVerify(token, secretKey)
        return payload
    } catch (error) {
        throw new Error("Invalid JWS")
    }
}

/**
 * Create a JWS (JSON Web Signature) signer and verifier. It implements the `signJWS`
 * and `verifyJWS` functions of the module.
 *
 * @param secret - Secret key used for signing and verifying the JWS
 * @returns signJWS and verifyJWS functions
 */
export const createJWS = (secret: SecretInput) => {
    const secretKey = createSecret(secret)

    return {
        signJWS: (payload: JWTPayload) => signJWS(payload, secretKey),
        verifyJWS: (payload: string) => verifyJWS(payload, secretKey),
    }
}
