import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { VerifyMagicLinkOptions, VerifyMagicLinkReturn } from "@aura-stack/auth/types"

/**
 * Verifies a magic link token and signs in the user if the token is valid.
 *
 * The returned action accepts a token and optional redirect settings. It disables
 * the client's automatic redirect and uses the `AuthProvider` redirect handler
 * when called with `redirect: true`.
 *
 * @returns An object containing the `verifyMagicLink` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { verifyMagicLink, isPending } = useVerifyMagicLink()
 *
 *   return (
 *     <button
 *       disabled={isPending}
 *       onClick={() => verifyMagicLink("magic-link-token", { redirect: true, redirectTo: "/" })}
 *     >
 *       Verify magic link
 *     </button>
 *   )
 * }
 */
export const useVerifyMagicLink = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const verifyMagicLink = useCallback(
        <Options extends VerifyMagicLinkOptions>(token: string, options?: Options): Promise<VerifyMagicLinkReturn<Options>> => {
            return execute(async () => {
                const value = await client.verifyMagicLink(token, {
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as VerifyMagicLinkReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { verifyMagicLink, isPending } as const
}
