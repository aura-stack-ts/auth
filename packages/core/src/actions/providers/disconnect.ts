import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { disconnectProvider } from "@/api/disconnectProvider.ts"
import { DisconnectProviderActionResponseSchema, OAuthProviderListSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const disconnectConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            response: DisconnectProviderActionResponseSchema,
        },
    })
}

export const disconnectAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "DELETE",
        "/providers/:oauth",
        async (ctx) => {
            const { toResponse } = await disconnectProvider(ctx.params.oauth, {
                ctx: ctx.context,
                headers: ctx.request.headers,
                request: ctx.request,
                skipCSRFCheck: false,
            })
            return toResponse()
        },
        disconnectConfig(oauth)
    )
}
