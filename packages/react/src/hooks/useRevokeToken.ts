import { useCallback } from "react"
import { useAssertContext, useAsyncAction } from "@/utils.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/auth/types"

/**
 * Revokes the OAuth access token for a given provider. It revokes the token by calling
 * the provider's token revocation endpoint, if available.
 *
 * > **NOTE**: The token revocation process is a hard operation, if you do not want to revoke
 * the token, but just disconnect the provider from the user, you can use `useDisconnectProvider` hook.
 *
 * @returns An object containing the revokeToken function and a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const { revokeToken, isPending } = useRevokeToken()
 *
 *   const handleRevoke = async () => {
 *     const success = await revokeToken("spotify")
 *     if (success) {
 *       console.log("Token revoked successfully")
 *     } else {
 *       console.log("Failed to revoke token")
 *     }
 *   }
 * }
 */
export const useRevokeToken = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const revokeToken = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
            return execute(async () => {
                const success = await client.revokeToken(oauth)
                return success
            })
        },
        [client, execute]
    )

    return { revokeToken, isPending } as const
}
