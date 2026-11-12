import { AuraAuthError } from "@/errors/aura-error.ts"
import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, resolveApiRedirect } from "@/shared/utils/api.ts"
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
    }: FunctionAPIContext<SendMagicLinkAPIOptions>
): Promise<SendMagicLinkAPIReturn> => {
    const { logger, session, magicLinks } = ctx
    if (!magicLinks?.sendMagicLinkEmail) {
        throw new AuraAuthError({ code: "MAGIC_LINK_SEND_EMAIL_NOT_IMPLEMENTED" })
    }
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        logger?.log("SEND_MAGIC_LINK_INITIATED", {
            structuredData: {
                email,
                allowSignUp: magicLinks?.allowSignUp ?? false,
            },
        })
        const { request, rateLimit, origin } = await createValidation(ctx, headers)
            .buildRequest(requestInit, "/signIn/magicLink")
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .verifyRateLimit("sendMagicLink")
            .execute()
        if (rateLimit) {
            return rateLimit as SendMagicLinkAPIReturn
        }
        const { token, url } = await session.strategy.sendMagicLink({
            email,
            origin,
            allowSignUp: magicLinks?.allowSignUp ?? false,
        })

        await magicLinks.sendMagicLinkEmail({ email, token, url })

        const { redirect, redirectURL } = await resolveApiRedirect(ctx, request, redirectInit, redirectTo, headers)
        return {
            success: true,
            redirect,
            redirectURL: redirect ? null : redirectURL,
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        redirect,
                        redirectURL: redirect ? null : redirectURL,
                    },
                    { headers, status: redirect ? 302 : 200 }
                )
            },
        } as SendMagicLinkAPIReturn
    } catch (error) {
        errorToLogMessage(error, "SEND_MAGIC_LINK_ERROR", logger)
        const { errors } = handleApiError(error, "SEND_MAGIC_LINK_ERROR", "An error occurred while sending the magic link.")

        return {
            success: false,
            error: errors,
            redirect: false,
            redirectURL: null,
            headers,
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
                    { headers, status: 200 }
                )
            },
        }
    }
}
