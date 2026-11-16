import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { ChangePasswordOptions, ChangePasswordReturn } from "@aura-stack/auth/types"

/**
 * Changes the password for the currently authenticated user.
 *
 * The returned action accepts a payload containing the current and new passwords,
 * along with optional redirect settings. It disables the client's automatic redirect
 * and uses the `AuthProvider` redirect handler when called with `redirect: true`.
 *
 * @returns An object containing the `changePassword` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { changePassword, isPending } = useChangePassword()
 *
 *   const handleChange = () =>
 *     changePassword({
 *       payload: { currentPassword: "current-password", newPassword: "new-password" },
 *       redirect: true,
 *       redirectTo: "/settings",
 *     })
 *
 *   return <button disabled={isPending} onClick={handleChange}>Change password</button>
 * }
 */
export const useChangePassword = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const changePassword = useCallback(
        <Options extends ChangePasswordOptions>(options: Options): Promise<ChangePasswordReturn<Options>> => {
            return execute(async () => {
                const value = await client.changePassword({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value
            })
        },
        [client, execute, redirect]
    )

    return { changePassword, isPending } as const
}
