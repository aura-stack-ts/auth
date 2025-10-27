import { JWTPayload, jwtVerify, SignJWT } from "jose"
import { getSecret } from "./secret.js"

export const sign = async (payload: JWTPayload) => {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setIssuedAt()
        .setNotBefore(Date.now())
        .setExpirationTime("15d")
        .sign(getSecret())
}

export const verify = async (token: string) => {
    try {
        const { payload, protectedHeader } = await jwtVerify(token, getSecret())
        if (protectedHeader.alg === "none") {
            throw new Error("Invalid JWT")
        }
        return payload
    } catch {
        throw new Error("Invalid JWT")
    }
}
