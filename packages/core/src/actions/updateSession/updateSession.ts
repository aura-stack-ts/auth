import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { updateSession } from "@/api/updateSession.ts"
import type { User } from "@/@types/session.ts"
import type { IdentityConfig } from "@/@types/config.ts"

export const config = (identity: IdentityConfig) => {
    return createEndpointConfig({
        schemas: {
            body: z.object({
                user: identity.schema?.partial().optional(),
                expires: z.coerce.date().optional(),
            }),
        },
    })
}

export const updateSessionAction = (identity: IdentityConfig) => {
    return createEndpoint(
        "PATCH",
        "/session",
        async (ctx) => {
            const { toResponse } = await updateSession({
                ctx: ctx.context,
                headers: ctx.request.headers,
                session: {
                    user: ctx.body.user as User,
                    expires: ctx.body.expires?.toISOString(),
                },
            })
            return toResponse()
        },
        config(identity)
    )
}
