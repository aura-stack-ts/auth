import type { ChangeEmailOptions, ChangeEmailReturn } from "@/@types/index.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"

export const changeEmail = (client: InternalAuthClient) => {
    return async <Options extends ChangeEmailOptions>(options: Options): Promise<ChangeEmailReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const csrfToken = await getCSRFToken(client)
            const response = await client.post("/email/change", {
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
