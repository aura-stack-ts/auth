import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { SendMagicLinkOptions, SendMagicLinkReturn } from "@/@types/index.ts"

export const sendMagicLink = (ctx: ClientContext) => {
    return async <Options extends SendMagicLinkOptions>(
        email: string,
        options?: Options
    ): Promise<SendMagicLinkReturn<Options>> => {
        try {
            const redirectTo = ctx.getSafeRedirect(options)
            const csrfToken = await getCSRFToken(ctx)
            const response = await ctx.client.post("/signIn/magicLink", {
                body: { email },
                searchParams: { redirectTo, redirect: false },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SendMagicLinkReturn<Options>
        } catch (error) {
            console.error("Error sending magic link:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as SendMagicLinkReturn<Options>
        }
    }
}
