import { AuraAuthError } from "@/shared/errors.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/shared/crypto.ts"
import {
    createValidation,
    errorToLogMessage,
    handleApiError,
    resolveApiRedirect,
    toStandardizedHeaders,
} from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignInCredentialsAPIOptions, SignInCredentialsAPIReturn } from "@/@types/api.ts"

export const signInCredentials = async ({
    ctx,
    payload,
    request: requestInit,
    headers: headerInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<SignInCredentialsAPIOptions>): Promise<SignInCredentialsAPIReturn> => {
    const { cookies, credentials, sessionStrategy, logger } = ctx
    try {
        const { request, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headerInit ?? requestInit?.headers ?? {})
        )
            .buildRequest(requestInit, "/signIn/credentials")
            .verifyRateLimit("signInCredentials")
            .verifyCSRFToken(skipCSRFCheck && !!doubleSubmitToken)
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
        const sessionToken = await sessionStrategy.signInCredentials(session, request)
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
        const {
            errors: { code, message },
            statusCode,
        } = handleApiError(error, "CREDENTIALS_SIGN_IN_ERROR", "An error occurred during credentials sign-in.", 401)
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
            errorToLogMessage(error, "INVALID_CREDENTIALS", logger)
            return invalidCredentials
        }
        errorToLogMessage(error, "CREDENTIALS_SIGN_IN_FAILED", logger)
        return invalidCredentials
    }
}
