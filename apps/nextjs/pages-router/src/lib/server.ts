import type { NextApiRequest } from "next"
import type { Session } from "@aura-stack/auth"
import type { IncomingMessage } from "http"
import { client } from "./client.api"

/**
 * Standard server-side auth function to retrieve the current session.
 * Compatible with getServerSideProps and API routes.
 */
export async function getSession(req: IncomingMessage | NextApiRequest): Promise<Session | null> {
    try {
        const response =  await client.get("/session", { 
            headers: req.headers as Record<string, string>
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

export const createAuthServer = {
    getSession,
}
