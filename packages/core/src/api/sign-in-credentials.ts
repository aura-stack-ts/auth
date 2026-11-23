import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/exports/crypto.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignInCredentialsAPIOptions, SignInCredentialsAPIReturn } from "@/@types/api.ts"

export const signInCredentials = async ({
    ctx,
    payload,
    request: requestInit,
    headers: headersInit,
    redirect: redirectInit = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<SignInCredentialsAPIOptions>): Promise<SignInCredentialsAPIReturn> => {
    const { cookies, credentials, logger, session: sessionConfig } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        ctx.logger?.log("SIGN_IN_CREDENTIALS_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/signIn/credentials")
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

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers: builder,
            fallbackRedirectTo,
        })

        const toHeaders = builder.toHeaders()
        return {
            success: true,
            headers: toHeaders,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            toResponse: () => {
                return Response.json({ success: true, redirect, redirectURL }, { headers: toHeaders, status })
            },
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
