import crypto from "node:crypto"

export const generateSecure = (length: number = 32) => {
    return crypto.randomBytes(length).toString("base64")
}

/**
 * @todo: implement
 */
export const createCodeVerifier = () => {
    return generateSecure(64)
}

/**
 * @todo: implement
 */
export const createCodeChallenge = (verifier: string) => {
    const codeChallenge = crypto.createHash("sha256").update(verifier).digest("base64")
    return { codeChallenge, method: "S256" }
}
