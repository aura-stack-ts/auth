import { z } from "zod/v4"
import { revokeToken } from "@/api/revokeToken.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { OAuthProviderRecord } from "@/@types/oauth.ts"

const revokeConfig = (oauth: OAuthProviderRecord) => {
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
