import { useCallback } from "react"
import { broadcast } from "@/context.tsx"
import { performRedirect, useAssertContext, useAsyncAction } from "@/utils.ts"
import type { User } from "@aura-stack/auth"
import type { UpdateSessionOptions, UpdateSessionReturn } from "@aura-stack/auth/types"

/**
 * Updates the current user's session.
 *
 * @returns An object containing the updateSession function and a isPending state
 * @example
 * const Page = () => {
 *   const { session } = useSession()
 *   const { updateSession, isPending } = useUpdateSession()
 *
 *   const handleUpdate = async () => {
 *     if (session) {
 *       await updateSession({ session: { user: { name: "New Name" } } })
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <p>Name: {session?.user.name}</p>
 *       <button onClick={handleUpdate} disabled={isPending}>Update Name</button>
 *     </div>
 *   )
 * }
 */
export const useUpdateSession = <DefaultUser extends User = User>() => {
    const { client, redirect } = useAssertContext<DefaultUser>()
    const { execute, isPending } = useAsyncAction()

    const updateSession = useCallback(
        <Options extends UpdateSessionOptions<DefaultUser>>(
            options: Options
        ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
            return execute(async () => {
                const updated = await client.updateSession({
                    ...options,
                    redirect: false,
                })
                if (options?.redirect === true) {
                    await performRedirect(redirect, updated.redirectURL)
                }
                if (updated.success) {
                    broadcast({ type: "session:update", payload: updated.session })
                }
                return updated
            })
        },
        [client, execute, redirect]
    )

    return { updateSession, isPending } as const
}
