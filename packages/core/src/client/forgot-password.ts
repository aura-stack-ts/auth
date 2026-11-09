import { clientAuthResponse } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { ForgotPasswordOptions, ForgotPasswordReturn } from "@/@types/index.ts"

export const forgotPassword = (client: InternalAuthClient) => {
    return async <Options extends ForgotPasswordOptions>(
        email: string,
        options?: Options
    ): Promise<ForgotPasswordReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const response = await client.post("/password/forgot", {
                body: { email },
                searchParams: { redirectTo, redirect: false },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as ForgotPasswordReturn<Options>
        } catch (error) {
            console.error("Error during forgot password:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as ForgotPasswordReturn<Options>
        }
    }
}
