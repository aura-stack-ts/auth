import { HeadersBuilder } from "@aura-stack/router"
import { createCSRF } from "@/shared/crypto.ts"
import { getErrorName } from "@/shared/utils.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SignUpAPIOptions, SignUpAPIReturn } from "@/@types/api.ts"

export const signUp = async <Payload extends Record<string, unknown> = Record<string, unknown>>({
    ctx,
    payload,
    headers: headersInit,
    request: requestInit,
    redirect = true,
    redirectTo,
    skipCSRFCheck = false,
    doubleSubmitToken = undefined,
}: FunctionAPIContext<SignUpAPIOptions<Payload>>): Promise<SignUpAPIReturn> => {
    const { signUp, cookies, sessionStrategy, logger } = ctx
    try {
        const { request, rateLimit } = await createValidation(ctx, headersInit)
            .verifyCSRFToken(skipCSRFCheck && !!doubleSubmitToken)
            .buildRequest(requestInit, "/signUp")
            .verifyRateLimit("signUp")
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

        const sessionToken = await sessionStrategy.signUp(user, request)
        const csrfToken = await createCSRF(ctx.jose)
        logger?.log("SIGN_UP_SUCCESS")

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
            redirect: shouldRedirectServer,
            redirectURL: redirect ? null : redirectURL,
            headers: toHeaders,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect: shouldRedirectServer,
                        redirectURL: shouldRedirectServer ? null : redirectURL,
                    },
                    { headers: toHeaders, status: shouldRedirectServer ? 302 : 200 }
                )
            },
        } as SignUpAPIReturn
    } catch (error) {
        logger?.log("SIGN_UP_ERROR", {
            structuredData: {
                error_type: getErrorName(error),
                error_code: error instanceof AuraAuthError ? error.code : "UNKNOWN_ERROR",
                error_message: error instanceof Error ? error.message : String(error),
            },
        })
        const { code, message, statusCode } = handleApiError(error, "SIGN_UP_ERROR", "An error occurred during sign-up.")

        return {
            success: false,
            error: {
                code,
                message,
            },
            redirect: false,
            headers: new Headers(secureApiHeaders),
            redirectURL: null,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    { headers: secureApiHeaders, status: statusCode }
                )
            },
        }
    }
}
