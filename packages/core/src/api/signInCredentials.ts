import { AuraAuthError } from "@/shared/errors.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/shared/crypto.ts"
import { createValidation, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext, SignInCredentialsAPIOptions, SignInCredentialsAPIReturn } from "@/@types/api.ts"

export const signInCredentials = async ({
    ctx,
    payload,
    request: requestInit,
    headers: headerInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
}: FunctionAPIContext<SignInCredentialsAPIOptions>): Promise<SignInCredentialsAPIReturn> => {
    const { cookies, credentials, sessionStrategy, logger } = ctx
    try {
        const { request, rateLimit } = await createValidation(ctx, headerInit)
            .verifyCSRFToken(skipCSRFCheck)
            .buildRequest(requestInit, "/signIn/credentials")
            .verifyRateLimit("signInCredentials")
            .execute()

        if (rateLimit) {
            return rateLimit as SignInCredentialsAPIReturn
        }

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

        const builder = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes)
            .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)

        const { redirect: shouldRedirectServer, redirectURL } = await resolveApiRedirect(
            ctx,
            request,
            redirect,
            redirectTo,
            builder
        )

        const toHeaders = builder.toHeaders()
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
        const { code, message, statusCode } = handleApiError(
            error,
            "CREDENTIALS_SIGN_IN_ERROR",
            "An error occurred during credentials sign-in.",
            401
        )
        const headers = new Headers(secureApiHeaders)
        const invalidCredentials: SignInCredentialsAPIReturn = {
            success: false,
            headers,
            redirect: false,
            redirectURL: null,
            error: { code, message },
            toResponse: () => {
                return Response.json({ success: false, redirect: false, redirectURL: null }, { headers, status: statusCode })
            },
        }
        if (error instanceof AuraAuthError && error.code === "AUTH_CREDENTIALS_INVALID") {
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
