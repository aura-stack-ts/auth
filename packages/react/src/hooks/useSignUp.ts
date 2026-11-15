import { useCallback } from "react"
import { broadcast } from "@/context.tsx"
import { performRedirect, useAssertContext, useAsyncAction } from "@/utils.ts"
import type { SignUpOptions, SignUpReturn } from "@aura-stack/auth/types"

/**
 * Signs up a new user.
 *
 * @returns An object containing the signUp function and a isPending state
 * @example
 * const Page = () => {
 *   const { signUp, isPending } = useSignUp()
 *
 *   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 *     event.preventDefault()
 *     const formData = new FormData(event.currentTarget)
 *     const username = formData.get("username") as string
 *     const password = formData.get("password") as string
 *     await signUp({ payload: { username, password }, redirectTo: "/dashboard" })
 *   }
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="username" type="text" placeholder="Username" required />
 *       <input name="password" type="password" placeholder="Password" required />
 *       <button type="submit" disabled={isPending}>Sign Up</button>
 *     </form>
 *   )
 * }
 */
export const useSignUp = <Payload extends Record<string, any> = Record<string, any>>() => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signUp = useCallback(
        <Options extends SignUpOptions<Payload>>(options: Options): Promise<SignUpReturn<Options>> => {
            return execute(async () => {
                const value = await client.signUp({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, value.redirectURL)
                }
                if (value.success) {
                    broadcast({ type: "session:sync" })
                }
                return value
            })
        },
        [client, execute, redirect]
    )

    return { signUp, isPending } as const
}
