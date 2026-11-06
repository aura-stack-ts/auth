import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { verifyMagicLink } from "@/api/verify-magic-link.ts"
import { MagicLinkResponseSchema, MagicLinkSearchParamsSchema } from "@/shared/schemas/actions.ts"

const verifyMagicLinkConfig = () => {
    return createEndpointConfig({
        schemas: {
            searchParams: MagicLinkSearchParamsSchema,
            response: MagicLinkResponseSchema,
        },
        hooks: {
            onError: (ctx) => {
                return ctx.json(
                    {
                        type: "VALIDATION",
                        code: "INVALID_VERIFICATION_TOKEN",
                        message: "Invalid or expired verification token",
                    },
                    { status: 422 }
                )
            },
        },
    })
}

export const verifyMagicLinkAction = () => {
    return createEndpoint(
        "GET",
        "/signIn/magicLink/verify",
        async (ctx) => {
            const { toResponse } = await verifyMagicLink(ctx.searchParams.token, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        verifyMagicLinkConfig()
    )
}
