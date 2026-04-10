import { toWebRequest } from "@/lib/handler.ts"
import type { AuthAPI, Session, User } from "@aura-stack/auth"
import type { Request, Response, NextFunction } from "express"

/**
 * Retrieves the session from the incoming request and attaches it to res.locals.session.
 *
 * @example
 * app.get("/api/protected", withAuth, (req, res) => {
 *   res.json({ session: res.locals.session })
 * })
 */
export const withAuth = async <
    DefaultUser extends User = User,
    Body = any,
    ResponseInit extends Response<Body, { session?: Session<DefaultUser> | null }> = Response<
        Body,
        { session?: Session<DefaultUser> | null }
    >,
>(
    api: AuthAPI<DefaultUser>,
    req: Request,
    res: ResponseInit,
    next: NextFunction
) => {
    const webRequest = toWebRequest(req)
    const session = await api.getSession({
        headers: webRequest.headers,
    })
    res.locals.session = session.session
    return next()
}
