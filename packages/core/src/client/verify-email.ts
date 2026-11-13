import { clientAuthResponse } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { VerifyEmailOptions, VerifyEmailReturn } from "@/@types/index.ts"

export const verifyEmail = ({ client, getSafeRedirect }: ClientContext) => {
    return async <Options extends VerifyEmailOptions>(token: string, options?: Options): Promise<VerifyEmailReturn<Options>> => {
        try {
            const redirectTo = getSafeRedirect(options)
            const response = await client.get("/emailVerification/verify", {
                searchParams: { token, redirectTo, redirect: false },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as VerifyEmailReturn<Options>
        } catch (error) {
            console.error("Error verifying email:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as VerifyEmailReturn<Options>
        }
    }
}
