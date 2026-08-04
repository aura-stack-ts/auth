import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { SearchParamsCallbackSchema } from "@/schemas.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const callbackConfig = (oauth: OAuthProviderRecord) => {
    // @ts-ignore
    return createEndpointConfig({
        /**
         * @todo Add support to any schema (zod, arktype and valibot)
         */
        schemas: {
            // @ts-ignore
            params: z.object({
                oauth: z.enum(
                    Object.keys(oauth) as (keyof OAuthProviderRecord)[],
                    "The OAuth provider is not supported or invalid."
                ),
            }),
            // @ts-ignore
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
