import { computed } from "vue"
import { authClient } from "~/lib/client"
import type {
    Session,
    LiteralUnion,
    BuiltInOAuthProvider,
    SignInOptions,
    SignOutOptions,
    UpdateSessionOptions,
} from "@aura-stack/auth/types"

export const useAuthClient = (initialSession?: Session | null) => {
    const session = useState<Session | null>("aura-session", () => null)
    const isLoading = useState("aura-loading", () => false)
    const isAuthenticated = computed(() => Boolean(session.value?.user))
    const status = computed(() => {
        if (isLoading.value) return "loading"
        return isAuthenticated.value ? "authenticated" : "unauthenticated"
    })

    if (initialSession !== undefined) {
        session.value = initialSession
    }

    const refresh = async () => {
        isLoading.value = true
        try {
            session.value = await authClient.getSession()
        } catch {
            session.value = null
        } finally {
            isLoading.value = false
        }
    }

    const signIn = async (provider: LiteralUnion<BuiltInOAuthProvider>, options?: SignInOptions) => {
        isLoading.value = true
        try {
            await authClient.signIn(provider, { ...options, redirect: options?.redirect ?? true })
        } finally {
            isLoading.value = false
        }
    }

    const signInCredentials = async (credentials: { username: string; password: string }, options?: SignInOptions) => {
        isLoading.value = true
        try {
            await authClient.signInCredentials({
                payload: credentials,
                ...options,
            })
            if (options?.redirect === false) {
                await refresh()
            }
        } finally {
            isLoading.value = false
        }
    }

    const updateSession = async (options: UpdateSessionOptions) => {
        isLoading.value = true
        try {
            await authClient.updateSession(options)
            await refresh()
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async (options?: SignOutOptions) => {
        isLoading.value = true
        try {
            await authClient.signOut(options)
            session.value = null
            if (options?.redirect !== false) {
                window.location.reload()
            }
        } finally {
            isLoading.value = false
        }
    }

    onMounted(async () => {
        if (initialSession === undefined && !session.value) {
            await refresh()
        }
    })

    return {
        session,
        status,
        isLoading,
        isPending: isLoading,
        isAuthenticated,
        refresh,
        signIn,
        signInCredentials,
        signOut,
        updateSession,
    }
}
