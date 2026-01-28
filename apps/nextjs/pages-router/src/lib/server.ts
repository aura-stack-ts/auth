import type { NextApiRequest } from "next"
import type { Session } from "@aura-stack/auth"
import type { IncomingMessage } from "http"

export const getBaseURL = (request: NextApiRequest | IncomingMessage) => {
    const protocol = request.headers["x-forwarded-proto"] ?? "http"
    const host = request.headers["x-forwarded-host"] ?? request.headers.host
    return `${protocol}://${host}`
}

/**
 * Standard server-side auth function to retrieve the current session.
 * Compatible with getServerSideProps and API routes.
 */
export async function auth(req: IncomingMessage | NextApiRequest): Promise<Session | null> {
    const baseURL = getBaseURL(req)
    const headers = new Headers(req.headers as Record<string, string>)
    try {
        const response = await fetch(`${baseURL}/api/auth/session`, {
            headers,
            cache: "no-store",
        })
        if (!response.ok) {
            return null
        }
        const session = (await response.json()) as Session
        return session && session.user ? session : null
    } catch (error) {
        return null
    }
}
