import { useSignIn } from "@/hooks/useSignIn.ts"
import { useSignUp } from "@/hooks/useSignUp.ts"
import { useSignOut } from "@/hooks/useSignOut.ts"
import { useUpdateSession } from "@/hooks/useUpdateSession.ts"
import { useSignInCredentials } from "@/hooks/useSignInCredentials.ts"
import type { User } from "@aura-stack/auth"

/**
 * Centralized hook that provides all authentication actions and their pending states.
 *
 * @returns An object containing all auth actions (signIn, signInCredentials, updateSession,
 * signOut and signUp) and a combined isPending state
 * @example
 * const Page = () => {
 *   const { signIn, signInCredentials, updateSession, signOut, signUp, isPending } = useAuthActions()
 *   // Use the actions as needed in your component
 *   return <p>Auth actions are ready to use. isPending: {isPending ? "Yes" : "No"}</p>
 * }
 */
export const useAuthActions = <DefaultUser extends User = User>() => {
    const { signIn, isPending: isSignInPending } = useSignIn()
    const { signInCredentials, isPending: isSignInCredentialsPending } = useSignInCredentials()
    const { updateSession, isPending: isUpdateSessionPending } = useUpdateSession<DefaultUser>()
    const { signOut, isPending: isSignOutPending } = useSignOut()
    const { signUp, isPending: isSignUpPending } = useSignUp()

    return {
        isPending: isSignInPending || isSignInCredentialsPending || isUpdateSessionPending || isSignOutPending || isSignUpPending,
        signIn,
        signInCredentials,
        updateSession,
        signOut,
        signUp,
    } as const
}
