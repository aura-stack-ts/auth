import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { getProviderTokens } from "@/api/getProviderTokens.ts"
import { GetProviderTokensActionResponseSchema, OAuthProviderListSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const tokensConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            response: GetProviderTokensActionResponseSchema,
        },
    })
}

export const tokensAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "GET",
        "/providers/:oauth/tokens",
        async (ctx) => {
            const { toResponse } = await getProviderTokens(ctx.params.oauth, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
            })
            return toResponse()
        },
        tokensConfig(oauth)
    )
}
