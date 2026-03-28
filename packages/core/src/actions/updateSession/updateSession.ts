import { z } from "zod/v4"
import { updateSession } from "@/api/updateSession.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { IdentityConfig } from "@/@types/config.ts"

export const config = (identity: IdentityConfig) => {
    return createEndpointConfig({
        schemas: {
            body: identity.schema?.partial().extend({
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
                    user: ctx.body,
                },
            })
            return Response.json(updated, { status: updated.updated ? 200 : 401 })
        },
        config(identity)
    )
}
