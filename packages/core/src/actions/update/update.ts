import { z } from "zod/v4"
import { updateSession } from "@/api/updateSession.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { RouterGlobalContext } from "@/@types/config.ts"

export const config = createEndpointConfig({
    schemas: {
        body: z.object({
            name: z.string().optional(),
            email: z.email().optional(),
            image: z.string().optional(),
        }),
    },
})

export const update = createEndpoint(
    "PATCH",
    "/session/update",
    async (ctx) => {
        const updated = await updateSession({
            ctx: ctx as unknown as RouterGlobalContext,
            headers: ctx.request.headers,
            session: {
                user: ctx.body,
            },
            skipCSRFCheck: false,
        })
        return Response.json(updated)
    },
    config
)
