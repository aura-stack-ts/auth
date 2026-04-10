import {
    createAuth as createAuthBasic,
    type ShapeToObject,
    type AuthConfig,
    type EditableShape,
    type UserShape,
} from "@aura-stack/auth"
import { toHandler } from "@/lib/handler"
import { withAuth } from "@/lib/with-auth"
import type { Context } from "hono"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthBasic<Identity>(config)

    return {
        ...auth,
        toHandler: (ctx: Context) => toHandler(auth.handlers, ctx),
        withAuth: withAuth<ShapeToObject<Identity>>(auth),
    }
}
