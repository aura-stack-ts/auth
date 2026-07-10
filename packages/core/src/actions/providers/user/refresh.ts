import { z } from "zod/v4"
import { refreshUserInfo } from "@/api/refreshUserInfo.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { OAuthProviderRecord } from "@/@types/oauth.ts"

export const refreshConfig = (oauth: OAuthProviderRecord) => {
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

export const refreshAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "POST",
        "/providers/:oauth/user/refresh",
        async (ctx) => {
            const { toResponse } = await refreshUserInfo(ctx.params.oauth, {
                ctx: ctx.context,
                headers: ctx.request.headers,
                request: ctx.request,
                skipCSRFCheck: false,
            })
            return toResponse()
        },
        refreshConfig(oauth)
    )
}
