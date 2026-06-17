import { signUp } from "@/api/signUp.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { RedirectOptionsSchema } from "@/schemas.ts"
import type { SignUpConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/shared/identity.ts"

const signUpConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: SignUpConfig<Identity, SignUpSchema>
) => {
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
export const signUpAction = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: SignUpConfig<Identity, SignUpSchema>
) => {
    return createEndpoint(
        "POST",
        "/signUp",
        async (ctx) => {
            // @ts-ignore - Deep generic inference with router body type is currently too expensive.
            const payload = ctx.body as any
            const { toResponse } = await signUp({
                ctx: ctx.context,
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
