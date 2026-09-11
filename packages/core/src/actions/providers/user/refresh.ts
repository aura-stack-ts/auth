import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { refreshUserInfo } from "@/api/refreshUserInfo.ts"
import { OAuthProviderListSchema, RefreshUserInfoActionResponseSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

export const refreshConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            response: RefreshUserInfoActionResponseSchema,
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
