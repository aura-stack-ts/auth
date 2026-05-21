import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { updateSession } from "@/api/updateSession.ts"
import { getFullSchema } from "@/validator/registry.ts"
import type { User } from "@/@types/session.ts"
import type { SchemaRegistryContext } from "@/@types/config.ts"

export const config = (identity: SchemaRegistryContext) => {
    const bodySchema = getFullSchema(identity.schemaRegistry.schemaAsPartial!)
    return createEndpointConfig({
        schemas: {
            body: bodySchema,
        },
    })
}

export const updateSessionAction = (identity: SchemaRegistryContext) => {
    return createEndpoint(
        "PATCH",
        "/session",
        async (ctx) => {
            const { toResponse } = await updateSession({
                ctx: ctx.context,
                headers: ctx.request.headers,
                session: {
                    user: ctx.body?.user as User,
                    expires: ctx.body?.expires?.toISOString(),
                },
            })
            return toResponse()
        },
        config(identity)
    )
}
