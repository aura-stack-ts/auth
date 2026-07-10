import { z } from "zod/v4"
import { isProviderConnected } from "@/api/isProviderConnected.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { OAuthProviderRecord } from "@/@types/oauth.ts"

const connectedConfig = (oauth: OAuthProviderRecord) => {
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
