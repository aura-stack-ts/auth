import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { oauthCallback } from "@/api/oauth-callback.ts"
import { SearchParamsCallbackSchema, OAuthProviderListSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const callbackConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            searchParams: SearchParamsCallbackSchema,
        },
    })
}

export const callbackAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "GET",
        "/callback/:oauth",
        async (ctx) => {
            const {
                request,
                context,
                params: { oauth: oauthId },
                searchParams: { code, state },
            } = ctx
            const { toResponse } = await oauthCallback({
                ctx: context,
                payload: {
                    oauthId,
                    code,
                    state,
                },
                request,
                headers: request.headers,
            })
            return toResponse()
        },
        callbackConfig(oauth)
    )
}
