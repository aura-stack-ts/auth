import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { ResetPasswordOptions, ResetPasswordReturn } from "@aura-stack/auth/types"

/**
 * Resets the password for a user using a valid password reset token.
 *
 * The returned action accepts a payload containing the reset token and new password,
 * along with optional redirect settings. It disables the client's automatic redirect
 * and uses the `AuthProvider` redirect handler when called with `redirect: true`.
 *
 * @returns An object containing the `resetPassword` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { resetPassword, isPending } = useResetPassword()
 *
 *   const handleReset = () =>
 *     resetPassword({
 *       payload: { token: "reset-token", newPassword: "new-password" },
 *       redirect: true,
 *       redirectTo: "/sign-in",
 *     })
 *
 *   return <button disabled={isPending} onClick={handleReset}>Reset password</button>
 * }
 */
export const useResetPassword = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const resetPassword = useCallback(
        <Options extends ResetPasswordOptions>(options: Options): Promise<ResetPasswordReturn<Options>> => {
            return execute(async () => {
                const value = await client.resetPassword({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as ResetPasswordReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { resetPassword, isPending } as const
}
