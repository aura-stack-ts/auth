import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { SendVerificationEmailOptions, SendVerificationEmailReturn } from "@/@types/index.ts"

export const sendVerificationEmail = (client: InternalAuthClient) => {
    return async <Options extends SendVerificationEmailOptions>(
        email: string,
        options?: Options
    ): Promise<SendVerificationEmailReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const csrfToken = await getCSRFToken(client)
            const response = await client.post("/emailVerification/send", {
                body: { email },
                searchParams: { redirectTo, redirect: false },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SendVerificationEmailReturn<Options>
        } catch (error) {
            console.error("Error sending verification email:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as SendVerificationEmailReturn<Options>
        }
    }
}
