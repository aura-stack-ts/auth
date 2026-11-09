import { clientAuthResponse, getCSRFToken } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { SignUpOptions, SignUpReturn } from "@/@types/client.ts"

export const signUp = <SignUpPayload extends Record<string, any> = Record<string, any>>(client: InternalAuthClient) => {
    return async <Options extends SignUpOptions<SignUpPayload>>(options: Options): Promise<SignUpReturn<Options>> => {
        try {
            const csrfToken = await getCSRFToken(client)
            const { redirectTo } = options ?? {}
            // @ts-ignore
            const response = await client.post("/signUp", {
                body: options.payload,
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
            })
            // @ts-ignore
            const json: any = await clientAuthResponse(response)
            if (options?.redirect === true && typeof window !== "undefined" && json?.redirectURL) {
                window.location.assign(json.redirectURL)
            }
            return json as unknown as SignUpReturn<Options>
        } catch (error) {
            console.error("Error during sign-up:", error)
            return { success: false, redirect: false, redirectURL: null } as unknown as SignUpReturn<Options>
        }
    }
}
