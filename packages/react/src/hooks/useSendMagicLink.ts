import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { SendMagicLinkOptions, SendMagicLinkReturn } from "@aura-stack/auth/types"

/**
 * Sends a magic link to the specified email address, allowing the user to sign in without a password.
 *
 * The returned action accepts an email and optional redirect settings. It disables
 * the client's automatic redirect and uses the `AuthProvider` redirect handler
 * when called with `redirect: true`.
 *
 * @returns An object containing the `sendMagicLink` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { sendMagicLink, isPending } = useSendMagicLink()
 *
 *   return (
 *     <button
 *       disabled={isPending}
 *       onClick={() => sendMagicLink("user@example.com", { redirect: true, redirectTo: "/check-email" })}
 *     >
 *       Send magic link
 *     </button>
 *   )
 * }
 */
export const useSendMagicLink = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const sendMagicLink = useCallback(
        <Options extends SendMagicLinkOptions>(email: string, options?: Options): Promise<SendMagicLinkReturn<Options>> => {
            return execute(async () => {
                const value = await client.sendMagicLink(email, {
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as SendMagicLinkReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { sendMagicLink, isPending } as const
}
