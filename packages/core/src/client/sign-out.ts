import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { SignOutOptions, SignOutReturn } from "@/@types/index.ts"

export const signOut = (ctx: ClientContext) => {
    return async <Options extends SignOutOptions>(options?: Options): Promise<SignOutReturn<Options>> => {
        try {
            const redirectTo = ctx.getSafeRedirect(options)
            const csrfToken = await getCSRFToken(ctx)
            const response = await ctx.client.post("/signOut", {
                searchParams: {
                    redirectTo,
                    redirect: false,
                    token_type_hint: "session_token",
                },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignOutReturn<Options>
        } catch (error) {
            console.error("Error during sign-out:", error)
            return { success: false, redirect: false, redirectURL: "/" } as unknown as SignOutReturn<Options>
        }
    }
}
