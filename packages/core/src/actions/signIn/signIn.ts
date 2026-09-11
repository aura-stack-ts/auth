import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { signIn } from "@/api/signIn.ts"
import { OAuthProviderListSchema, SignInActionResponseSchemas, RedirectOptionsSchema } from "@/shared/schemas/actions.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

const signInConfig = (oauth: OAuthProviderRecord) => {
    return createEndpointConfig({
        schemas: {
            params: OAuthProviderListSchema(oauth),
            searchParams: RedirectOptionsSchema,
            response: SignInActionResponseSchemas,
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
