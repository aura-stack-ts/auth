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
        hooks: {
            onError: (ctx) => {
                return ctx.json(
                    {
                        type: "VALIDATION",
                        code: "INVALID_RESET_PASSWORD_TOKEN",
                        message: "Invalid or expired reset password token",
                    },
                    { status: 422 }
                )
            },
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
