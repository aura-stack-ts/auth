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
                redirect: z.stringbool().default(true).optional().default(true),
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
            const {
                request,
                params: { oauth },
                searchParams: { redirectTo, redirect },
                context,
            } = ctx

            const signInResult = await signIn(oauth, {
                ctx: context,
                headers: request.headers,
                redirect,
                redirectTo,
                request,
            })
            if (!redirect) {
                return Response.json(signInResult, { status: 200 })
            }
            return signInResult as Response
        },
        signInConfig(oauth)
    )
}
