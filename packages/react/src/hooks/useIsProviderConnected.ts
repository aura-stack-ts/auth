import { useCallback } from "react"
import { useAssertContext, useAsyncAction } from "../utils.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/auth/types"

/**
 * Verifies if the OAuth provider is connected with the current user.
 *
 * @returns An object containing the isProviderConnected function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { isProviderConnected, isPending } = useIsProviderConnected()
 *
 *   const handleCheckConnection = async () => {
 *     const connected = await isProviderConnected("spotify")
 *     if (connected) {
 *       console.log("Provider is connected")
 *     } else {
 *       console.log("Provider is not connected")
 *     }
 *   }
 * }
 */
export const useIsProviderConnected = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const isProviderConnected = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
            return execute(async () => {
                const connected = await client.isProviderConnected(oauth)
                return connected
            })
        },
        [client, execute]
    )

    return { isProviderConnected, isPending } as const
}
