import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/exports/crypto.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignInCredentialsAPIOptions, SignInCredentialsAPIReturn } from "@/@types/api.ts"

export const signInCredentials = async ({
    ctx,
    payload,
    request: requestInit,
    headers: headersInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<SignInCredentialsAPIOptions>): Promise<SignInCredentialsAPIReturn> => {
    const { cookies, credentials, logger, session: sessionConfig } = ctx
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        ctx.logger?.log("SIGN_IN_CREDENTIALS_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/signIn/credentials")
            .verifyRateLimit("signInCredentials")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken, true)
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
        const sessionToken = await sessionConfig.strategy.signInCredentials({
            request,
            payload: session,
        })
        const csrfToken = await createCSRF(ctx.jose.instance)
        logger?.log("CREDENTIALS_SIGN_IN_SUCCESS")

        const builder = new HeadersBuilder(headers)
            .setCookie(cookies.store.csrfToken.name, csrfToken, cookies.store.csrfToken.attributes)
            .setCookie(cookies.store.sessionToken.name, sessionToken, cookies.store.sessionToken.attributes)

        const { redirect: shouldRedirectServer, redirectURL } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit: redirect,
            redirectTo,
            headers: builder,
            fallbackRedirectTo,
        })

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
