import { clientAuthResponse } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { VerifyMagicLinkOptions, VerifyMagicLinkReturn } from "@/@types/index.ts"

export const verifyMagicLink = (client: InternalAuthClient) => {
    return async <Options extends VerifyMagicLinkOptions>(
        token: string,
        options?: Options
    ): Promise<VerifyMagicLinkReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const response = await client.get("/signIn/magicLink/verify", {
                searchParams: { token, redirectTo, redirect: false },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as VerifyMagicLinkReturn<Options>
        } catch (error) {
            console.error("Error verifying magic link:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as VerifyMagicLinkReturn<Options>
        }
    }
}
