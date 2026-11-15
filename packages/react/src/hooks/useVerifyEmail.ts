import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { VerifyEmailOptions, VerifyEmailReturn } from "@aura-stack/auth/types"

/**
 * Verifies an email address using a verification token.
 *
 * The returned action accepts a token and optional redirect settings. It disables
 * the client's automatic redirect and uses the `AuthProvider` redirect handler
 * when called with `redirect: true`.
 *
 * @returns An object containing the `verifyEmail` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { verifyEmail, isPending } = useVerifyEmail()
 *
 *   return (
 *     <button disabled={isPending} onClick={() => verifyEmail("verification-token", { redirect: true })}>
 *       Verify email
 *     </button>
 *   )
 * }
 */
export const useVerifyEmail = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const verifyEmail = useCallback(
        <Options extends VerifyEmailOptions>(token: string, options?: Options): Promise<VerifyEmailReturn<Options>> => {
            return execute(async () => {
                const value = await client.verifyEmail(token, {
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as VerifyEmailReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { verifyEmail, isPending } as const
}
