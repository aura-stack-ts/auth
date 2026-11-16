import { useCallback } from "react"
import { broadcast } from "@/context.tsx"
import { performRedirect, useAssertContext, useAsyncAction } from "@/utils.ts"
import type { BuiltInOAuthProvider, LiteralUnion, SignInOptions, SignInReturn } from "@aura-stack/auth/types"

/**
 * Initiates the OAuth sign-in process to third-party providers.
 *
 * @returns An object containing the signIn function and a isPending state
 * @example
 * const Page = () => {
 *   const { signIn, isPending } = useSignIn()
 *   return (
 *     <button onClick={() => signIn("google")} disabled={isPending}>
 *       Sign in with Google
 *     </button>
 *   )
 * }
 */
export const useSignIn = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signIn = useCallback(
        <Options extends SignInOptions>(
            oauth: LiteralUnion<BuiltInOAuthProvider>,
            options?: Options
        ): Promise<SignInReturn<Options>> => {
            return execute(async () => {
                const value = (await client.signIn(oauth, {
                    ...options,
                    redirect: false,
                })) as any
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.signInURL)
                }
                if (value.success) {
                    broadcast({ type: "session:sync" })
                }
                return value as unknown as SignInReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { signIn, isPending } as const
}
