import { handlers } from "../auth"
import type { Session } from "@aura-stack/auth"

export const getSession = async (request: Request): Promise<Session | null> => {
    try {
        const url = new URL(request.url)
        url.pathname = "/api/auth/session"
        const response = await handlers.GET(
            new Request(url.toString(), {
                headers: request.headers,
            })
        )
        const session = (await response.json()) as Session
        return session && session?.user ? session : null
    } catch {
        return null
    }
}
