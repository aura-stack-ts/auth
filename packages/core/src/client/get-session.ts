import type { Session, User } from "@/@types/session.ts"
import type { ClientContext } from "@/client/context.ts"

export const getSession = <DefaultUser extends User = User>({ client }: ClientContext) => {
    return async (): Promise<Session<DefaultUser> | null> => {
        try {
            const response = await client.get("/session")
            if (!response.ok) return null
            const session = await response.json()
            if (!session.success) return null
            return session.session as Session<DefaultUser>
        } catch (error) {
            console.error("Error fetching session:", error)
            return null
        }
    }
}
