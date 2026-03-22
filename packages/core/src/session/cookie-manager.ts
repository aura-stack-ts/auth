import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/headers.ts"
import { expiredCookieAttributes, getCookie as getCookieByName } from "@/cookie.ts"
import type { CookieStoreConfig } from "@/@types/index.ts"

export const createCookieManager = (config: () => CookieStoreConfig) => {
    const getCookie = (request: Request | Headers) => {
        const sessionToken = getCookieByName(request, config().sessionToken.name)
        return {
            sessionToken,
        }
    }

    const setCookie = ({ sessionToken }: { sessionToken: string }) => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(config().sessionToken.name, sessionToken, config().sessionToken.attributes)
            .toHeaders()
    }

    const clear = () => {
        return new HeadersBuilder(secureApiHeaders)
            .setCookie(config().csrfToken.name, "", expiredCookieAttributes)
            .setCookie(config().sessionToken.name, "", expiredCookieAttributes)
            .toHeaders()
    }
    return { getCookie, setCookie, clear }
}
