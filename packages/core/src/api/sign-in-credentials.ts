import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import { createCSRF, hashPassword, verifyPassword } from "@/exports/crypto.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
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
    const { credentials, logger, session: sessionConfig } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        ctx.logger?.log("SIGN_IN_CREDENTIALS_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, cookieStore } = await createValidation(ctx, requestInit, headersInit)
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
            cookieStore,
        })
        const csrfToken = await createCSRF(ctx.jose.instance)
        logger?.log("CREDENTIALS_SIGN_IN_SUCCESS")

        const builder = new HeadersBuilder(headers)
            .setCookie(cookieStore.csrfToken.name, csrfToken, cookieStore.csrfToken.attributes)
            .setCookie(cookieStore.sessionToken.name, sessionToken, cookieStore.sessionToken.attributes)

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers: builder,
            fallbackRedirectTo,
        })

        const toHeaders = builder.toHeaders()
        return toAPIResponse<SignInCredentialsAPIReturn>({
            success: true,
            headers: toHeaders,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        const outHeaders = getAuraAuthHeaders(error, headers)

        const { errors, statusCode } = handleApiError(
            error,
            "CREDENTIALS_SIGN_IN_ERROR",
            "An error occurred during credentials sign-in.",
            401
        )
        return toAPIResponse<SignInCredentialsAPIReturn>({
            success: false,
            silent: { error: errors },
            headers: outHeaders,
            redirect: false,
            redirectURL: null,
            status: statusCode,
        })
    }
}
