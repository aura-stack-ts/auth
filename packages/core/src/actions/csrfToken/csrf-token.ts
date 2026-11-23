import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { createCSRF } from "@/exports/crypto.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { getCookieStore } from "@/shared/utils/get-cookie-store.ts"
import { setCookie, getOptionalCookie } from "@/shared/http/cookie.ts"
import { CSRFTokenActionResponseSchema } from "@/shared/schemas/actions.ts"

const config = createEndpointConfig({
    schemas: {
        response: CSRFTokenActionResponseSchema,
    },
})

export const csrfTokenAction = createEndpoint(
    "GET",
    "/csrfToken",
    async (ctx) => {
        const {
            request,
            context: { jose, logger },
        } = ctx
        const store = getCookieStore({ ctx: ctx.context, request })
        const token = getOptionalCookie(request, store.csrfToken.name)
        logger?.log("CSRF_TOKEN_REQUESTED", { structuredData: { has_token: Boolean(token) } })
        const csrfToken = await createCSRF(jose.instance, token)
        logger?.log("CSRF_TOKEN_ISSUED", { structuredData: { issued: Boolean(csrfToken) } })

        const headers = new Headers(secureApiHeaders)
        headers.append("Set-Cookie", setCookie(store.csrfToken.name, csrfToken, store.csrfToken.attributes))
        return ctx.json({ csrfToken }, { headers })
    },
    config
)
