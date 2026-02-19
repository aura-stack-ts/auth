import type { Request } from "express"
import type { Session } from "@aura-stack/auth"
import { jose } from "../auth.js"

/**
 * Decodes and validates the session JWT from the incoming Express request's cookies.
 * Uses the Aura Auth jose instance to verify the token.
 *
 * @returns The decoded session object, or null if no valid session exists.
 * @unstable
 * @experimental
 */
export const getSession = async (request: Request): Promise<Session | null> => {
    const cookieHeader = request.headers.cookie
    if (!cookieHeader) return null
    try {
        const cookies = Object.fromEntries(
            cookieHeader
                .split(";")
                .map((c) => c.trim().split("="))
                .map(([key, ...val]) => [decodeURIComponent(key), decodeURIComponent(val.join("="))])
        )

        const sessionCookieKey = Object.keys(cookies).find((k) => k.includes("session_token"))
        if (!sessionCookieKey) return null

        const token = cookies[sessionCookieKey]
        if (!token) return null

        const decoded = await jose.decodeJWT(token)
        const { exp, iat, jti, nbf, sub, aud, iss, ...user } = decoded as Record<string, any>

        return {
            user,
            expires: new Date(exp! * 1000).toISOString(),
        } as Session
    } catch {
        return null
    }
}
