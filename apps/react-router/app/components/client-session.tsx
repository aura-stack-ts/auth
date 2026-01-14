import { useSession } from "~/contexts/auth"
import { SessionCard } from "./session-card"

export const ClientSession = () => {
    const { session, isAuthenticated } = useSession()

    return <SessionCard title="Client Side" session={session} isAuthenticated={isAuthenticated} />
}
