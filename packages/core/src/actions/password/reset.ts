import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { resetPassword } from "@/api/reset-password.ts"
import { RedirectOptionsSchema, ResetPasswordBodySchema, ResetPasswordResponseSchema } from "@/shared/schemas/actions.ts"

const resetPasswordConfig = () => {
    return createEndpointConfig({
        schemas: {
            body: ResetPasswordBodySchema,
            searchParams: RedirectOptionsSchema,
            response: ResetPasswordResponseSchema,
        },
    })
}

export const resetPasswordAction = () => {
    return createEndpoint(
        "POST",
        "/password/reset",
        async (ctx) => {
            const { toResponse } = await resetPassword({
                ctx: ctx.context,
                payload: ctx.body,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        resetPasswordConfig()
    )
}
