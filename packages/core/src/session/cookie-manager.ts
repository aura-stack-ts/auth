import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getExpiredCookie, getCookie as getCookieByName } from "@/cookie.ts"
import type { InternalCookieStoreConfig } from "@/@types/index.ts"

export const createCookieManager = (store: () => InternalCookieStoreConfig) => {
    const getCookie = (request: Request | Headers) => {
        const sessionToken = getCookieByName(request, store().sessionToken.name)
        return {
            sessionToken,
        }
    }

    const setCookie = ({ sessionToken }: { sessionToken: string }) => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(store().sessionToken.name, sessionToken, store().sessionToken.attributes)
            .toHeaders()
    }

    const clear = () => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(store().csrfToken.name, "", getExpiredCookie(store().csrfToken.attributes))
            .setCookie(store().sessionToken.name, "", getExpiredCookie(store().sessionToken.attributes))
            .toHeaders()
    }
    return { getCookie, setCookie, clear }
}
