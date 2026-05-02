import { z } from "zod/v4"
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { updateSession } from "@/api/updateSession.ts"
import type { User } from "@/@types/session.ts"
import type { IdentityConfig } from "@/@types/config.ts"
import { UserIdentity } from "@/shared/identity.ts"

export const config = (_identity: IdentityConfig) => {
    return createEndpointConfig({
        schemas: {
            body: z.object({
                /**
                 * @todo add support for valibot schemas in the body as well, currently only Zod is supported
                 */
                user: UserIdentity.partial().optional(),
                expires: z.coerce.date().optional(),
            }),
        },
    })
}

export const updateSessionAction = (identity: IdentityConfig) => {
    return createEndpoint(
        "PATCH",
        "/session",
        async (ctx) => {
            const { toResponse } = await updateSession({
                ctx: ctx.context,
                headers: ctx.request.headers,
                session: {
                    user: ctx.body?.user as User,
                    expires: ctx.body?.expires?.toISOString(),
                },
            })
            return toResponse()
        },
        config(identity)
    )
}
