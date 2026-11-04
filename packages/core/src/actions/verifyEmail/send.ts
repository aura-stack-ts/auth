import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { sendVerificationEmail } from "@/api/send-verification-email.ts"
import {
    RedirectOptionsSchema,
    SendVerificationEmailActionResponseSchema,
    SendVerificationEmailBodySchema,
} from "@/shared/schemas/actions.ts"

const sendVerificationEmailConfig = () => {
    return createEndpointConfig({
        schemas: {
            searchParams: RedirectOptionsSchema,
            body: SendVerificationEmailBodySchema,
            response: SendVerificationEmailActionResponseSchema,
        },
    })
}

export const sendVerificationEmailAction = () => {
    return createEndpoint(
        "POST",
        "/emailVerification/send",
        async (ctx) => {
            const { toResponse } = await sendVerificationEmail(ctx.body.email, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        sendVerificationEmailConfig()
    )
}
