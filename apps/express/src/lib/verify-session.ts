import { api } from "@/auth.js"
import { toWebRequest } from "@/middlewares/auth.js"
import type { Request, Response, NextFunction } from "express"

/**
 * Retrieves the session from the incoming request and attaches it to res.locals.session.
 *
 * @example
 * app.get("/api/protected", verifySession, (req, res) => {
 *   res.json({ session: res.locals.session })
 * })
 */
export const verifySession = async (req: Request, res: Response, next: NextFunction) => {
    const webRequest = toWebRequest(req)
    const session = await api.getSession({
        headers: webRequest.headers,
    })
    if (!session.authenticated) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "You must be signed in to access this resource.",
        })
    }
    res.locals.session = session.session
    return next()
}
