import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { signOut } from "@/api/signOut.ts"
import { SignOutActionResponseSchema, SignOutSearchParamsSchema } from "@/shared/schemas/actions.ts"

const config = createEndpointConfig({
    schemas: {
        searchParams: SignOutSearchParamsSchema,
        response: SignOutActionResponseSchema,
    },
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7009
 */
export const signOutAction = createEndpoint(
    "POST",
    "/signOut",
    async (ctx) => {
        const { toResponse } = await signOut({
            ctx: ctx.context,
            request: ctx.request,
            headers: ctx.request.headers,
            redirect: ctx.searchParams.redirect,
            redirectTo: ctx.searchParams.redirectTo,
            skipCSRFCheck: false,
        })
        return toResponse()
    },
    config
)
