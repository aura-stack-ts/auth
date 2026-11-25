import { encoder } from "@aura-stack/jose"
import { getEnv } from "@/shared/utils/get-env.ts"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"

export const createBasicAuthHeader = (username: string, password: string): string => {
    const getUsername = getEnv(username) ?? username
    const getPassword = getEnv(password) ?? password
    if (!getUsername || !getPassword) {
        throw new AuraAuthError({ code: "AUTH_BASIC_CREDENTIALS_INVALID" })
    }
    const credentials = `${getUsername}:${getPassword}`
    const binaryCredentials = String.fromCharCode.apply(null, Array.from(encoder.encode(credentials)))
    return `Basic ${btoa(binaryCredentials)}`
}
