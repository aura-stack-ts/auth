import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { signInCredentials } from "@/api/credentials.ts"
import { RedirectOptionsSchema } from "@/schemas.ts"
import type { SignUpConfig } from "@/@types/config.ts"

const signUpConfig = (config: SignUpConfig<any, any>) => {
    return createEndpointConfig({
        schemas: {
            body: config.schema,
            searchParams: RedirectOptionsSchema,
        },
    })
}

/**
 * Handles the credentials-based sign-in flow.
 * It extracts credentials from the request body, calls the provider's `authorize` function,
 * validates the returned user object, and creates a session.
 *
 * @returns The signed-in user and session cookies.
 */
export const signUpAction = (config: SignUpConfig<any, any>) => {
    return createEndpoint(
        "POST",
        "/signUp",
        async (ctx) => {
            const payload = ctx.body
            const { toResponse } = await signInCredentials({
                ctx: ctx.context,
                // Add type-inference from signUp.schema
                // @ts-ignore
                payload: payload,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        signUpConfig(config)
    )
}
