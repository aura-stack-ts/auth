import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { getExpiredCookie, getOptionalCookie } from "@/shared/http/cookie.ts"
import type { InternalCookieStoreConfig } from "@/@types/internal.ts"

export const createCookieManager = () => {
    const getCookie = (request: Request | Headers, store: InternalCookieStoreConfig) => {
        const sessionToken = getOptionalCookie(request, store.sessionToken.name)
        return {
            sessionToken,
        }
    }

    const setCookie = ({ sessionToken, store }: { sessionToken: string; store: InternalCookieStoreConfig }) => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(store.sessionToken.name, sessionToken, store.sessionToken.attributes)
            .toHeaders()
    }

    const clear = (store: InternalCookieStoreConfig) => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(store.sessionToken.name, "", getExpiredCookie(store.sessionToken.attributes))
            .toHeaders()
    }

    const clearAll = (store: InternalCookieStoreConfig) => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(store.csrfToken.name, "", getExpiredCookie(store.csrfToken.attributes))
            .setCookie(store.sessionToken.name, "", getExpiredCookie(store.sessionToken.attributes))
            .toHeaders()
    }

    return { getCookie, setCookie, clear, clearAll }
}
