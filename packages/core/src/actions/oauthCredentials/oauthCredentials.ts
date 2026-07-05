import { getCookie } from "@/cookie.ts"
import { createEndpoint } from "@aura-stack/router/endpoint"

const getOAuthCredentials = createEndpoint("GET", "/oauth/credentials", async (ctx) => {
    const {
        request,
        context: { cookies },
    } = ctx
    getCookie(request, cookies.accessToken.name)

    return ctx.json({})
})
