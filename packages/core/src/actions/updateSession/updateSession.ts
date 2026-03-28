import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { IdentityConfig } from "@/@types/config.ts"
import { updateSession } from "@/api/updateSession.ts"
import type { User } from "@/@types/session.ts"

export const config = (identity: IdentityConfig) => {
    return createEndpointConfig({
        schemas: {
            body: z.object({
                user: identity.schema?.partial().optional(),
                expires: z.iso.date().optional(),
            }),
        },
    })
}

export const updateSessionAction = (identity: IdentityConfig) => {
    return createEndpoint(
        "PATCH",
        "/session",
        async (ctx) => {
            const updated = await updateSession({
                ctx: ctx.context,
                headers: ctx.request.headers,
                session: {
                    user: ctx.body.user as User,
                    expires: ctx.body.expires,
                },
            })
            return Response.json(updated, { status: updated.updated ? 200 : 401 })
        },
        config(identity)
    )
}
