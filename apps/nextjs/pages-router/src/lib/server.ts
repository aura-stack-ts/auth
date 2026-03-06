import { api } from "@/auth"
import type { NextApiRequest } from "next"
import type { Session } from "@aura-stack/auth"

/**
 * Standard server-side auth function to retrieve the current session.
 * Compatible with getServerSideProps and API routes.
 */
export async function getSession(req: NextApiRequest): Promise<Session | null> {
    try {
        const session = await api.getSession({
            headers: req.headers as Record<string, string>,
        })
        if (!session.authenticated) {
            return null
        }
        return session.session
    } catch {
        console.log("[error:server] getSession - Failed to retrieve session")
        return null
    }
}
