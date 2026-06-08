import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { signOut } from "@/api/signOut.ts"
import { RedirectOptionsSchema } from "@/schemas.ts"

const config = createEndpointConfig({
    schemas: {
        searchParams: RedirectOptionsSchema.extend({
            token_type_hint: z.literal("session_token"),
        }),
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
        })
        return toResponse()
    },
    config
)
