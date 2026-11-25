import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { cancelEmailChange } from "@/api/cancel-email-change.ts"
import { CancelEmailChangeResponseSchema, CancelEmailChangeSearchParamsSchema } from "@/shared/schemas/actions.ts"

const cancelEmailChangeActionConfig = () => {
    return createEndpointConfig({
        schemas: {
            searchParams: CancelEmailChangeSearchParamsSchema,
            response: CancelEmailChangeResponseSchema,
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

export const cancelEmailChangeAction = () => {
    return createEndpoint(
        "GET",
        "/email/change/cancel",
        async (ctx) => {
            const { toResponse } = await cancelEmailChange({
                ctx: ctx.context,
                payload: ctx.searchParams.token ? { token: ctx.searchParams.token } : undefined,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
                skipCSRFCheck: false,
            })
            return toResponse()
        },
        cancelEmailChangeActionConfig()
    )
}
