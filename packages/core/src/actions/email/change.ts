import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { changeEmail } from "@/api/change-email.ts"
import { ChangeEmailBodySchema, ChangeEmailResponseSchema, RedirectOptionsSchema } from "@/shared/schemas/actions.ts"

const changeEmailActionConfig = () => {
    return createEndpointConfig({
        schemas: {
            body: ChangeEmailBodySchema,
            searchParams: RedirectOptionsSchema,
            response: ChangeEmailResponseSchema,
        },
    })
}

export const changeEmailAction = () => {
    return createEndpoint(
        "POST",
        "/email/change",
        async (ctx) => {
            const { toResponse } = await changeEmail({
                ctx: ctx.context,
                payload: ctx.body,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        changeEmailActionConfig()
    )
}
