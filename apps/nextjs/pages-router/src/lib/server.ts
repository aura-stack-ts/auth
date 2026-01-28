import type { NextApiRequest } from "next"
import type { Session } from "@aura-stack/auth"
import type { IncomingMessage } from "http"
import { createRequest } from "./request"

/**
 * Standard server-side auth function to retrieve the current session.
 * Compatible with getServerSideProps and API routes.
 */
export async function getSession(req: IncomingMessage | NextApiRequest): Promise<Session | null> {
    const headers = new Headers(req.headers as Record<string, string>)
    try {
        const response = await createRequest(`/api/auth/session`, {
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

export const authServer = {
    getSession,
}
