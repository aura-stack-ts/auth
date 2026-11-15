import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { CancelEmailChangeOptions, CancelEmailChangeReturn } from "@aura-stack/auth/types"

/**
 * Cancels an email change request. Supports two modes:
 * - Passing `payload.token` to cancel via a link in the email.
 * - Without a token, cancels the email change for the currently authenticated user.
 *
 * The returned action accepts optional redirect settings in either mode. It disables
 * the client's automatic redirect and uses the `AuthProvider` redirect handler when
 * called with `redirect: true`.
 *
 * @returns An object containing the `cancelEmailChange` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { cancelEmailChange, isPending } = useCancelEmailChange()
 *
 *   return (
 *     <button
 *       disabled={isPending}
 *       onClick={() => cancelEmailChange({ payload: { token: "email-change-token" }, redirect: true })}
 *     >
 *       Cancel email change
 *     </button>
 *   )
 * }
 */
export const useCancelEmailChange = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const cancelEmailChange = useCallback(
        <Options extends CancelEmailChangeOptions>(options?: Options): Promise<CancelEmailChangeReturn<Options>> => {
            return execute(async () => {
                const value = await client.cancelEmailChange({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as CancelEmailChangeReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { cancelEmailChange, isPending } as const
}
