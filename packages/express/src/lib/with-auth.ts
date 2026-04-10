import { toWebRequest } from "@/lib/handler.ts"
import type { RequestHandler } from "express"
import type { AuthInstance, User, Session } from "@aura-stack/auth"

export type LocalsWithSession<DefaultUser extends User = User> = {
    session: Session<DefaultUser> | null
}

/**
 * Higher-order middleware that retrieves the session from the incoming request
 * and attaches it to `res.locals.session`.
 *
 * @example
 * const auth = createAuth(...)
 * app.get("/api/protected", auth.withAuth, (req, res) => {
 *   res.json({ session: res.locals.session })
 * })
 */
export const withAuth = <DefaultUser extends User = User>({
    api,
}: AuthInstance<DefaultUser>): RequestHandler<any, any, any, any, LocalsWithSession<DefaultUser>> => {
    return async (req, res, next) => {
        try {
            const webRequest = toWebRequest(req)
            const { session } = await api.getSession({
                headers: webRequest.headers,
            })
            res.locals.session = session
            return next()
        } catch (error) {
            return next(error)
        }
    }
}
