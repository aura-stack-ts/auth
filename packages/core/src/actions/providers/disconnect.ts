import { z } from "zod/v4"
import { disconnectProvider } from "@/api/disconnectProvider.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { OAuthProviderRecord } from "@/@types/oauth.ts"

const disconnectConfig = (oauth: OAuthProviderRecord) => {
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
