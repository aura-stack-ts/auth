import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { forgotPassword } from "@/api/forgot-password.ts"
import { ForgotPasswordBodySchema, ForgotPasswordResponseSchema, RedirectOptionsSchema } from "@/shared/schemas/actions.ts"

const forgotPasswordConfig = () => {
    return createEndpointConfig({
        schemas: {
            body: ForgotPasswordBodySchema,
            searchParams: RedirectOptionsSchema,
            response: ForgotPasswordResponseSchema,
        },
    })
}

export const forgotPasswordAction = () => {
    return createEndpoint(
        "POST",
        "/password/forgot",
        async (ctx) => {
            const { toResponse } = await forgotPassword(ctx.body.email, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        forgotPasswordConfig()
    )
}
