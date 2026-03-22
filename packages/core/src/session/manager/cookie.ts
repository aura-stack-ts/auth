import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/headers.ts"
import { expiredCookieAttributes, getCookie as getCookieByName } from "@/cookie.ts"
import type { CookieStoreConfig } from "@/@types/index.ts"

export const createCookieManager = (store: () => CookieStoreConfig) => {
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
            .setCookie(store().csrfToken.name, "", { ...expiredCookieAttributes, ...store().csrfToken.attributes })
            .setCookie(store().sessionToken.name, "", { ...expiredCookieAttributes, ...store().sessionToken.attributes })
            .toHeaders()
    }
    return { getCookie, setCookie, clear }
}
