import { z } from "zod/v4"
import { updateSession } from "@/api/updateSession.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"

export const config = createEndpointConfig({
    schemas: {
        body: z.object({
            name: z.string().optional(),
            email: z.email().optional(),
            image: z.string().optional(),
        }),
    },
})

export const updateSessionAction = createEndpoint(
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
    config
)
