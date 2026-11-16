import { useCallback } from "react"
import { broadcast } from "@/context.tsx"
import { performRedirect, useAssertContext, useAsyncAction } from "@/utils.ts"
import type { SignInCredentialsOptions, SignInCredentialsReturn } from "@aura-stack/auth/types"

/**
 * Signs in a user using their credentials (e.g. username and password).
 *
 * @returns An object containing the signInCredentials function and a isPending state
 * @example
 * const Page = () => {
 *   const { signInCredentials, isPending } = useSignInCredentials()
 *
 *   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 *     event.preventDefault()
 *     const formData = new FormData(event.currentTarget)
 *     const username = formData.get("username") as string
 *     const password = formData.get("password") as string
 *     await signInCredentials({ payload: { username, password }, redirectTo: "/dashboard" })
 *   }
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="username" type="text" placeholder="Username" required />
 *       <input name="password" type="password" placeholder="Password" required />
 *       <button type="submit" disabled={isPending}>Sign In</button>
 *     </form>
 *   )
 * }
 */
export const useSignInCredentials = () => {
    const { client, redirect } = useAssertContext()
    const { execute, isPending } = useAsyncAction()

    const signInCredentials = useCallback(
        <Options extends SignInCredentialsOptions>(options: Options): Promise<SignInCredentialsReturn<Options>> => {
            return execute(async () => {
                const value = await client.signInCredentials({
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

    return { signInCredentials, isPending } as const
}
