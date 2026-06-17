import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/shared/crypto.ts"
import { createRedirectTo, getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import type { FunctionAPIContext, SignInCredentialsAPIOptions, SignInCredentialsAPIReturn } from "@/@types/api.ts"

export const signInCredentials = async ({
    ctx,
    payload,
    request: requestInit,
    headers: headerInit,
    redirect = true,
    redirectTo,
}: FunctionAPIContext<SignInCredentialsAPIOptions>): Promise<SignInCredentialsAPIReturn> => {
    const { cookies, credentials, sessionStrategy, logger } = ctx
    try {
        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers: headerInit })
            const url = `${origin}${ctx.basePath}/signIn/credentials`
            request = new Request(url, { headers: headerInit })
        }
        await getOriginURL(request, ctx)

        const session = await credentials?.authorize({
            credentials: payload,
            deriveSecret: credentials?.hash ?? hashPassword,
            verifySecret: credentials?.verify ?? verifyPassword,
        })
        if (!session) {
            throw new AuraAuthError({ code: "AUTH_CREDENTIALS_INVALID" })
        }
        const sessionToken = await sessionStrategy.createSession(session)
        const csrfToken = await createCSRF(ctx.jose)
        logger?.log("CREDENTIALS_SIGN_IN_SUCCESS")

        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)

        let redirectURL: string | null = await createRedirectTo(request, redirectTo, ctx)
        redirectURL = redirectTo ? redirectURL : redirectURL === "/" ? null : redirectURL

        if (redirect && redirectURL) {
            headers.setHeader("Location", redirectURL)
        }

        const shouldRedirectServer = redirect && !!redirectURL
        const toHeaders = headers.toHeaders()
        return {
            success: true,
            headers: toHeaders,
            redirect: shouldRedirectServer,
            redirectURL: redirect ? null : redirectURL,
            toResponse: () =>
                Response.json(
                    { success: true, redirect: shouldRedirectServer, redirectURL: shouldRedirectServer ? null : redirectURL },
                    { headers: toHeaders, status: shouldRedirectServer ? 302 : 200 }
                ),
        } as SignInCredentialsAPIReturn
    } catch (error) {
        let code = "CREDENTIALS_SIGN_IN_ERROR"
        let message = "An error occurred during credentials sign-in."
        if (isAuraAuthError(error)) {
            code = error.code
            message = error.userMessage
        }
        const headers = new Headers(secureApiHeaders)
        const invalidCredentials: SignInCredentialsAPIReturn = {
            success: false,
            headers,
            redirect: false,
            redirectURL: null,
            error: { code, message },
            toResponse: () => {
                return Response.json({ success: false, redirect: false, redirectURL: null }, { headers, status: 401 })
            },
        }
        if (isAuraAuthError(error) && error.code === "AUTH_CREDENTIALS_INVALID") {
            logger?.log("INVALID_CREDENTIALS", {
                severity: "warning",
                structuredData: { path: "/signIn/credentials" },
            })
            return invalidCredentials
        }
        logger?.log("CREDENTIALS_SIGN_IN_FAILED", {
            severity: "error",
            structuredData: { path: "/signIn/credentials" },
        })
        return invalidCredentials
    }
}
