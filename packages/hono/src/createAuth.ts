import { createAuth as createAuthBasic, type AuthConfig } from "@aura-stack/auth"
import { toHandler } from "@/lib/handler"
import { withAuth } from "@/lib/with-auth"
import type { Context } from "hono"
import type { Identities, FromShapeToObject, SchemaTypes } from "@aura-stack/auth/identity"

export const createAuth = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema>
) => {
    const auth = createAuthBasic<Identity, SignUpSchema>(config)

    return {
        ...auth,
        toHandler: (ctx: Context) => toHandler(auth.handlers, ctx),
        withAuth: withAuth<FromShapeToObject<Identity>>(auth),
    }
}
