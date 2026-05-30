import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { signInCredentials } from "@/api/credentials.ts"
import { RedirectOptionsSchema, CredentialsPayloadSchema } from "@/schemas"

const config = createEndpointConfig({
    schemas: {
        body: CredentialsPayloadSchema,
        searchParams: RedirectOptionsSchema,
    },
})

/**
 * Handles the credentials-based sign-in flow.
 * It extracts credentials from the request body, calls the provider's `authorize` function,
 * validates the returned user object, and creates a session.
 *
 * @returns The signed-in user and session cookies.
 */
export const signInCredentialsAction = createEndpoint(
    "POST",
    "/signIn/credentials",
    async (ctx) => {
        const payload = ctx.body
        const { toResponse } = await signInCredentials({
            ctx: ctx.context,
            payload,
            request: ctx.request,
            headers: ctx.request.headers,
            redirect: ctx.searchParams.redirect,
            redirectTo: ctx.searchParams.redirectTo,
        })
        return toResponse()
    },
    config
)
