import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { ChangeEmailOptions, ChangeEmailReturn } from "@/@types/index.ts"

export const changeEmail = (ctx: ClientContext) => {
    return async <Options extends ChangeEmailOptions>(options: Options): Promise<ChangeEmailReturn<Options>> => {
        try {
            const redirectTo = ctx.getSafeRedirect(options)
            const csrfToken = await getCSRFToken(ctx)
            const response = await ctx.client.post("/email/change", {
                body: options.payload,
                searchParams: { redirectTo, redirect: false },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as ChangeEmailReturn<Options>
        } catch (error) {
            console.error("Error during change email:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as ChangeEmailReturn<Options>
        }
    }
}
