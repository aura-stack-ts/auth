import type { LiteralUnion } from "@/@types/index.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { SignInOptions, SignInReturn } from "@/@types/client.ts"

export const signIn = (client: InternalAuthClient) => {
    return async <Options extends SignInOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ): Promise<SignInReturn<Options>> => {
        try {
            const { redirectTo } = options ?? {}
            // @ts-ignore
            const response = await client.get("/signIn/:oauth", {
                params: {
                    oauth,
                },
                searchParams: {
                    redirectTo,
                    redirect: false,
                },
            })
            const json = await response.json()
            if (options?.redirect === true && typeof window !== "undefined" && json?.signInURL) {
                window.location.assign(json.signInURL)
            }
            return json as unknown as SignInReturn<Options>
        } catch (error) {
            console.error("Error during sign-in:", error)
            return { success: false, redirect: false, signInURL: "/" } as unknown as SignInReturn<Options>
        }
    }
}
