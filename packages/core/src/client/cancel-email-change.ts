import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { CancelEmailChangeOptions, CancelEmailChangeReturn } from "@/@types/index.ts"

export const cancelEmailChange = (ctx: ClientContext) => {
    return async <Options extends CancelEmailChangeOptions>(options?: Options): Promise<CancelEmailChangeReturn<Options>> => {
        try {
            const redirectTo = ctx.getSafeRedirect(options)
            const token = options?.payload?.token
            const csrfToken = token ? undefined : await getCSRFToken(ctx)
            const response = await ctx.client.get("/email/change/cancel", {
                searchParams: { token, redirectTo, redirect: false },
                ...(csrfToken ? { headers: { "X-CSRF-Token": csrfToken } } : {}),
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as CancelEmailChangeReturn<Options>
        } catch (error) {
            console.error("Error cancelling email change:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as CancelEmailChangeReturn<Options>
        }
    }
}
