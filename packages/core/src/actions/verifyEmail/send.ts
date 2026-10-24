import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { object, string } from "zod/v4"
import { sendVerificationEmail } from "@/api/send-verification-email.ts"
import { RedirectOptionsSchema, VerifyEmailActionResponseSchema } from "@/shared/schemas/actions.ts"

const sendVerificationEmailConfig = () => {
    return createEndpointConfig({
        schemas: {
            body: object({
                email: string(),
            }),
            searchParams: RedirectOptionsSchema,
            response: VerifyEmailActionResponseSchema,
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
