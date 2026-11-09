import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { ChangePasswordOptions, ChangePasswordReturn } from "@/@types/index.ts"

export const changePassword = (client: InternalAuthClient) => {
    return async <Options extends ChangePasswordOptions>(options: Options): Promise<ChangePasswordReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            const csrfToken = await getCSRFToken(client)
            const response = await client.post("/password/change", {
                body: options.payload,
                searchParams: { redirectTo, redirect: false },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as ChangePasswordReturn<Options>
        } catch (error) {
            console.error("Error during change password:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as ChangePasswordReturn<Options>
        }
    }
}
