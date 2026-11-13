import { clientAuthResponse } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { ResetPasswordOptions, ResetPasswordReturn } from "@/@types/index.ts"

export const resetPassword = ({ client, getSafeRedirect }: ClientContext) => {
    return async <Options extends ResetPasswordOptions>(options: Options): Promise<ResetPasswordReturn<Options>> => {
        try {
            const redirectTo = getSafeRedirect(options)
            const response = await client.post("/password/reset", {
                body: options.payload,
                searchParams: { redirectTo, redirect: false },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as ResetPasswordReturn<Options>
        } catch (error) {
            console.error("Error during reset password:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as ResetPasswordReturn<Options>
        }
    }
}
