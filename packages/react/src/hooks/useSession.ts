import { useAssertContext } from "@/utils.ts"
import type { User } from "@aura-stack/auth"

/**
 * Gets the current authentication session and status.
 *
 * @returns An object containing the current session, status and a isPending
 * @example
 * const Page = () => {
 *   const { session, status, isPending } = useSession()
 *   if (isPending) {
 *     return <div>Loading...</div>
 *   }
 *   return <div>{session ? `Hello, ${session.user.name}` : "Not signed in"}</div>
 * }
 */
export const useSession = <DefaultUser extends User = User>() => {
    const { session, status } = useAssertContext<DefaultUser>()
    return { session, status, isPending: status === "pending" } as const
}
