import { useAuth } from "@aura-stack/react"

export const AuthClient = () => {
    const { status } = useAuth()

    return (
        <div className="p-6 border border-muted bg-black text-white/70 text-sm">
            Legacy component. Use the dedicated client route at <strong>/client</strong>.
            <p className="mt-2 text-white/50">Current status: {status}</p>
        </div>
    )
}
