import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { UpdateSessionOptions, UpdateSessionReturn, User } from "@/@types/index.ts"

export const updateSession = <DefaultUser extends User = User>(ctx: ClientContext) => {
    return async <Options extends UpdateSessionOptions<DefaultUser>>(
        options: Options
    ): Promise<UpdateSessionReturn<Options, DefaultUser>> => {
        try {
            const csrfToken = await getCSRFToken(ctx)
            const { session } = options ?? {}
            const redirectTo = ctx.getSafeRedirect(options)
            if (!session) {
                return { success: false, session: null } as UpdateSessionReturn<Options, DefaultUser>
            }
            const user = session.user ?? {}
            const response = await ctx.client.patch("/session", {
                body: {
                    // @ts-ignore - Fix type here - go to @aura-stack/router.
                    user,
                    // @ts-ignore - Fix type here - go to @aura-stack/router.
                    expires: session.expires ? new Date(session.expires) : undefined,
                },
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as UpdateSessionReturn<Options, DefaultUser>
        } catch (error) {
            console.error("Error updating session:", error)
            return { success: false, session: null } as UpdateSessionReturn<Options, DefaultUser>
        }
    }
}
