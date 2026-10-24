import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { verifyEmail } from "@/api/verify-email.ts"
import { VerifyEmailActionResponseSchema, VerifyEmailSearchParamsSchema } from "@/shared/schemas/actions.ts"

const verifyEmailConfig = () => {
    return createEndpointConfig({
        schemas: {
            response: VerifyEmailActionResponseSchema,
            searchParams: VerifyEmailSearchParamsSchema,
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
