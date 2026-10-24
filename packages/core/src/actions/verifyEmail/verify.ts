import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { verifyEmail } from "@/api/verify-email.ts"
import { VerifyEmailActionResponseSchema, VerifyEmailSearchParamsSchema } from "@/shared/schemas/actions.ts"

const verifyEmailConfig = () => {
    return createEndpointConfig({
        schemas: {
            searchParams: VerifyEmailSearchParamsSchema,
            response: VerifyEmailActionResponseSchema,
        },
    })
}

export const verifyEmailAction = () => {
    return createEndpoint(
        "POST",
        "/emailVerification/verify",
        async (ctx) => {
            const { toResponse } = await verifyEmail(ctx.searchParams.token, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        verifyEmailConfig()
    )
}
