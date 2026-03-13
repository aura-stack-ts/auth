import { computed } from "vue"
import { authClient } from "~/lib/client"
import type { Session, LiteralUnion, BuiltInOAuthProvider, SignInOptions, SignOutOptions } from "@aura-stack/auth"

export const useAuthClient = () => {
    const session = useState<Session | null>("aura-session", () => null)
    const isLoading = useState("aura-loading", () => false)
    const isAuthenticated = computed(() => Boolean(session.value?.user))

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInOptions) => {
        isLoading.value = true
        try {
            await authClient.signIn(provider, { ...options, redirect: true })
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async (options?: SignOutOptions) => {
        isLoading.value = true
        try {
            await authClient.signOut(options)
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
            session.value = (await authClient.getSession()) as any
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
