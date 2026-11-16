import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { ChangeEmailOptions, ChangeEmailReturn } from "@aura-stack/auth/types"

/**
 * Changes the email address for the currently authenticated user.
 *
 * The returned action accepts a payload containing the current password and new
 * email address, along with optional redirect settings. It disables the client's
 * automatic redirect and uses the `AuthProvider` redirect handler when called with
 * `redirect: true`.
 *
 * @returns An object containing the `changeEmail` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { changeEmail, isPending } = useChangeEmail()
 *
 *   const handleChange = () =>
 *     changeEmail({
 *       payload: { currentPassword: "current-password", newEmail: "new@example.com" },
 *       redirect: true,
 *       redirectTo: "/settings",
 *     })
 *
 *   return <button disabled={isPending} onClick={handleChange}>Change email</button>
 * }
 */
export const useChangeEmail = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const changeEmail = useCallback(
        <Options extends ChangeEmailOptions>(options: Options): Promise<ChangeEmailReturn<Options>> => {
            return execute(async () => {
                const value = await client.changeEmail({
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

    return { changeEmail, isPending } as const
}
