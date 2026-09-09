import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { createCSRF } from "@/shared/crypto.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { setCookie, getOptionalCookie } from "@/cookie.ts"
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
        const token = getOptionalCookie(request, cookies.csrfToken.name)
        logger?.log("CSRF_TOKEN_REQUESTED", { structuredData: { has_token: Boolean(token) } })
        const csrfToken = await createCSRF(jose, token)
        logger?.log("CSRF_TOKEN_ISSUED", { structuredData: { issued: Boolean(csrfToken) } })

        const headers = new Headers(secureApiHeaders)
        headers.append("Set-Cookie", setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes))
        return ctx.json({ csrfToken }, { headers })
    },
    config
)
