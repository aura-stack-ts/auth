import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { SignInCredentialsOptions, SignInCredentialsReturn } from "@/@types/client.ts"

export const signInCredentials = (ctx: ClientContext) => {
    return async <Options extends SignInCredentialsOptions>(options: Options): Promise<SignInCredentialsReturn<Options>> => {
        try {
            const csrfToken = await getCSRFToken(ctx)
            const redirectTo = ctx.getSafeRedirect(options)
            const response = await ctx.client.post("/signIn/credentials", {
                body: options.payload,
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
            return json as unknown as SignInCredentialsReturn<Options>
        } catch (error) {
            console.error("Error during credentials sign-in:", error)
            return { success: false, redirectURL: null } as unknown as SignInCredentialsReturn<Options>
        }
    }
}
