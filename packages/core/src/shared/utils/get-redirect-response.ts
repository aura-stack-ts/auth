import { HeadersBuilder } from "@aura-stack/router"
import { createRedirectTo } from "@/shared/oauth2/authorization.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { APIOptionsWithRedirectTo, APIOptionsWithRequest } from "@/@types/api.ts"

export const getRedirectResponse = async ({
    context: { ctx, redirect = true, redirectTo, fallbackRedirectTo },
    headers,
    status,
    request,
}: {
    request: Request
    status?: number
    headers: Headers | HeadersBuilder
    context: FunctionAPIContext<APIOptionsWithRequest & APIOptionsWithRedirectTo>
}) => {
    let redirectURL: string | null = await createRedirectTo(request!, redirectTo, ctx, fallbackRedirectTo)
    redirectURL = redirectTo ? redirectURL : redirectURL === "/" ? null : redirectURL

    if (redirect && redirectURL) {
        if (headers instanceof HeadersBuilder) {
            headers.setHeader("Location", redirectURL)
        } else {
            headers.set("Location", redirectURL)
        }
    }

    const shouldRedirectServer = redirect && !!redirectURL
    return {
        redirect: shouldRedirectServer ?? false,
        redirectURL: shouldRedirectServer ? null : redirectURL,
        status: shouldRedirectServer ? 302 : (status ?? 200),
    }
}
