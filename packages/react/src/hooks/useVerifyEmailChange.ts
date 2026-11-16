import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { VerifyEmailChangeOptions, VerifyEmailChangeReturn } from "@aura-stack/auth/types"

/**
 * Verifies an email change request using a verification token.
 *
 * The returned action accepts a payload containing the verification token, along
 * with optional redirect settings. It disables the client's automatic redirect and
 * uses the `AuthProvider` redirect handler when called with `redirect: true`.
 *
 * @returns An object containing the `verifyEmailChange` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { verifyEmailChange, isPending } = useVerifyEmailChange()
 *
 *   const handleVerify = () =>
 *     verifyEmailChange({
 *       payload: { token: "email-change-token" },
 *       redirect: true,
 *       redirectTo: "/settings",
 *     })
 *
 *   return <button disabled={isPending} onClick={handleVerify}>Verify email change</button>
 * }
 */
export const useVerifyEmailChange = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const verifyEmailChange = useCallback(
        <Options extends VerifyEmailChangeOptions>(options: Options): Promise<VerifyEmailChangeReturn<Options>> => {
            return execute(async () => {
                const value = await client.verifyEmailChange({
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

    return { verifyEmailChange, isPending } as const
}
