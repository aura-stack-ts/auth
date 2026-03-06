import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { getBaseURL } from "@/utils.ts"
import { signOut } from "@/api/signOut.ts"
import { createRedirectTo } from "@/actions/signIn/authorization.ts"

const config = createEndpointConfig({
    schemas: {
        searchParams: z.object({
            token_type_hint: z.literal("session_token"),
            redirectTo: z.string().optional(),
        }),
    },
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7009
 */
export const signOutAction = createEndpoint(
    "POST",
    "/signOut",
    async (ctx) => {
        const {
            request,
            searchParams: { redirectTo },
            context,
        } = ctx

        const baseURL = getBaseURL(request)
        const location = await createRedirectTo(
            new Request(baseURL, {
                headers: request.headers,
            }),
            redirectTo,
            context
        )

        return await signOut({
            ctx: context,
            headers: request.headers,
            redirectTo: location,
        })
    },
    config
)
