import { useServerFn } from "@tanstack/react-start"
import { getSession, signOutFn } from "@/lib/auth-server"

export const AuthServer = () => {
    const getCurrentSession = useServerFn(getSession)
    const signOut = useServerFn(signOutFn)
    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <div className="p-6 border border-muted bg-black text-white/70 text-sm">
            Legacy component. Use the dedicated server route at <strong>/server</strong>.
            <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 border border-muted text-xs" onClick={() => getCurrentSession()}>
                    Check Session
                </button>
                <button className="px-3 py-1 border border-muted text-xs" onClick={handleSignOut}>
                    Sign Out
                </button>
            </div>
        </div>
    )
}
