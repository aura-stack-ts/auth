import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { verifyEmailChange } from "@/api/verify-email-change.ts"
import { VerifyEmailChangeResponseSchema, VerifyEmailChangeSearchParamsSchema } from "@/shared/schemas/actions.ts"

const verifyEmailChangeActionConfig = () => {
    return createEndpointConfig({
        schemas: {
            response: VerifyEmailChangeResponseSchema,
            searchParams: VerifyEmailChangeSearchParamsSchema,
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

export const verifyEmailChangeAction = () => {
    return createEndpoint(
        "GET",
        "/email/change/verify",
        async (ctx) => {
            const { toResponse } = await verifyEmailChange({
                ctx: ctx.context,
                payload: {
                    token: ctx.searchParams.token,
                },
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        verifyEmailChangeActionConfig()
    )
}
