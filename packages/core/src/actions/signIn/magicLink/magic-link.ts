import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { sendMagicLink } from "@/api/send-magic-link.ts"
import { MagicLinkBodySchema, MagicLinkResponseSchema, RedirectOptionsSchema } from "@/shared/schemas/actions.ts"

const sendMagicLinkConfig = () => {
    return createEndpointConfig({
        schemas: {
            body: MagicLinkBodySchema,
            searchParams: RedirectOptionsSchema,
            response: MagicLinkResponseSchema,
        },
    })
}

export const sendMagicLinkAction = () => {
    return createEndpoint(
        "POST",
        "/signIn/magicLink",
        async (ctx) => {
            const { toResponse } = await sendMagicLink(ctx.body.email, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        sendMagicLinkConfig()
    )
}
