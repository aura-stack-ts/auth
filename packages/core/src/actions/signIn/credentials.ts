import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { signInCredentials } from "@/api/credentials.ts"

const config = createEndpointConfig({
    schemas: {
        body: z.object({
            username: z.string(),
            password: z.string(),
        }),
        searchParams: z.object({
            redirectTo: z.string().optional(),
        }),
    },
})

/**
 * Handles the credentials-based sign-in flow.
 * It extracts credentials from the request body, calls the provider's `authorize` function,
 * validates the returned user object, and creates a session.
 *
 * @returns The signed-in user and session cookies.
 */
export const signInCredentialsAction = createEndpoint(
    "POST",
    "/signIn/credentials",
    async (ctx) => {
        const payload = ctx.body
        const { headers, success } = await signInCredentials({
            ctx: ctx.context,
            payload,
        })
        return Response.json({ success }, { headers, status: success ? 200 : 401 })
    },
    config
)
