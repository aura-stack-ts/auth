import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { revokeToken } from "@/api/revokeToken.ts"
import { OAuthProviderListSchema, RevokeTokenActionResponseSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const revokeConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            response: RevokeTokenActionResponseSchema,
        },
    })
}

export const revokeAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "POST",
        "/providers/:oauth/tokens/revoke",
        async (ctx) => {
            const { toResponse } = await revokeToken(ctx.params.oauth, {
                ctx: ctx.context,
                headers: ctx.request.headers,
                request: ctx.request,
                skipCSRFCheck: false,
            })
            return toResponse()
        },
        revokeConfig(oauth)
    )
}
