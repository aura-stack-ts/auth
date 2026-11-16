import { useCallback } from "react"
import { useAssertContext, useAsyncAction } from "../utils.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/auth/types"

/**
 * Disconnets the OAuth provider with the current user, removing the association between the
 * user's account and the OAuth provider. This action does not revoke the OAuth token, but it
 * removes the link between the user's account and the provider, effectively "disconnecting" the provider.
 *
 * > **NOTE**: For a complete disconnection, you may want to use `useRevokeToken` hook.
 *
 * @returns An object containing the disconnectProvider function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { disconnectProvider, isPending } = useDisconnectProvider()
 *
 *   const handleDisconnect = async () => {
 *     const success = await disconnectProvider("spotify")
 *     if (success) {
 *       console.log("Provider disconnected successfully")}
 *     } else {
 *      console.log("Failed to disconnect provider")
 *     }
 *   }
 * }
 */
export const useDisconnectProvider = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const disconnectProvider = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
            return execute(async () => {
                const success = await client.disconnectProvider(oauth)
                return success
            })
        },
        [client, execute]
    )

    return { disconnectProvider, isPending } as const
}
