import { useCallback } from "react"
import { performRedirect, useAssertContext, useAsyncAction } from "../utils.ts"
import type { SendVerificationEmailOptions, SendVerificationEmailReturn } from "@aura-stack/auth/types"

/**
 * Sends a verification email to the specified email address.
 *
 * The returned action accepts an email and optional redirect settings. It disables
 * the client's automatic redirect and uses the `AuthProvider` redirect handler
 * when called with `redirect: true`.
 *
 * @returns An object containing the `sendVerificationEmail` action and its `isPending` state.
 * @example
 * const Page = () => {
 *   const { sendVerificationEmail, isPending } = useSendVerificationEmail()
 *
 *   return (
 *     <button
 *       disabled={isPending}
 *       onClick={() => sendVerificationEmail("user@example.com", { redirect: true, redirectTo: "/verify-sent" })}
 *     >
 *       Send verification email
 *     </button>
 *   )
 * }
 */
export const useSendVerificationEmail = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const sendVerificationEmail = useCallback(
        <Options extends SendVerificationEmailOptions>(
            email: string,
            options?: Options
        ): Promise<SendVerificationEmailReturn<Options>> => {
            return execute(async () => {
                const value = await client.sendVerificationEmail(email, {
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                return value as SendVerificationEmailReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { sendVerificationEmail, isPending } as const
}
