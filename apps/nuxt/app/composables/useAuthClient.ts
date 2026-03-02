import { computed } from "vue"
import { createAuthClient } from "~/lib/client"
import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"
import type { LiteralUnion } from "@aura-stack/auth/types"

export const useAuthClient = () => {
    const session = useState<Session | null>("aura-session", () => null)
    const isLoading = useState("aura-loading", () => false)
    const isAuthenticated = computed(() => Boolean(session.value?.user))

    const { signIn: signInClient, signOut: signOutClient, getSession } = createAuthClient

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>) => {
        isLoading.value = true
        try {
            await signInClient(provider)
            const newSession = await getSession()
            return newSession
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async () => {
        isLoading.value = true
        try {
            await signOutClient()
            session.value = null
            window.location.reload()
        } finally {
            isLoading.value = false
        }
    }

    onMounted(async () => {
        if (session.value) {
            isLoading.value = false
            return
        }
        try {
            session.value = await getSession()
        } catch {
            session.value = null
        } finally {
            isLoading.value = false
        }
    })

    return {
        session,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
    }
}
