import { AuraAuthError } from "@/errors/aura-error.ts"
import { getSafeURL } from "@/shared/utils/get-safe-url.ts"
import type { ClientContext } from "@/client/context.ts"
import type { ClientSideReturnData } from "@/@types/api.ts"
import type { OptionsWithRedirectTo } from "@/@types/client.ts"

export const getCSRFToken = async ({ client }: ClientContext) => {
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

export const getSafeRedirectTo = ({
    baseURL,
    trustedOrigins,
    fallbackRedirectTo,
}: {
    baseURL: string
    trustedOrigins: string[]
    fallbackRedirectTo: string | undefined
}) => {
    return <Options extends OptionsWithRedirectTo>(options?: Options) => {
        const safeRedirectTo = [options?.redirectTo, options?.fallbackRedirectTo, fallbackRedirectTo].find((redirectTo) =>
            getSafeURL({ baseURL, url: redirectTo!, trustedOrigins })
        )
        if (safeRedirectTo === undefined && options?.redirectTo !== undefined) return "/"
        return safeRedirectTo
    }
}
