import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { isProviderConnected } from "@/api/isProviderConnected.ts"
import { IsProviderConnectedActionResponseSchema, OAuthProviderListSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const connectedConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            response: IsProviderConnectedActionResponseSchema,
        },
    })
}

export const connectedAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "GET",
        "/providers/:oauth",
        async (ctx) => {
            const { toResponse } = await isProviderConnected(ctx.params.oauth, {
                ctx: ctx.context,
                headers: ctx.request.headers,
                request: ctx.request,
            })
            return toResponse()
        },
        connectedConfig(oauth)
    )
}
