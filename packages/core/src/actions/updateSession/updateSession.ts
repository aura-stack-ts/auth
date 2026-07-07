import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { RedirectOptionsSchema } from "@/schemas.ts"
import { updateSession } from "@/api/updateSession.ts"
import { getFullSchema } from "@/validator/registry.ts"
import type { SchemaRegistryContext } from "@/@types/config.ts"
import type { Identities } from "@/shared/identity/index.ts"

export const config = <Identity extends Identities>(identity: SchemaRegistryContext) => {
    return createEndpointConfig({
        schemas: {
            body: getFullSchema<Identity>(identity.schemaRegistry.schemaAsPartial),
            searchParams: RedirectOptionsSchema,
        },
    })
}

export const updateSessionAction = (identity: SchemaRegistryContext) => {
    return createEndpoint(
        "PATCH",
        "/session",
        async (ctx) => {
            const session = ctx.body
            const { toResponse } = await updateSession({
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
                session: session as any,
            })
            return toResponse()
        },
        config(identity)
    )
}
