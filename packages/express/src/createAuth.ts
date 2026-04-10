import {
    createAuth as createAuthBasic,
    EditableShape,
    Session,
    ShapeToObject,
    User,
    UserShape,
    type AuthConfig,
} from "@aura-stack/auth"
import { withAuth } from "@/lib/with-auth.ts"
import { toExpressHandler } from "@/lib/handler.ts"
import type { Request, Response } from "express"

export const createAuth = <Identity extends EditableShape<UserShape>>(config: AuthConfig<Identity>) => {
    const auth = createAuthBasic<Identity>(config)
    return {
        ...auth,
        toHandler: (req: Request, res: Response) => toExpressHandler(auth.handlers, req, res),
        withAuth: <
            DefaultUser extends User = ShapeToObject<Identity>,
            Body = any,
            ResponseInit extends Response<Body, { session?: Session<DefaultUser> | null }> = Response<
                Body,
                { session?: Session<DefaultUser> | null }
            >,
        >(
            req: Request,
            res: ResponseInit,
            next: () => void
        ) => withAuth<DefaultUser, Body, ResponseInit>(auth.api as any, req, res, next),
    }
}
