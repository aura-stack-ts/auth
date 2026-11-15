import { useCallback } from "react"
import { useAssertContext, useAsyncAction } from "@/utils.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/auth/types"

/**
 * Fetches the OAuth access token for a given provider.
 *
 * @returns An string access token or null if the token is not available, along with a isPending state
 * @example
 * import { useEffect, useState } from "react"
 *
 * const Page = () => {
 *   const [songs, setSongs] = useState<string[]>([])
 *   const { getAccessToken, isPending } = useAccessToken()
 *
 *   useEffect(() => {
 *     const fetchSongs = async () => {
 *       const accessToken = await getAccessToken("spotify")
 *       if (!accessToken) return
 *
 *      const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
 *        headers: { Authorization: `Bearer ${accessToken}` },
 *      })
 *
 *      const data = await response.json()
 *      setSongs(data.items.map((item: any) => item.name))
 *    }
 *
 *    fetchSongs()
 *  }, [])
 * }
 */
export const useAccessToken = () => {
    const { client } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const getAccessToken = useCallback(
        (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<string | null> => {
            return execute(async () => {
                const accessToken = await client.getAccessToken(oauth)
                return accessToken
            })
        },
        [client, execute]
    )

    return { getAccessToken, isPending } as const
}
