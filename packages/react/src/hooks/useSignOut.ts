import { useCallback } from "react"
import { broadcast } from "@/context.tsx"
import { performRedirect, useAssertContext, useAsyncAction } from "@/utils.ts"
import type { SignOutOptions, SignOutReturn } from "@aura-stack/auth/types"

/**
 * Signs out the current user.
 *
 * @returns An object containing the signOut function and a isPending state
 * @example
 * const Page = () => {
 *   const { signOut, isPending } = useSignOut()
 *   return (
 *     <button onClick={() => signOut({ redirect: true, redirectTo: "/" })} disabled={isPending}>
 *       Sign Out
 *     </button>
 *   )
 * }
 */
export const useSignOut = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signOut = useCallback(
        <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
            return execute(async () => {
                const value = await client.signOut({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                if (value.success) {
                    broadcast({ type: "session:clear" })
                }
                return value as unknown as SignOutReturn<Options>
            })
        },
        [client, execute, redirect]
    )

    return { signOut, isPending } as const
}
