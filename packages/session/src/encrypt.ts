import { EncryptJWT, jwtDecrypt } from "jose"
import { getSecret } from "./secret.js"

export interface EncryptedPayload {
    token: string
}

export const encrypt = async (payload: string) => {
    return new EncryptJWT({ token: payload })
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setIssuedAt()
        .setExpirationTime("15h")
        .encrypt(getSecret())
}

export const decrypt = async (token: string) => {
    try {
        const { payload, protectedHeader } = await jwtDecrypt<EncryptedPayload>(token, getSecret())
        if (protectedHeader.alg === "none") {
            throw new Error("Invalid JWT")
        }
        return payload.token
    } catch {
        throw new Error("Invalid JWT")
    }
}
