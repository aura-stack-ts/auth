import { AuraAuthError } from "@/errors/aura-error.ts"
import type { ClientSideReturnData } from "@/@types/api.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"

export const getCSRFToken = async (client: InternalAuthClient) => {
    try {
        const response = await client.get("/csrfToken")
        if (!response.ok) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
        }
        const data = await response.json()
        const token = data.csrfToken
        if (!token) {
            throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING" })
        }
        return token
    } catch (error) {
        console.error("Error fetching CSRF token:", error)
        throw new AuraAuthError({ code: "CSRF_TOKEN_MISSING", cause: error })
    }
}

export const clientAuthResponse = async <R extends ClientSideReturnData>(response: Response, override?: R) => {
    if (!response.ok) {
        return override ? override : { success: false, redirect: false, redirectURL: null }
    }
    return response.json()
}
