import { createClient as createClientAPI } from "@aura-stack/router"
import { getEnv } from "@/shared/env.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { getSafeRedirectTo } from "@/shared/utils/client.ts"
import type { AuthClient, AuthClientOptions } from "@/@types/client.ts"

export const createClient = createClientAPI<AuthClient>

export const createClientContext = (options?: AuthClientOptions) => {
    const baseURL = getEnv("BASE_URL") || options?.baseURL || (typeof window !== "undefined" && window.location.origin)
    if (!baseURL) {
        throw new AuraAuthError({ code: "CLIENT_BASE_URL_MISSING" })
    }

    const client = createClient({
        baseURL,
        cache: "no-store",
        credentials: "include",
        ...options,
    })
    const trustedOrigins = [...(options?.trustedOrigins ? options.trustedOrigins : []), baseURL]

    const getSafeRedirect = getSafeRedirectTo({ baseURL, trustedOrigins, fallbackRedirectTo: options?.fallbackRedirectTo })
    return {
        client,
        options,
        getSafeRedirect,
    }
}

export type ClientContext = ReturnType<typeof createClientContext>
