import { useCallback } from "react"
import { useAssertContext, useAsyncAction } from "@/utils.ts"
import type { BuiltInOAuthProvider, GetProviderTokensReturn, LiteralUnion } from "@aura-stack/auth/types"

/**
 * Fetches the provider tokens for a given OAuth provider.
 *
 * @returns An object containing the accessToken, refreshToken, and expiresIn values, along with a isPending state
 * @example
 * import { useEffect } from "react"
 *
 * const Page = () => {
 *   const [songs, setSongs] = useState<string[]>([])
 *   const { getProviderTokens, isPending } = useProviderTokens()
 *
 *   useEffect(() => {
 *     const fetchSongs = async () => {
 *       const { success, tokens } = await getProviderTokens("spotify")
 *       if (!success || !tokens) return
 *       const { accessToken } = tokens
 *
 *       const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
 *         headers: {
 *           Authorization: `Bearer ${accessToken}`,
 *         }
 *       })
 *       const data = await response.json()
 *       setSongs(data.items.map((item: any) => item.name))
 *     }
 *
 *     fetchSongs()
 *   }, [])
 * }
 */
export const useProviderTokens = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const getProviderTokens = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<GetProviderTokensReturn> => {
            return execute(async () => {
                const tokens = await client.getProviderTokens(oauth)
                return tokens
            })
        },
        [client, execute]
    )

    return { getProviderTokens, isPending } as const
}
