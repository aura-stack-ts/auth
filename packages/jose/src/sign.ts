import { base64url, jwtVerify, SignJWT, type JWTPayload, type JWTVerifyOptions } from "jose"
import { createSecret } from "@/secret.js"
import { getRandomBytes } from "@/runtime.js"
import { isAuraJoseError, isFalsy, isInvalidPayload } from "@/assert.js"
import { JWSSigningError, JWSVerificationError, InvalidPayloadError } from "./errors.js"
import type { SecretInput } from "@/index.js"

export type { JWTVerifyOptions } from "jose"

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
    try {
        if (isInvalidPayload(payload)) {
            throw new InvalidPayloadError("The payload must be a non-empty object")
        }
        const secretKey = createSecret(secret)
        const jti = base64url.encode(getRandomBytes(32))

        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setNotBefore(payload.nbf ?? "0s")
            .setExpirationTime(payload.exp ?? "15d")
            .setJti(jti)
            .sign(secretKey)
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWSSigningError("JWS signing failed", { cause: error })
    }
}

/**
 * Verify the integrity of a JWT token and return the payload if valid, rejecting
 * tokens that use the "none" algorithm to prevent unsecured tokens.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7519#section-6 Unsecured JWTs
 * @param token - JWT string to verify
 * @param secret - CryptoKey or KeyObject used to verify the JWT
 * @param options - Additional JWT verification options
 * @returns verify and return the payload of the JWT
 */
export const verifyJWS = async (token: string, secret: SecretInput, options?: JWTVerifyOptions): Promise<JWTPayload> => {
    try {
        if (isFalsy(token)) {
            throw new InvalidPayloadError("The token must be a non-empty string")
        }
        const secretKey = createSecret(secret)
        const { payload } = await jwtVerify(token, secretKey, options)
        return payload
    } catch (error) {
        if (isAuraJoseError(error)) {
            throw error
        }
        throw new JWSVerificationError("JWS signature verification failed", { cause: error })
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
    return {
        signJWS: (payload: JWTPayload) => signJWS(payload, secret),
        verifyJWS: (payload: string, options?: JWTVerifyOptions) => verifyJWS(payload, secret, options),
    }
}
