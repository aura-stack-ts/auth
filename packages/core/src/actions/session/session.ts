import { createEndpoint } from "@aura-stack/router"
import { getSession } from "@/api/getSession.ts"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const { toResponse } = await getSession({ ctx: ctx.context, headers: ctx.request.headers })
    return toResponse()
})
