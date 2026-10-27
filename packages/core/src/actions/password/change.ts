import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { changePassword } from "@/api/change-password.ts"
import { ChangePasswordBodySchema, ChangePasswordResponseSchema, RedirectOptionsSchema } from "@/shared/schemas/actions.ts"

const changePasswordConfig = () => {
    return createEndpointConfig({
        schemas: {
            body: ChangePasswordBodySchema,
            searchParams: RedirectOptionsSchema,
            response: ChangePasswordResponseSchema,
        },
    })
}

export const changePasswordAction = () => {
    return createEndpoint(
        "POST",
        "/password/change",
        async (ctx) => {
            const { toResponse } = await changePassword({
                ctx: ctx.context,
                payload: ctx.body,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        changePasswordConfig()
    )
}
