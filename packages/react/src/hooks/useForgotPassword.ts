import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { ForgotPasswordOptions, ForgotPasswordReturn } from "@aura-stack/auth/types"

/**
 * Initiates the forgot password flow by sending a password reset email to the specified address.
 *
 * The returned action accepts an email and optional redirect settings. It disables
 * the client's automatic redirect and uses the `AuthProvider` redirect handler
 * when called with `redirect: true`.
 *
 * @returns An object containing the `forgotPassword` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { forgotPassword, isPending } = useForgotPassword()
 *
 *   return (
 *     <button disabled={isPending} onClick={() => forgotPassword("user@example.com", { redirectTo: "/check-email" })}>
 *       Send password reset email
 *     </button>
 *   )
 * }
 */
export const useForgotPassword = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const forgotPassword = useCallback(
        <Options extends ForgotPasswordOptions>(email: string, options?: Options): Promise<ForgotPasswordReturn<Options>> => {
            return execute(async () => {
                const value = await client.forgotPassword(email, {
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as ForgotPasswordReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { forgotPassword, isPending } as const
}
