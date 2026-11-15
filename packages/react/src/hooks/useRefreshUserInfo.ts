import { useCallback } from "react"
import { broadcast } from "@/context.tsx"
import { useAssertContext, useAsyncAction } from "../utils.ts"
import type { Session, User } from "@aura-stack/auth"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/auth/types"

/**
 * Fetches the `/userinfo` endpoint of the OAuth provider to refresh the user's information.
 *
 * @returns An object containing the refreshUserInfo function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { isProviderConnected } = useIsProviderConnected("google")
 *   const { refreshUserInfo, isPending } = useRefreshUserInfo()
 *
 *   useEffect(() => {
 *     const fetchUserInfo = async () => {
 *       const connected = await isProviderConnected()
 *       if (connected) {
 *         const session = await refreshUserInfo("google")
 *         if (session) {
 *           console.log("User info refreshed:", session.user)
 *         } else {
 *           console.log("Failed to refresh user info")
 *         }
 *       }
 *     }
 *   }, [])
 * }
 */
export const useRefreshUserInfo = <DefaultUser extends User = User>() => {
    const { client } = useAssertContext<DefaultUser>()
    const { execute, isPending } = useAsyncAction()

    const refreshUserInfo = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<Session<DefaultUser> | null> => {
            return execute(async () => {
                const session = await client.refreshUserInfo(oauth)
                broadcast({ type: "session:sync" })
                return session
            })
        },
        [client, execute]
    )

    return { refreshUserInfo, isPending } as const
}
