import { computed } from "vue"
import type { Session } from "@aura-stack/auth"

export const useAuth = () => {
    const session = useState<(Session & { authenticated?: boolean; message?: string }) | null>("aura-session", () => null)
    const loading = useState("aura-loading", () => false)

    const fetchSession = async () => {
        if (loading.value) return
        loading.value = true
        try {
            const data = await $fetch<Session & { authenticated?: boolean; message?: string }>("/api/auth/session")
            session.value = data
            return data
        } catch (err: any) {
            if (err.status === 401) {
                session.value = { authenticated: false, message: "Unauthorized" } as any
            } else {
                console.error("Failed to fetch session:", err)
                session.value = null
            }
            return null
        } finally {
            loading.value = false
        }
    }

    const signIn = (provider: string) => {
        window.location.href = `/api/auth/signIn/${provider}`
    }

    const signOut = async () => {
        try {
            const { csrfToken } = await $fetch<{ csrfToken: string }>("/api/auth/csrfToken")
            await $fetch("/api/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            session.value = null
            window.location.reload()
        } catch (err) {
            console.error("Failed to sign out:", err)
        }
    }

    const user = computed(() => session.value?.user || null)
    const isAuthenticated = computed(() => !!session.value?.user)

    return {
        session,
        user,
        loading,
        isAuthenticated,
        fetchSession,
        signIn,
        signOut,
    }
}
