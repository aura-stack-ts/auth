import { AuraAuthError } from "@/errors/aura-error.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { SendMagicLinkAPIOptions, SendMagicLinkAPIReturn } from "@/@types/api.ts"

export const sendMagicLink = async (
    email: string,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        redirectTo,
        redirect: redirectInit = true,
        skipCSRFCheck = false,
        doubleSubmitToken = undefined,
        fallbackRedirectTo = undefined,
    }: FunctionAPIContext<SendMagicLinkAPIOptions>
): Promise<SendMagicLinkAPIReturn> => {
    const { logger, session, magicLinks } = ctx
    if (!magicLinks?.sendMagicLinkEmail) {
        throw new AuraAuthError({ code: "MAGIC_LINK_SEND_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = new Headers(secureApiHeaders)
    try {
        logger?.log("SEND_MAGIC_LINK_INITIATED", {
            structuredData: {
                email,
                allowSignUp: magicLinks?.allowSignUp ?? false,
            },
        })
        const { request, rateLimit, origin, cookieStore } = await createValidation(ctx, requestInit, headersInit)
            .buildRequest("/signIn/magicLink")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifyRateLimit("sendMagicLink")
            .execute()
        if (rateLimit) {
            return rateLimit as SendMagicLinkAPIReturn
        }
        const { token, url } = await session.strategy.sendMagicLink({
            email,
            origin,
            cookieStore,
            allowSignUp: magicLinks?.allowSignUp ?? false,
        })

        await magicLinks.sendMagicLinkEmail({ email, token, url })

        const { redirect, redirectURL, status } = await resolveApiRedirect({
            ctx,
            request,
            redirectInit,
            redirectTo,
            headers,
            fallbackRedirectTo,
        })
        return {
            success: true,
            redirect,
            redirectURL,
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL,
                    },
                    { headers, status }
                )
            },
        } as SendMagicLinkAPIReturn
    } catch (error) {
        errorToLogMessage(error, "SEND_MAGIC_LINK_ERROR", logger)
        const { errors } = handleApiError(error, "SEND_MAGIC_LINK_ERROR", "An error occurred while sending the magic link.")
        const outHeaders = getAuraAuthHeaders(error, headers)

        return {
            success: false,
            error: errors,
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        redirectURL: null,
                    },
                    /**
                     * For security reasons, we always return a 200 status code to avoid leaking information
                     * about the existence of the email address or enumeration attacks.
                     */
                    { headers: outHeaders, status: 200 }
                )
            },
        }
    }
}
