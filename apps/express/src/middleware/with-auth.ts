import type { Request, Response, NextFunction } from "express"
import { getSession } from "../lib/get-session.js"

/**
 * Express middleware that protects routes by verifying the session.
 * - If authenticated: attaches the session to `res.locals.session` and calls `next()`.
 * - If not authenticated: responds immediately with `401 Unauthorized`.
 *
 * @example
 * app.get("/api/protected", withAuth, (req, res) => {
 *   res.json({ session: res.locals.session })
 * })
 */
export const withAuth = async (req: Request, res: Response, next: NextFunction) => {
    const session = await getSession(req)
    if (!session) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "You must be signed in to access this resource.",
        })
    }
    res.locals.session = session
    return next()
}
