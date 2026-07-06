import z from "zod/v4"
import { getProviderTokens } from "@/api/getProviderTokens.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { OAuthProviderRecord } from "@/@types/oauth.ts"

const tokensConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: z.object({
                oauth: z.enum(
                    Object.keys(oauth) as (keyof OAuthProviderRecord)[],
                    "The OAuth provider is not supported or invalid."
                ),
            }),
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
                skipCSRFCheck: false,
            })
            return toResponse()
        },
        tokensConfig(oauth)
    )
}
