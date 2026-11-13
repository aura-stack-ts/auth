import { clientAuthResponse } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { VerifyEmailChangeOptions, VerifyEmailChangeReturn } from "@/@types/index.ts"

export const verifyEmailChange = ({ client, getSafeRedirect }: ClientContext) => {
    return async <Options extends VerifyEmailChangeOptions>(options: Options): Promise<VerifyEmailChangeReturn<Options>> => {
        try {
            const redirectTo = getSafeRedirect(options)
            const response = await client.get("/email/change/verify", {
                searchParams: { token: options.payload.token, redirectTo, redirect: false },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as VerifyEmailChangeReturn<Options>
        } catch (error) {
            console.error("Error verifying email change:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as VerifyEmailChangeReturn<Options>
        }
    }
}
