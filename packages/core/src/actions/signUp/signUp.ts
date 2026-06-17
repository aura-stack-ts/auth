import { signUp } from "@/api/signUp.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { RedirectOptionsSchema } from "@/schemas.ts"
import type { SignUpConfig } from "@/@types/config.ts"

const signUpConfig = (config: SignUpConfig<any, any>) => {
    return createEndpointConfig({
        schemas: {
            body: config?.schema,
            searchParams: RedirectOptionsSchema,
        },
    })
}

/**
 * Handles the user sign-up process. It validates the incoming request against the provided schema,
 * creates a new user using the `onCreateUser` callback.
 *
 * @returns The signed-up user's session
 */
export const signUpAction = (config: SignUpConfig<any, any>) => {
    return createEndpoint(
        "POST",
        "/signUp",
        async (ctx) => {
            const payload = ctx.body
            const { toResponse } = await signUp({
                ctx: ctx.context,
                payload,
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
