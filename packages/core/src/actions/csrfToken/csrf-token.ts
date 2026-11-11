import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { createCSRF } from "@/exports/crypto.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
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
            context: { jose, cookies, logger },
        } = ctx
        const token = getOptionalCookie(request, cookies.store.csrfToken.name)
        logger?.log("CSRF_TOKEN_REQUESTED", { structuredData: { has_token: Boolean(token) } })
        const csrfToken = await createCSRF(jose.instance, token)
        logger?.log("CSRF_TOKEN_ISSUED", { structuredData: { issued: Boolean(csrfToken) } })

        const headers = new Headers(secureApiHeaders)
        headers.append("Set-Cookie", setCookie(cookies.store.csrfToken.name, csrfToken, cookies.store.csrfToken.attributes))
        return ctx.json({ csrfToken }, { headers })
    },
    config
)
