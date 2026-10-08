import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
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
                params: { oauth },
                searchParams: { code, state },
                context,
            } = ctx
            return await context.sessionStrategy.oauthCallback(oauth, request, { code, state })
        },
        callbackConfig(oauth)
    )
}
