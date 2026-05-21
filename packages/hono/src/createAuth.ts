import { createAuth as createAuthBasic, type AuthConfig } from "@aura-stack/auth"
import { toHandler } from "@/lib/handler"
import { withAuth } from "@/lib/with-auth"
import type { Context } from "hono"
import type { Identities, FromShapeToObject } from "@aura-stack/auth/identity"

export const createAuth = <Identity extends Identities>(config: AuthConfig<Identity>) => {
    const auth = createAuthBasic<Identity>(config)

    return {
        ...auth,
        toHandler: (ctx: Context) => toHandler(auth.handlers, ctx),
        withAuth: withAuth<FromShapeToObject<Identity>>(auth),
    }
}
