import { z } from "zod/v4"
import { signIn } from "@/api/signIn.ts"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import type { OAuthProviderRecord } from "@/@types/index.ts"

const signInConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig("/signIn/:oauth", {
        schemas: {
            params: z.object({
                oauth: z.enum(
                    Object.keys(oauth) as (keyof OAuthProviderRecord)[],
                    "The OAuth provider is not supported or invalid."
                ),
            }),
            searchParams: z.object({
                redirect: z.stringbool().optional().default(true),
                redirectTo: z.string().optional(),
            }),
        },
    })
}

export const signInAction = (oauth: OAuthProviderRecord) => {
    return createEndpoint(
        "GET",
        "/signIn/:oauth",
        async (ctx) => {
            const { toResponse } = await signIn(ctx.params.oauth, {
                ctx: ctx.context,
                request: ctx.request,
                headers: ctx.request.headers,
                redirect: ctx.searchParams.redirect,
                redirectTo: ctx.searchParams.redirectTo,
            })
            return toResponse()
        },
        signInConfig(oauth)
    )
}
