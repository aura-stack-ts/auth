import { HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/exports/crypto.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignUpAPIOptions, SignUpAPIReturn } from "@/@types/api.ts"

export const signUp = async <Payload extends Record<string, unknown> = Record<string, unknown>>({
    ctx,
    payload,
    headers: headersInit,
    request: requestInit,
    redirect: redirectInit = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
    fallbackRedirectTo = undefined,
}: FunctionAPIContext<SignUpAPIOptions<Payload>>): Promise<SignUpAPIReturn> => {
    const { signUp, session, logger } = ctx
    const headers = new Headers(secureApiHeaders)
    try {
        ctx.logger?.log("SIGN_UP_INITIATED", {
            structuredData: {
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { request, rateLimit, cookieStore } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/signUp")
            .verifyRateLimit("signUp")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken, true)
            .execute()

        if (rateLimit) {
            return rateLimit as SignUpAPIReturn
        }

        const user = await signUp?.onCreateUser({
            payload,
        })
        if (!user) {
            throw new AuraAuthError({ code: "USER_CREATION_FAILED" })
        }

        const sessionToken = await session.strategy.signUp({
            request,
            payload: user,
        })
        const csrfToken = await createCSRF(ctx.jose.instance)
        logger?.log("SIGN_UP_SUCCESS")

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
        return toAPIResponse<SignUpAPIReturn>({
            success: true,
            redirect,
            redirectURL,
            headers: toHeaders,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "SIGN_UP_ERROR", logger)
        const { errors, statusCode } = handleApiError(error, "SIGN_UP_ERROR", "An error occurred during sign-up.")

        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<SignUpAPIReturn>({
            success: false,
            silent: { error: errors },
            headers: outHeaders,
            redirect: false,
            redirectURL: null,
            status: statusCode,
        })
    }
}
